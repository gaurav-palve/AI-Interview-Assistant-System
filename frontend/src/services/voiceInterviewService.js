import api from './api';
 
class VoiceInterviewService {
  /**
   * Get a signed URL for client-side WebRTC connection to ElevenLabs.
   * Also creates a session record in the database.
   */
  async getSignedUrl(interviewId, candidateId) {
    try {
      const response = await api.post('/voice-interviews/get-signed-url', {
        interview_id: interviewId,
        candidate_id: candidateId
      });
      return response.data;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }
 
  /**
   * Complete a voice interview session.
   * Sends transcript data collected from the client-side SDK to the backend.
   */
  async completeVoiceInterview(sessionId, duration, transcript = []) {
    try {
      const response = await api.post(`/voice-interviews/session/${sessionId}/complete`, {
        duration_seconds: duration,
        transcript: transcript
      });
      return response.data;
    } catch (error) {
      console.error('Error completing voice interview:', error);
      throw error;
    }
  }
 
  async getVoiceSession(sessionId) {
    try {
      const response = await api.get(`/voice-interviews/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting voice session:', error);
      throw error;
    }
  }
 
  async getInterviewVoiceSessions(interviewId) {
    try {
      const response = await api.get(`/voice-interviews/interview/${interviewId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting interview voice sessions:', error);
      throw error;
    }
  }
}
 
export default new VoiceInterviewService();
 
 