/**
 * SYSTEM PERMISSIONS
 * These MUST exactly match backend permission codes
 */

export const PERMISSIONS = {
  // ======================
  // Job Module
  // ======================
  JOB_CREATE: "JOB_CREATE",
  JOB_EDIT: "JOB_EDIT",
  JOB_DELETE: "JOB_DELETE",
  JOB_VIEW: "JOB_VIEW",
  JOB_VIEW_ALL: "JOB_VIEW_ALL",
  JOB_VIEW_ASSIGNED: "JOB_VIEW_ASSIGNED",
  JOB_POSTING_STATUS: "JOB_POSTING_STATUS_UPDATE",
  UPDATE_JOB_DESCRIPTION: "JOB_EDIT",

  // ======================
  // Resume Module
  // ======================
  RESUME_UPLOAD: "RESUME_UPLOAD",
  RESUME_SCREEN: "RESUME_SCREENING",
  RESUME_SCREENING_RESULT: "RESUME_SCREENING_RESULTS",

  // ======================
  // Interview Module
  // ======================
  INTERVIEW_SCHEDULE: "INTERVIEW_SCHEDULE",
  INTERVIEW_MANAGE: "INTERVIEW_MANAGE",
  INTERVIEW_VIEW: "INTERVIEW_VIEW",

  // ======================
  // Admin Module
  // ======================
  ROLE_MANAGE: "ROLE_MANAGE",
  ROLE_VIEW: "ROLE_VIEW",
  USER_MANAGE: "USER_MANAGE",
  USER_VIEW: "USER_VIEW",

  // ======================
  // Assessment Module
  // ======================
  ASSESSMENT_VIEW: "ASSESSMENT_VIEW",
  ASSESSMENT_CREATE: "ASSESSMENT_CREATE",

  // ======================
  // Report Module
  // ======================
  REPORT_GENERATE: "REPORT_GENERATE",
  REPORT_VIEW: "REPORT_VIEW",
  REPORT_DOWNLOAD: "REPORT_DOWNLOAD",

  ASSIGN_USERS: "ASSIGN_USERS",
};
