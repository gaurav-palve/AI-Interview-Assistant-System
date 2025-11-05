import api from './api';

class VoiceInterviewService {
  async startVoiceInterview(interviewId, candidateId) {
    try {
      const response = await api.post('/voice-interviews/start', {
        interview_id: interviewId,
        candidate_id: candidateId
      });
      return response.data;
    } catch (error) {
      console.error('Error starting voice interview:', error);
      throw error;
    }
  }

  async completeVoiceInterview(sessionId, duration) {
    try {
      const response = await api.post(`/voice-interviews/session/${sessionId}/complete`, {
        duration_seconds: duration
      });
      return response.data;
    } catch (error) {
      console.error('Error completing voice interview:', error);
      throw error;
    }
  }

  async getVoiceSession(sessionId) {
    try {
      const response = await api.get(`/api/voice-interviews/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting voice session:', error);
      throw error;
    }
  }

  async getInterviewVoiceSessions(interviewId) {
    try {
      const response = await api.get(`/api/voice-interviews/interview/${interviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting interview voice sessions:', error);
      throw error;
    }
  }
}

export default new VoiceInterviewService();
