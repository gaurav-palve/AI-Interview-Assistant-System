import os
import configparser
 
# Read the ini file
config = configparser.ConfigParser()
config.read("app-properties.ini")
 
# Determine the environment profile

profile = os.environ.get("NODE_ENV", "development")  # Default to 'development' if not set
 
# Validate that the profile exists in the ini file
if profile not in config:
    raise ValueError(f"Profile '{profile}' not found in app-properties.ini. Available profiles: {list(config.sections())}")
 
# Bridge ini → environment variables
for key, value in config[profile].items():
    os.environ[key.upper()] = value
 
print(f"✓ Loaded configuration for profile: {profile}")
 
 