# AI Interview Assistant Frontend

A modern React-based frontend for the AI Interview Assistant application. This frontend connects to the FastAPI backend to provide a seamless user experience for managing interviews, uploading files, and generating MCQs.

## Features

- **Authentication**: Secure login and signup functionality
- **Dashboard**: Overview of interview statistics and recent interviews
- **Interview Management**: Create, view, edit, and delete interviews
- **File Upload**: Upload resume and job description files for candidates
- **MCQ Generation**: Generate multiple-choice questions based on resume and job description
- **Statistics**: Visual representation of interview data

## Tech Stack

- **React**: UI library for building the user interface
- **React Router**: For navigation and routing
- **Axios**: For API calls to the backend
- **React Hook Form**: For form handling and validation
- **Material UI Icons**: For icons and visual elements
- **Tailwind CSS**: For styling and responsive design
- **date-fns**: For date formatting and manipulation

## Project Structure

- `/src/components`: Reusable UI components
- `/src/pages`: Page components
- `/src/services`: API service functions
- `/src/contexts`: Context providers for state management
- `/src/utils`: Utility functions
- `/src/hooks`: Custom hooks
- `/src/assets`: Static assets

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

## Backend Connection

This frontend connects to the FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before using the frontend.

## Authentication

The application uses token-based authentication. The token is stored in localStorage and included in API requests.

## Responsive Design

The UI is fully responsive and works on desktop, tablet, and mobile devices.
