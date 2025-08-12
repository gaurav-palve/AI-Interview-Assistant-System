"""
Example file demonstrating how to use the logger utility in the application.
This file is for reference purposes only and is not used in the actual application.
"""

# Method 1: Import the get_logger function and create a logger for this module
from app.utils.logger import get_logger

# Create a logger with the current module name
logger = get_logger(__name__)

def example_function_1():
    """Example function demonstrating logger usage with module-specific logger"""
    logger.debug("This is a debug message from example_function_1")
    logger.info("This is an info message from example_function_1")
    logger.warning("This is a warning message from example_function_1")
    logger.error("This is an error message from example_function_1")
    
    # Log exceptions with traceback
    try:
        result = 1 / 0
    except Exception as e:
        logger.exception(f"An exception occurred: {str(e)}")


# Method 2: Import the direct logging functions
from app.utils.logger import debug, info, warning, error, critical, exception

def example_function_2():
    """Example function demonstrating logger usage with direct logging functions"""
    debug("This is a debug message from example_function_2")
    info("This is an info message from example_function_2")
    warning("This is a warning message from example_function_2")
    error("This is an error message from example_function_2")
    critical("This is a critical message from example_function_2")


# Method 3: Import and configure a custom Logger instance
from app.utils.logger import Logger

def example_custom_logger():
    """Example function demonstrating custom logger configuration"""
    # Create a custom logger with specific settings
    custom_logger = Logger(
        app_name="custom_module",
        log_level=Logger.DEBUG,  # Set to DEBUG level
        log_to_console=True,
        log_to_file=True,
        log_dir="custom_logs"  # Use a different log directory
    )
    
    # Use the custom logger
    custom_logger.debug("Debug message from custom logger")
    custom_logger.info("Info message from custom logger")


if __name__ == "__main__":
    # This code will only run if this file is executed directly
    print("Running logger examples...")
    
    # Example 1: Using module-specific logger
    example_function_1()
    
    # Example 2: Using direct logging functions
    example_function_2()
    
    # Example 3: Using custom logger configuration
    example_custom_logger()
    
    print("Logger examples completed.")