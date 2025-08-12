import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime

class Logger:
    """
    A utility class for configuring and managing application logging.
    Provides both console and file logging with customizable log levels and formats.
    """
    
    # Default log levels
    CRITICAL = logging.CRITICAL
    ERROR = logging.ERROR
    WARNING = logging.WARNING
    INFO = logging.INFO
    DEBUG = logging.DEBUG
    
    # Singleton instance
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(Logger, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, app_name="interview_assistant", log_level=logging.INFO, 
                 log_to_console=True, log_to_file=True, log_dir="logs"):
        """
        Initialize the logger with the specified configuration.
        
        Args:
            app_name (str): Name of the application (used in log file names)
            log_level (int): Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
            log_to_console (bool): Whether to log to console
            log_to_file (bool): Whether to log to file
            log_dir (str): Directory to store log files
        """
        if self._initialized:
            return
            
        self.app_name = app_name
        self.log_level = log_level
        self.log_to_console = log_to_console
        self.log_to_file = log_to_file
        self.log_dir = log_dir
        
        # Create logs directory if it doesn't exist
        if log_to_file and not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Configure root logger
        self.root_logger = logging.getLogger()
        self.root_logger.setLevel(log_level)
        
        # Clear any existing handlers
        if self.root_logger.handlers:
            self.root_logger.handlers.clear()
        
        # Create formatters
        self.console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        self.file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        )
        
        # Add console handler if enabled
        if log_to_console:
            self._setup_console_handler()
        
        # Add file handler if enabled
        if log_to_file:
            self._setup_file_handler()
        
        self._initialized = True
        
        # Log initialization
        self.info(f"Logger initialized: level={logging.getLevelName(log_level)}, "
                 f"console={log_to_console}, file={log_to_file}")
    
    def _setup_console_handler(self):
        """Set up console handler with appropriate formatter"""
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(self.console_formatter)
        console_handler.setLevel(self.log_level)
        self.root_logger.addHandler(console_handler)
    
    def _setup_file_handler(self):
        """Set up file handler with appropriate formatter"""
        today = datetime.now().strftime('%Y-%m-%d')
        log_file = os.path.join(self.log_dir, f"{self.app_name}_{today}.log")
        
        # Use RotatingFileHandler to limit file size
        file_handler = RotatingFileHandler(
            log_file, 
            maxBytes=10*1024*1024,  # 10 MB
            backupCount=5
        )
        file_handler.setFormatter(self.file_formatter)
        file_handler.setLevel(self.log_level)
        self.root_logger.addHandler(file_handler)
    
    def get_logger(self, name):
        """
        Get a logger instance with the specified name.
        
        Args:
            name (str): Name of the logger (typically __name__ from the calling module)
            
        Returns:
            logging.Logger: Configured logger instance
        """
        return logging.getLogger(name)
    
    # Convenience methods for logging
    def debug(self, message, *args, **kwargs):
        """Log a debug message"""
        self.root_logger.debug(message, *args, **kwargs)
    
    def info(self, message, *args, **kwargs):
        """Log an info message"""
        self.root_logger.info(message, *args, **kwargs)
    
    def warning(self, message, *args, **kwargs):
        """Log a warning message"""
        self.root_logger.warning(message, *args, **kwargs)
    
    def error(self, message, *args, **kwargs):
        """Log an error message"""
        self.root_logger.error(message, *args, **kwargs)
    
    def critical(self, message, *args, **kwargs):
        """Log a critical message"""
        self.root_logger.critical(message, *args, **kwargs)
    
    def exception(self, message, *args, exc_info=True, **kwargs):
        """Log an exception with traceback"""
        self.root_logger.exception(message, *args, exc_info=exc_info, **kwargs)


# Create a default logger instance
logger = Logger()

def get_logger(name=None):
    """
    Get a logger instance. If name is provided, returns a logger with that name.
    Otherwise, returns the root logger.
    
    Args:
        name (str, optional): Logger name (typically __name__ from the calling module)
        
    Returns:
        logging.Logger: Configured logger instance
    """
    if name:
        return logger.get_logger(name)
    return logger.root_logger


# Convenience functions for direct logging
def debug(message, *args, **kwargs):
    """Log a debug message"""
    logger.debug(message, *args, **kwargs)

def info(message, *args, **kwargs):
    """Log an info message"""
    logger.info(message, *args, **kwargs)

def warning(message, *args, **kwargs):
    """Log a warning message"""
    logger.warning(message, *args, **kwargs)

def error(message, *args, **kwargs):
    """Log an error message"""
    logger.error(message, *args, **kwargs)

def critical(message, *args, **kwargs):
    """Log a critical message"""
    logger.critical(message, *args, **kwargs)

def exception(message, *args, exc_info=True, **kwargs):
    """Log an exception with traceback"""
    logger.exception(message, *args, exc_info=exc_info, **kwargs)