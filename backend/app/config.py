from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/dash.db"
    prometheus_url: str = ""
    collector_interval: int = 5
    ws_heartbeat: int = 30
    cors_origins: str = "http://localhost:5173"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
