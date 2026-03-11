import os

class BaseConfig:
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class LocalDevelopmentConfig(BaseConfig):
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.sqlite3"
    DEBUG = True
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key")
    SECURITY_PASSWORD_SALT = os.environ.get("SECURITY_PASSWORD_SALT", "super-secret-salt")
    SECURITY_PASSWORD_HASH = 'argon2'
    
    # Token Auth
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    SECURITY_TOKEN_MAX_AGE = 3600 # 1 hour
    
    # Flask-Mail (file-based — saves to sent_emails/ folder for demo)
    MAIL_SERVER = 'localhost'
    MAIL_PORT = 1025
    MAIL_USE_TLS = False
    MAIL_USE_SSL = False
    MAIL_DEFAULT_SENDER = 'placement-cell@institute.com'
    MAIL_SUPPRESS_SEND = True  # Don't actually send, just log
    
    # Flask-Caching (Redis as required)
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = 'redis://localhost:6379/2'
    CACHE_DEFAULT_TIMEOUT = 60  # 60 seconds