"""
LeadForge AI — Application Configuration
Reads settings from environment variables with type validation via pydantic-settings.
"""
from functools import lru_cache
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "LeadForge AI"
    app_env: str = "development"
    app_debug: bool = True
    secret_key: str = "change-me-in-production-use-32-chars-minimum"
    access_token_expire_minutes: int = 1440  # 24 hours

    # Database
    database_url: str = "sqlite+aiosqlite:///./leadforge.db"
    sync_database_url: str = "sqlite:///./leadforge.db"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # Google Places API
    google_places_api_key: str = ""

    # Yelp
    yelp_api_key: str = ""

    # OpenAI
    openai_api_key: str = ""

    # Scraping
    crawl_delay_seconds: float = 2.0
    max_concurrent_crawls: int = 5
    request_timeout_seconds: int = 15
    use_mock_adapter: bool = False

    # Export
    export_dir: str = "./exports"
    max_export_rows: int = 50000

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:80"]

    # Rate Limiting
    rate_limit_per_minute: int = 60

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def use_google_adapter(self) -> bool:
        return bool(self.google_places_api_key)

    @property
    def use_openai(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache()
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()


settings = get_settings()
