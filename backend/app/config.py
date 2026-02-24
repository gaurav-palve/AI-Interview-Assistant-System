import configparser
from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    PISTON_API_URL: str = ""
    MONGO_URI: str = ""
    DB_NAME: str = 'interview_assistant'
    # =========================================
    # Code Execution Provider
    # =========================================
    # Options: "judge0" or "piston"
    CODE_EXECUTOR_PROVIDER: str = "judge0"

    # Judge0 Configuration
    JUDGE0_API_URL: str = "https://ce.judge0.com"

    # Piiston Configuration (optional fallback)
    # PIiSTON_API_URL: str = ""


    # =========================================
    # Database Configuration
    # =========================================
    MONGO_URI: str = "mongodb://localhost:27017/"
    DB_NAME: str = "interview_assistant"


    # =========================================
    # AI API Keys
    # =========================================
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""


    # =========================================
    # TA / Notification Email
    # =========================================
    TA_TEAM_EMAIL: str = "mikeross060505@gmail.com"


    # =========================================
    # ElevenLabs Configuration
    # =========================================
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_AGENT_ID: str = ""


    # =========================================
    # SMTP Configuration
    # =========================================
    SMTP_SERVER: str = "smtp-mail.outlook.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    FROM_EMAIL: str = ""


    # =========================================
    # Microsoft OAuth2 Configuration
    # =========================================
    MS_CLIENT_ID: str = ""
    MS_CLIENT_SECRET: str = ""
    MS_TENANT_ID: str = ""
    MS_SCOPE: str = "https://outlook.office.com/SMTP.Send"

    # Use OAuth2 for SMTP authentication
    USE_OAUTH2: bool = True


    # =========================================
    # Frontend URL
    # =========================================
    FRONTEND_URL: str = ""


    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


settings = Settings()