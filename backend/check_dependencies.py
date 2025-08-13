import sys
import importlib.util
import subprocess
import os

def check_package(package_name, install_command=None):
    """Check if a package is installed and provide installation instructions if not."""
    is_installed = importlib.util.find_spec(package_name) is not None
    
    print(f"Checking for {package_name}... ", end="")
    if is_installed:
        print("✓ Installed")
        return True
    else:
        print("✗ Not installed")
        if install_command:
            print(f"  To install, run: {install_command}")
        return False

def main():
    """Check all dependencies required for the candidate interview system."""
    print("\n=== Dependency Checker for Candidate Interview System ===\n")
    
    # Required packages
    required_packages = [
        ("fastapi", "pip install fastapi"),
        ("uvicorn", "pip install uvicorn[standard]"),
        ("motor", "pip install motor"),
        ("pydantic", "pip install pydantic[email]"),
        ("python-dotenv", "pip install python-dotenv"),
        ("passlib", "pip install passlib[bcrypt]"),
        ("requests", "pip install requests"),
        ("python-multipart", "pip install python-multipart"),
        ("PyPDF2", "pip install PyPDF2"),
        ("langchain", "pip install langchain"),
        ("langchain_google_genai", "pip install langchain_google_genai"),
        ("langchain_openai", "pip install langchain_openai"),
    ]
    
    # Optional packages
    optional_packages = [
        ("msal", "pip install msal", "Required for OAuth2 authentication with Microsoft services"),
        ("streamlit", "pip install streamlit", "Required for admin dashboard"),
        ("emails", "pip install emails", "Alternative email library"),
    ]
    
    # Check required packages
    print("Required Packages:")
    all_required_installed = True
    for package, install_cmd in required_packages:
        if not check_package(package, install_cmd):
            all_required_installed = False
    
    # Check optional packages
    print("\nOptional Packages:")
    for package, install_cmd, description in optional_packages:
        is_installed = check_package(package, install_cmd)
        if not is_installed:
            print(f"  Note: {description}")
    
    # Check if requirements.txt exists and offer to install all packages
    if os.path.exists("requirements.txt"):
        print("\nA requirements.txt file was found. You can install all dependencies with:")
        print("pip install -r requirements.txt")
    
    # Summary
    print("\n=== Summary ===")
    if all_required_installed:
        print("✓ All required packages are installed.")
        print("You can run the candidate interview system.")
    else:
        print("✗ Some required packages are missing.")
        print("Please install the missing packages before running the system.")
    
    # Special note about MSAL
    msal_installed = importlib.util.find_spec("msal") is not None
    if not msal_installed:
        print("\nNote about MSAL:")
        print("The MSAL package is not installed, but the system will still work.")
        print("OAuth2 authentication will be disabled, and the system will use password authentication.")
        print("If you want to use OAuth2 authentication, install MSAL with: pip install msal")
    
    print("\n=== End of Dependency Check ===\n")

if __name__ == "__main__":
    main()