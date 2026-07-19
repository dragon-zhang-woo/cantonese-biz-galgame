from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CantoneseBiz API"
    ai_provider: str = "mock"
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-v4-flash"
    deepseek_base_url: str = "https://api.deepseek.com"
    allowed_origins: str = (
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [value.strip() for value in self.allowed_origins.split(",") if value.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
