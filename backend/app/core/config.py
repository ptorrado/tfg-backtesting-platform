from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Backtest Lab API"
    env: str = "dev"  # dev|prod

    # CORS (comma-separated en .env)
    cors_allow_origins: str = "*"

    def cors_origins_list(self) -> list[str]:
        value = self.cors_allow_origins.strip()
        if value == "*" or not value:
            return ["*"]
        return [o.strip() for o in value.split(",") if o.strip()]


settings = Settings()
