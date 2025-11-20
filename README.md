# AI Interview Assistant System

A comprehensive platform for automating and managing technical interviews. This system helps recruiters and hiring managers create, manage, and evaluate technical interviews with AI-generated questions based on job descriptions and candidate resumes.

## System Overview

The AI Interview Assistant consists of two main components:

1. **Frontend**: A React-based web application with an intuitive user interface
2. **Backend**: A FastAPI-based REST API backend with MongoDB database

## Features

- **User Authentication**: Secure signup and login for administrators
- **Interview Management**: Create, schedule, update, and delete interview sessions
- **File Processing**: Upload and process resumes (PDF/DOCX) and job descriptions
- **AI Question Generation**: Automatically generate technical MCQs tailored to the job and candidate
- **Email Notifications**: Send interview confirmations and reminders to candidates
- **Candidate Management**: Track candidate information and interview performance
- **Dashboard & Analytics**: Visual statistics and insights about interviews
- **Voice Interview**: Conduct voice-based interviews with automatic processing
- **WebSocket Integration**: Real-time updates and notifications

## Tech Stack

### Backend 
- **FastAPI**: Modern, high-performance web framework
- **MongoDB & Motor**: NoSQL database with async driver
- **PyJWT**: JWT authentication
- **Pydantic**: Data validation
- **LangChain**: Framework for LLM applications
- **Google Gemini & OpenAI**: AI providers for question generation
- **GridFS**: Storage for resume files
- **SMTP**: Email delivery


### Frontend
- **React**: UI library
- **React Router**: Navigation
- **Axios**: API requests
- **React Hook Form**: Form handling
- **Material UI Icons**: Visual elements
- **Tailwind CSS**: Styling and responsive design
- **date-fns**: Date formatting

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 14+
- MongoDB 4.4+
- Google Gemini API key or OpenAI API key

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd AI-Interview-Assistant-System
   ```

2. Setup Backend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   ```

3. Setup Frontend:
   ```
   cd frontend
   npm install
   ```

4. Configure Environment:
   - Create a `.env` file in the backend directory
   - Set MongoDB connection string, API keys, and email settings

### Running the Application

1. Start Backend:
   ```
   cd backend
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Start Frontend:
   ```
   cd frontend
   npm run dev
   ```

3. Access the application:
   - Frontend: http://localhost:5173 (or the port shown in the terminal)
   - Backend API docs: http://localhost:8000/docs

## Core Functionality

### Authentication
- Admin signup and login with JWT token-based security
- Session management with token validation

### Interview Management
- Create new interview sessions with details like title, date/time, and candidate info
- Upload candidate resumes and job descriptions
- View, update, and delete existing interviews
- Schedule automatic email notifications

### MCQ Generation
- AI-powered generation of relevant technical questions
- Questions tailored to job requirements and candidate experience
- Support for various question formats

### Email System
- Interview confirmations and reminders
- Customizable email templates
- Secure SMTP integration

### Analytics
- Summary statistics on interviews conducted
- Performance metrics and insights
- Visual data representation

## API Endpoints

The backend provides RESTful API endpoints for all functionality:

- **/auth**: Authentication endpoints
- **/interviews**: Interview management
- **/emails**: Email notification services
- **/candidates**: Candidate information management

For detailed API documentation, visit the Swagger UI at `http://localhost:8000/docs` when the backend is running.

## Folder Structure

```
AI-Interview-Assistant-System/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── utils/
│   ├── logs/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
└── README.md