import re
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. PII Redaction Logic (Simple regex for logs/monitoring)
        # In a real app, this would wrap the response or log stream
        PII_PATTERNS = {
            "credit_card": r"\b(?:\d[ -]*?){13,16}\b",
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
        }

        # 2. Prompt Injection Defense (Semantic Perimeter)
        # Check query params or body for common injection strings
        body = await request.body()
        body_str = body.decode("utf-8") if body else ""
        
        INJECTION_KEYWORDS = ["ignore all previous instructions", "system prompt", "as an admin"]
        for keyword in INJECTION_KEYWORDS:
            if keyword in body_str.lower() or keyword in str(request.query_params).lower():
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=403,
                    content={"detail": "SECURITY_VIOLATION: SEMANTIC_INJECTION_DETECTED"}
                )

        response = await call_next(request)
        return response
