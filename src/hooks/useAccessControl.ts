import { useAuthStore } from "@/store/auth.store";
import {
  type AuthUser,
  getUserOrganizationId,
  hasPermission,
  isSuperAdminUser,
} from "@/types/auth.types";
import {
  APPOINTMENT_EDIT,
  APPOINTMENT_VIEW,
  canAccessDoctorWorkspace,
  PATIENT_CREATE,
  PATIENT_VIEW,
  SESSION_CREATE,
} from "@/constants/permissions";

export const useAccessControl = () => {
  const user = useAuthStore((state) => state.user) as AuthUser | null;
  const token = useAuthStore((state) => state.token);
  const isSuperAdmin = isSuperAdminUser(user, token);

  return {
    user,
    isSuperAdmin,
    organizationId: isSuperAdmin ? "" : getUserOrganizationId(user),
    canAccessDoctorWorkspace: () =>
      canAccessDoctorWorkspace(user?.permissions || [], isSuperAdmin),
    canViewPatients: () =>
      hasPermission(user, PATIENT_VIEW, token) ||
      hasPermission(user, "patient:read", token),
    canCreatePatient: () =>
      hasPermission(user, PATIENT_CREATE, token) ||
      hasPermission(user, "patient:create", token),
    canViewAppointments: () =>
      hasPermission(user, APPOINTMENT_VIEW, token) ||
      hasPermission(user, "appointment:read", token),
    canCheckInAppointment: () =>
      (hasPermission(user, APPOINTMENT_EDIT, token) ||
        hasPermission(user, "appointment:update", token)) &&
      (hasPermission(user, SESSION_CREATE, token) ||
        hasPermission(user, "session:create", token)),
  };
};
