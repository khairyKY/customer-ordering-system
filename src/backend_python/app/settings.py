"""All runtime configuration. Loaded from .env via pydantic-settings."""

import logging
import secrets
from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_log = logging.getLogger("app.settings")

# Historical insecure JWT_SECRET values. Anything in this set (or an empty
# string, or anything shorter than 32 chars) is rejected at load time and
# replaced with an ephemeral per-process random secret + a CRITICAL warning.
# That gives one-line dev setup while making the "live with default secret"
# foot-gun impossible.
_INSECURE_JWT_DEFAULTS = {
    "change-me",
    "change-me-this-must-be-at-least-32-chars-long",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str = "sqlite:///./cos.db"

    # Default left empty so a missing JWT_SECRET trips the validator below
    # rather than silently using a known-insecure value.
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_LIFETIME_SECONDS: int = 86_400

    BCRYPT_ROUNDS: int = 12

    LOCKOUT_THRESHOLD: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    SWEEP_INTERVAL_SECONDS: int = 300
    STALE_THRESHOLD_MINUTES: int = 15

    # Both `localhost` and `127.0.0.1` resolve to the loopback on the same
    # box, but browsers treat them as distinct origins for CORS — list both
    # so the vite dev server works regardless of which one is opened.
    CORS_ORIGINS: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:3001,http://127.0.0.1:3001"
    )

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("JWT_SECRET", mode="after")
    @classmethod
    def _enforce_secure_jwt_secret(cls, v: str) -> str:
        """Refuse to load with a missing, placeholder, or weak JWT_SECRET.

        Generates an ephemeral 48-byte URL-safe secret for this process and
        logs CRITICAL. Tokens minted during this process verify fine, but
        will NOT survive a restart — that is intentional pressure to set a
        real secret in .env (see .env.example).
        """
        if not v or v in _INSECURE_JWT_DEFAULTS or len(v) < 32:
            ephemeral = secrets.token_urlsafe(48)
            _log.critical(
                "JWT_SECRET is missing, a known placeholder, or shorter than "
                "32 chars. Generated an ephemeral random secret for this "
                "process; tokens will NOT survive a restart. Set JWT_SECRET "
                "in .env (see .env.example) before any real use."
            )
            return ephemeral
        return v

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
