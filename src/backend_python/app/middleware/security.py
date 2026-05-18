"""Semantic-perimeter security middleware (E-JUST CSE323 §3 mandate).

Two independent concerns live here:

1. ``PromptInjectionGuard`` — a pure-ASGI middleware that buffers the request
   body of mutating requests and rejects payloads containing known
   prompt-injection / jailbreak vectors before they reach any route handler.

2. ``RedactionFilter`` / ``redact`` — a logging filter that masks PII
   (emails, passwords, card numbers, tokens) so secrets never reach the
   terminal or log files.

Pure ASGI is used for the guard (not ``BaseHTTPMiddleware``) so the buffered
body can be replayed to downstream handlers without consuming the receive
stream.
"""

from __future__ import annotations

import json
import logging
import re
from collections.abc import Awaitable, Callable

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# ─── Prompt-injection detection ─────────────────────────────────────────────

# Case-insensitive substrings/patterns that indicate an attempt to override
# system instructions or jailbreak an LLM consuming this data downstream.
_INJECTION_PATTERNS: tuple[re.Pattern[str], ...] = tuple(
    re.compile(p, re.IGNORECASE)
    for p in (
        r"ignore (all |the |your )?(previous|prior|above) (instructions|prompts?|context)",
        r"disregard (all |the |your )?(previous|prior|above)",
        r"forget (everything|all|your) (you know|instructions|previous)",
        r"you are now (a|an|the)\b",
        r"system\s*(prompt|directive|override|message)",
        r"\[\s*system\b",
        r"</?\s*system\s*>",
        r"<\|\s*(im_start|im_end|system|endoftext)\s*\|>",
        r"developer mode",
        r"jailbreak",
        r"reveal (your|the) (system )?(prompt|instructions)",
        r"print (your|the) (system )?(prompt|instructions)",
        r"act as (a |an )?(dan|root|admin|unrestricted)",
        r"do anything now",
    )
)

# Methods whose body we inspect. GET/DELETE/HEAD carry no meaningful body.
_GUARDED_METHODS = frozenset({"POST", "PUT", "PATCH"})

# Cap how much body we buffer/scan — refuse pathologically large payloads.
_MAX_SCAN_BYTES = 1_000_000

log = logging.getLogger("app.security")


def detect_injection(text: str) -> str | None:
    """Return the name of the first matched injection pattern, or None."""
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(text):
            return pattern.pattern
    return None


class PromptInjectionGuard:
    """ASGI middleware that blocks prompt-injection payloads on mutating routes."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope.get("method") not in _GUARDED_METHODS:
            await self.app(scope, receive, send)
            return

        # Buffer the full body so we can both scan it and replay it downstream.
        buffered: list[Message] = []
        body = b""
        more_body = True
        while more_body:
            message = await receive()
            buffered.append(message)
            body += message.get("body", b"")
            more_body = message.get("more_body", False)
            if len(body) > _MAX_SCAN_BYTES:
                break

        if len(body) > _MAX_SCAN_BYTES:
            await _reject(scope, send, "PAYLOAD_TOO_LARGE",
                          "Request body exceeds the inspection limit.", 413)
            return

        try:
            text = body.decode("utf-8", errors="ignore")
        except Exception:  # pragma: no cover - decode is lenient
            text = ""

        matched = detect_injection(text)
        if matched:
            log.warning(
                "prompt-injection blocked: path=%s pattern=%r",
                scope.get("path"), matched,
            )
            await _reject(
                scope, send, "PROMPT_INJECTION_BLOCKED",
                "Request payload contains a disallowed instruction-override pattern.",
                400,
            )
            return

        # Replay the buffered messages to the downstream app.
        iterator = iter(buffered)

        async def replay() -> Message:
            try:
                return next(iterator)
            except StopIteration:
                return {"type": "http.request", "body": b"", "more_body": False}

        await self.app(scope, replay, send)


async def _reject(scope: Scope, send: Send, code: str, message: str, status: int) -> None:
    response = JSONResponse(status_code=status, content={"error": message, "code": code})
    await response(scope, _noop_receive, send)


async def _noop_receive() -> Message:
    return {"type": "http.request", "body": b"", "more_body": False}


# ─── PII redaction ──────────────────────────────────────────────────────────

_MASK = "[REDACTED]"

# Standalone value patterns.
_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# 13-19 digit runs, optionally grouped by spaces/dashes — covers card numbers.
_CARD_RE = re.compile(r"\b(?:\d[ -]?){13,19}\b")

# JSON-style "key": "value" pairs whose key names a sensitive field.
_SENSITIVE_KEYS = ("password", "passwd", "pwd", "secret", "token", "jwt",
                    "cvv", "cvc", "card_number", "cardnumber", "credit_card")
_KV_RE = re.compile(
    r'("(?:' + "|".join(_SENSITIVE_KEYS) + r')"\s*:\s*)"[^"]*"',
    re.IGNORECASE,
)


def redact(text: str) -> str:
    """Mask emails, card numbers, and sensitive key/value pairs in ``text``."""
    text = _KV_RE.sub(lambda m: m.group(1) + f'"{_MASK}"', text)
    text = _CARD_RE.sub(_MASK, text)
    text = _EMAIL_RE.sub(_MASK, text)
    return text


class RedactionFilter(logging.Filter):
    """Logging filter that redacts PII from every emitted record."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = redact(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: _redact_arg(v) for k, v in record.args.items()}
            else:
                record.args = tuple(_redact_arg(a) for a in record.args)
        return True


def _redact_arg(value: object) -> object:
    return redact(value) if isinstance(value, str) else value


def install_pii_redaction() -> None:
    """Attach the redaction filter to the root logger and uvicorn loggers."""
    pii_filter = RedactionFilter()
    targets = ["", "uvicorn", "uvicorn.access", "uvicorn.error", "app"]
    for name in targets:
        logger = logging.getLogger(name)
        logger.addFilter(pii_filter)
        for handler in logger.handlers:
            handler.addFilter(pii_filter)
