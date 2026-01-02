import { PERMISSIONS } from "../constants/permissions";
import {
  DashboardOutlined,
  WorkOutlined,
  AssignmentOutlined,
  BarChartOutlined,
  GradingOutlined,
  PersonAddOutlined,
  PeopleOutlined,
  AdminPanelSettingsOutlined,
  SettingsOutlined,
} from "@mui/icons-material";

/**
 * MAIN SIDEBAR ITEMS
 */
export const NAV_ITEMS = [
  {
    key: "dashboard",
    path: "/dashboard",
    label: "Dashboard",
    icon: DashboardOutlined,
    permissions: [
      PERMISSIONS.ROLE_VIEW,
      PERMISSIONS.USER_VIEW,
    ],
  },

  {
    key: "job-postings",
    path: "/job-postings",
    label: "Job Postings",
    icon: WorkOutlined,
    permissions: [
      PERMISSIONS.JOB_VIEW,
      PERMISSIONS.JOB_VIEW_ALL,
      PERMISSIONS.JOB_VIEW_ASSIGNED,
      PERMISSIONS.JOB_EDIT,
      PERMISSIONS.JOB_DELETE,
      PERMISSIONS.JOB_CREATE,
      PERMISSIONS.JOB_VIEW_ASSIGNED,
      
    ],
  },

  {
    key: "interviews",
    path: "/interviews",
    label: "Interviews",
    icon: AssignmentOutlined,
    permissions: [
      PERMISSIONS.INTERVIEW_MANAGE,
      PERMISSIONS.INTERVIEW_SCHEDULE,
      PERMISSIONS.INTERVIEW_VIEW,
    ],
  },

  {
    key: "statistics",
    path: "/statistics",
    label: "Statistics",
    icon: BarChartOutlined,
    permissions: [
      PERMISSIONS.INTERVIEW_VIEW,
    ],
  },

  {
    key: "assessment-reports",
    path: "/candidate-assessment-reports",
    label: "Assessment Reports",
    icon: GradingOutlined,
    permissions: [
      PERMISSIONS.ASSESSMENT_VIEW,
      PERMISSIONS.ASSESSMENT_CREATE,
    ],
  },
];

/**
 * SETTINGS MENU
 */
export const SETTINGS_MENU = {
  key: "settings",
  label: "Settings",
  icon: SettingsOutlined,
  permissions: [
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_MANAGE,
    PERMISSIONS.ROLE_MANAGE,
  ],
  children: [
    {
      key: "create-user",
      path: "/users/create",
      label: "Create User",
      icon: PersonAddOutlined,
      permissions: [PERMISSIONS.USER_MANAGE],
    },
    {
      key: "role-management",
      path: "/create-role",
      label: "Role Management",
      icon: AdminPanelSettingsOutlined,
      permissions: [PERMISSIONS.ROLE_MANAGE],
    },
    {
      key: "all-users",
      path: "/users",
      label: "All Users",
      icon: PeopleOutlined,
      permissions: [PERMISSIONS.USER_VIEW],
    },
  ],
};
