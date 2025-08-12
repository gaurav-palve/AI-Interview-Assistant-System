# Utility Modules

This directory contains utility modules used throughout the application.

## Logger Utility

The `logger.py` module provides a comprehensive logging utility for the application. It supports both console and file logging with customizable log levels and formats.

### Features

- Console and file logging
- Rotating file handler to manage log file sizes
- Customizable log levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Consistent log formatting
- Singleton pattern to ensure consistent configuration
- Easy-to-use API

### Usage

There are multiple ways to use the logger in your code:

#### Method 1: Module-specific logger

```python
from app.utils.logger import get_logger

# Create a logger with the current module name
logger = get_logger(__name__)

def my_function():
    logger.info("This is an info message")
    logger.error("This is an error message")
    
    # Log exceptions with traceback
    try:
        # Some code that might raise an exception
        result = 1 / 0
    except Exception as e:
        logger.exception(f"An exception occurred: {str(e)}")
```

#### Method 2: Direct logging functions

```python
from app.utils.logger import debug, info, warning, error, critical, exception

def my_function():
    info("This is an info message")
    error("This is an error message")
    
    # Log exceptions with traceback
    try:
        # Some code that might raise an exception
        result = 1 / 0
    except Exception as e:
        exception(f"An exception occurred: {str(e)}")
```

#### Method 3: Custom logger configuration

```python
from app.utils.logger import Logger

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
```

### Log File Location

By default, log files are stored in the `logs` directory at the root of the project. Each log file is named with the pattern `interview_assistant_YYYY-MM-DD.log` where `YYYY-MM-DD` is the current date.

### Log Levels

The logger supports the following log levels (in order of increasing severity):

1. DEBUG - Detailed information, typically of interest only when diagnosing problems
2. INFO - Confirmation that things are working as expected
3. WARNING - An indication that something unexpected happened, or may happen in the near future
4. ERROR - Due to a more serious problem, the software has not been able to perform some function
5. CRITICAL - A serious error, indicating that the program itself may be unable to continue running

### Example

See `logger_example.py` for a complete example of how to use the logger in your code.