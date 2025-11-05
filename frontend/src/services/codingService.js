import api from './api';

// Code execution api
export const executeCode = async (language, sourceCode) => {
  try {
    const response = await api.post("/api/code/execute", {
      language: language,
      version: null, // The backend will use the default version
      files: [
        {
          content: sourceCode,
        },
      ],
    });
    return response.data;
  } catch (error) {
    console.error("Error executing code:", error);
    throw error;
  }
};

// Code evaluation api
export const evaluateCode = async (code, testCases, language, functionSignature) => {
  try {
    console.log("Evaluating code in language:", language);
    console.log("Function signature:", functionSignature);
    const response = await api.post("/code/evaluate", {
      code,
      code,
      testCases,
      language,
      functionSignature,
    });
    return response.data.results;
  } catch (error) {
    console.error("Error evaluating code:", error);
    throw error;
  }
};

// Question generation api
export const generateQuestion = async (difficulty = "easy", topic = null) => {
  try {
    const response = await api.post("/api/questions/generate", {
      difficulty,
      topic,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating question:", error);
    throw error;
  }
};

// Generate coding questions for an interview session
export const generateCodingQuestions = async (interviewId, count = 3, difficulty = "medium") => {
  try {
    console.log("codingService: Generating questions with interview ID:", interviewId);
    
    // Use the exact interview_id from the URL without any modifications
    // This is the MongoDB ObjectId format like "68db8801735747049bd7952d"
    const requestBody = {
      interview_id: interviewId,
      count,
      difficulty,
    };
    
    console.log("codingService: Request body:", requestBody);
    
    const response = await api.post("/questions/generate-coding-questions", requestBody);
    console.log("codingService: Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error generating coding questions:", error);
    throw error; // No fallback, just throw the error
  }
};

// Fetch coding questions for an interview session
export const fetchCodingQuestions = async (interviewId) => {
  try {
    // Use the exact interview_id from the URL without any modifications
    console.log("Fetching coding questions with interview ID:", interviewId);
    
    const response = await api.get(`/questions/fetch-coding-questions/${interviewId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching coding questions:", error);
    throw error; // No fallback, just throw the error
  }
};

// Submit candidate's coding answer to be saved in the database
export const saveCodingAnswer = async (interviewId, questionId, candidateAnswer, testResults) => {
  try {
    console.log("Saving coding answer with interview ID:", interviewId);
    
    const requestBody = {
      interview_id: interviewId,
      question_id: questionId,
      candidate_answer: candidateAnswer,
      test_results: testResults
    };
    
    console.log("saveCodingAnswer: Request body:", requestBody);
    
    const response = await api.post("/questions/save-coding-answer", requestBody);
    console.log("saveCodingAnswer: Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error saving coding answer:", error);
    throw error;
  }
};
