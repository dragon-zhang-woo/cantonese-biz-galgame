from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CantoneseBiz API"
    ai_provider: str = "mock"
    ai_scene_provider: str = "deepseek"
    ai_localize_provider: str = "hkchat"
    allow_offline_fallback: bool = True
    ai_cache_ttl_seconds: int = 600
    ai_cache_max_entries: int = 64
    public_ai_budget_cny: float = 0
    public_ai_estimated_turn_cost_cny: float = 0.05
    public_ai_turns_per_client: int = 5
    public_ai_budget_db_path: str = "data/public_api_budget.sqlite3"
    public_ai_client_hash_salt: str = ""
    public_require_dual_model: bool = False
    deepseek_api_key: str = ""
    deepseek_model: str = "deepseek-v4-pro"
    deepseek_base_url: str = "https://api.deepseek.com"
    hkchat_api_key: str = ""
    hkchat_model: str = "t2_hkgai-v3_fp8_1m_e7"
    hkchat_base_url: str = "https://test-new-api.hkchat.app"
    hkchat_enable_thinking: bool = False
    hkchat_reasoning_effort: str = "none"
    hkchat_speech_api_key: str = ""
    hkchat_speech_http_url: str = (
        "https://openspeech.hkgai.net/server_proxy/api/v1/speech_recognize"
    )
    hkchat_speech_ws_url: str = ""
    hkchat_toolhub_app_name: str = ""
    hkchat_toolhub_app_key: str = ""
    hkchat_toolhub_base_url: str = "https://toolhub.prod.hkchat.app"
    hkchat_agenthub_app_name: str = ""
    hkchat_agenthub_app_key: str = ""
    hkchat_agenthub_base_url: str = "https://search-agent.prod.hkchat.app/v1"
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

    @property
    def speech_upload_configured(self) -> bool:
        return bool(self.hkchat_speech_api_key and self.hkchat_speech_http_url)

    @property
    def speech_live_configured(self) -> bool:
        return bool(self.hkchat_speech_api_key and self.hkchat_speech_ws_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
