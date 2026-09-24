import { api } from "@/services/api";
import type {
  Appointment,
  CheckInAppointmentResult,
} from "@/types/appointment.types";

export const appointmentService = {
  getAll: async (params?: {
    organizationId?: string;
    patientId?: string;
    doctorId?: string;
    status?: string;
    today?: string;
    upcoming?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/appointments", { params });
    const { data, pagination } = response.data;

    return {
      appointments: (data || []) as Appointment[],
      total: pagination?.total || 0,
      page: pagination?.page || 1,
      limit: pagination?.limit || 20,
      totalPages: pagination?.totalPages || 1,
    };
  },

  checkIn: async (id: string): Promise<CheckInAppointmentResult> => {
    const response = await api.post(`/appointments/${id}/check-in`);
    return response.data.data;
  },
};
