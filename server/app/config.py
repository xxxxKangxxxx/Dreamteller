from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    supabase_url: str
    supabase_service_role_key: str
    gemini_api_key: str


settings = Settings()  # type: ignore[call-arg]
