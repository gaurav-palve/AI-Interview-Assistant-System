from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):

    PISTON_API_URL: str = ""
    MONGO_URI: str = 'mongodb://localhost:27017/'
    DB_NAME: str = 'interview_assistant'
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""  
    TA_TEAM_EMAIL: str = "mikeross060505@gmail.com"
    
    # ElevenLabs Configuration
    ELEVENLABS_API_KEY: str = ""   # Will be loaded from .env
    ELEVENLABS_AGENT_ID: str = ""  # Will be loaded from .env
    
    # SMTP Configuration for Email Notifications
    SMTP_SERVER: str = 'smtp-mail.outlook.com'
    SMTP_PORT: str = '587'
    SMTP_USERNAME: str = ''  # Will be loaded from .env
    SMTP_PASSWORD: str = ''  # Will be loaded from .env
    FROM_EMAIL: str = ''     # Will be loaded from .env
    
    # Microsoft OAuth2 Configuration
    MS_CLIENT_ID: str = ''   # Will be loaded from .env
    MS_CLIENT_SECRET: str = '' # Will be loaded from .env
    MS_TENANT_ID: str = ''   # Will be loaded from .env
    MS_SCOPE: str = 'https://outlook.office.com/SMTP.Send'
    
    # Use OAuth2 for SMTP authentication (set to False to use password auth)
    USE_OAUTH2: bool = True

    FRONTEND_URL: str
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
