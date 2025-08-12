# AI Interview Assistant Backend

A FastAPI-based backend for the AI Interview Assistant application. This backend provides RESTful APIs for managing interviews, user authentication, file uploads, MCQ generation, and email notifications.

## Features

- **Authentication**: Secure user registration and login with JWT tokens
- **Interview Management**: Create, retrieve, update, and delete interview sessions
- **File Upload**: Upload and process resume and job description files
- **MCQ Generation**: Generate multiple-choice questions based on resume and job description using LLM models
- **Email Notifications**: Send interview confirmations and reminders
- **Logging**: Comprehensive logging system for debugging and monitoring
- **MongoDB Integration**: Store user data, interview information, and file metadata
- **GridFS**: Store and retrieve PDF files efficiently

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI applications
- **Motor**: Asynchronous MongoDB driver
- **PyJWT**: JSON Web Token implementation
- **Pydantic**: Data validation and settings management
- **Passlib**: Password hashing and verification
- **PyPDF2 & python-docx**: PDF and DOCX file processing
- **LangChain**: Framework for LLM applications
- **Google Gemini & OpenAI**: LLM providers for generating interview questions

## Project Structure

- `/app`: Main application package
  - `/config.py`: Application configuration settings
  - `/database.py`: MongoDB connection and database operations
  - `/main.py`: FastAPI application setup and entry point
  - `/models/`: Database models
  - `/routes/`: API route definitions
  - `/schemas/`: Pydantic models for request/response validation
  - `/services/`: Business logic implementation
  - `/utils/`: Utility functions and helpers
- `/logs/`: Application log files
- `/venv/`: Python virtual environment (not tracked in git)
- `run_app.py`: Script to run both backend and frontend
- `requirements.txt`: Python dependencies
- `.env`: Environment variables (not tracked in git)
- `env_example.txt`: Example environment variables file

## Getting Started

### Prerequisites

- Python 3.9+
- MongoDB 4.4+
- Google Gemini API key or OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

4. Create a `.env` file based on `env_example.txt`:
   ```
   cp backend/env_example.txt backend/.env
   ```

5. Update the `.env` file with your MongoDB connection string, database name, and other settings.

### Running the Application

1. Start the backend server:
   ```
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Alternatively, use the provided script to run both backend and frontend:
   ```
   python run_app.py
   ```

3. Access the API documentation at `http://127.0.0.1:8000/docs`

## API Endpoints

The backend provides the following API endpoints:

- **Authentication**
  - `POST /auth/signup`: Register a new user
  - `POST /auth/signin`: Login and get access token
  - `POST /auth/logout`: Logout and invalidate token

- **Interviews**
  - `GET /interviews`: List all interviews
  - `POST /interviews`: Create a new interview
  - `GET /interviews/{id}`: Get interview details
  - `PUT /interviews/{id}`: Update an interview
  - `DELETE /interviews/{id}`: Delete an interview
  - `GET /interviews/stats/summary`: Get interview statistics

- **File Upload**
  - `POST /interviews/upload/files`: Upload resume and job description files

- **MCQ Generation**
  - `POST /interviews/generate-mcqs`: Generate multiple-choice questions

- **Email**
  - `POST /emails/send-confirmation`: Send interview confirmation email
  - `POST /emails/send-reminder`: Send interview reminder email
  - `POST /emails/test`: Test email configuration

## Database

The application uses MongoDB for data storage with the following collections:

- `auth_collection`: User authentication data
- `scheduled_interviews`: Interview session information
- `candidate_documents`: Metadata for uploaded files

GridFS is used for storing and retrieving PDF files efficiently.

## Email Configuration

The application supports sending email notifications for interview confirmations and reminders. See `EMAIL_SETUP_GUIDE.md` for detailed setup instructions.

## Logging

The application uses a comprehensive logging system that writes logs to both the console and files. Log files are stored in the `logs` directory with the naming pattern `interview_assistant_YYYY-MM-DD.log`.

See `app/utils/README.md` for detailed information on using the logger.

## Environment Variables

The following environment variables can be configured in the `.env` file:

- `MONGO_URI`: MongoDB connection string
- `DB_NAME`: MongoDB database name
- `GOOGLE_API_KEY`: Google Gemini API key
- `SMTP_SERVER`: SMTP server for sending emails
- `SMTP_PORT`: SMTP server port
- `SMTP_USERNAME`: SMTP username
- `SMTP_PASSWORD`: SMTP password or app password
- `FROM_EMAIL`: Email address to send from
- `FRONTEND_URL`: URL of the frontend application

## Testing

To run the email test script:

```
cd backend
python test_email.py
```

For other tests:

```
cd backend
python test.py