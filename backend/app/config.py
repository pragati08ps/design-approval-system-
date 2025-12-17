"""
Configuration settings for the Design Approval Workflow System.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # MongoDB Configuration
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "design_approval_system"

    # JWT Configuration
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_days: int = 7

    # Application Settings
    app_title: str = "Design Approval Workflow System"
    app_version: str = "1.0.0"
    debug: bool = True

    # CORS Settings
    frontend_url: str = "http://localhost:5173"

    class Config:
        """Pydantic configuration."""
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
