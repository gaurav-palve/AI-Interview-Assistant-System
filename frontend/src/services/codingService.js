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
    const response = await api.post("/api/code/evaluate", {
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

// Multiple questions generation api
export const generateMultipleQuestions = async (count = 3, difficulty = "easy") => {
  try {
    const response = await api.post("/api/questions/generate-multiple", {
      count,
      difficulty,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating multiple questions:", error);
    
    // Try to get fallback questions if api fails
    try {
      const fallbackQuestions = [];
      const topics = ["string manipulation", "array operations", "mathematical algorithms"];
      
      for (let i = 0; i < count && i < topics.length; i++) {
        const response = await api.get(`/api/questions/fallback?difficulty=${difficulty}&topic=${topics[i]}`);
        fallbackQuestions.push(response.data);
      }
      
      return fallbackQuestions;
    } catch (fallbackError) {
      console.error("Error getting fallback questions:", fallbackError);
      throw error;
    }
  }
};
