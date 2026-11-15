from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    cors_origins: str = "http://localhost:3000"
    verification_hmac_secret: str = ""
    verification_bucket: str = "verification-private"
    doc_retention_days: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
