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
  MEDICINE_VIEW,
  MEDICINE_CREATE,
  MEDICINE_EDIT,
  PATIENT_CREATE,
  PATIENT_EDIT,
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
    canEditPatient: () =>
      hasPermission(user, PATIENT_EDIT, token) ||
      hasPermission(user, "patient:update", token),
    canViewAppointments: () =>
      hasPermission(user, APPOINTMENT_VIEW, token) ||
      hasPermission(user, "appointment:read", token),
    canCheckInAppointment: () =>
      (hasPermission(user, APPOINTMENT_EDIT, token) ||
        hasPermission(user, "appointment:update", token)) &&
      (hasPermission(user, SESSION_CREATE, token) ||
        hasPermission(user, "session:create", token)),
    canViewMedicines: () =>
      hasPermission(user, MEDICINE_VIEW, token) ||
      hasPermission(user, "medicine:read", token),
    canCreateMedicine: () =>
      hasPermission(user, MEDICINE_CREATE, token) ||
      hasPermission(user, "medicine:create", token),
    canEditMedicine: () =>
      hasPermission(user, MEDICINE_EDIT, token) ||
      hasPermission(user, "medicine:update", token),
  };
};
