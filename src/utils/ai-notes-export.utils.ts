import type { AiNotes, AiNotesMedication } from "@/types/ai-notes.types";
import type { Patient } from "@/types/patient.types";
import type {
  Session,
  SessionOrganization,
  SessionUser,
  VisitType,
} from "@/types/session.types";
import { getSessionDepartmentName } from "@/types/session.types";
import { getPatientAge, getPatientFullName } from "@/utils/patient.utils";
import { resolveMediaUrl } from "@/utils/media.utils";

export interface AiNotesExportMetadata {
  organizationName: string;
  organizationLogo?: string;
  organizationAddress?: string;
  organizationContact?: string;
  patientName: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: string;
  doctorName: string;
  doctorEducation?: string;
  doctorSignature?: string;
  departmentName?: string;
  visitType: VisitType;
  documentDate: string;
  admittedDate?: string;
  noteTitle?: string;
}

export interface AiNotesExportContent {
  metadata: AiNotesExportMetadata;
  complaint?: string;
  treatmentHistory?: string;
  observation?: string;
  suggestedTreatment?: string;
  remarks?: string;
  medications: AiNotesMedication[];
  summary?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

const formatDisplayDate = (value?: string | Date) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatGender = (gender?: string) => {
  if (!gender) return "—";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
};

const getDoctorName = (doctor?: SessionUser | string) => {
  if (!doctor || typeof doctor === "string") return "—";
  return `${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || "—";
};

const getOrganization = (session: Session): SessionOrganization | undefined => {
  if (typeof session.organizationId === "object") {
    return session.organizationId;
  }
  return undefined;
};

const getDoctor = (session: Session): SessionUser | undefined => {
  if (typeof session.userId === "object") {
    return session.userId;
  }
  return undefined;
};

const getPatient = (session: Session): Patient | undefined => {
  if (typeof session.patientId === "object") {
    return session.patientId;
  }
  return undefined;
};

const escapeHtml = (value?: string) =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\n/g, "<br/>");

export const buildAiNotesExportContent = (
  aiNotes: AiNotes,
  session: Session,
): AiNotesExportContent => {
  const organization = getOrganization(session);
  const doctor = getDoctor(session);
  const patient = getPatient(session);
  const visitType = session.visitType || "outpatient";
  const patientAge = patient ? getPatientAge(patient) : null;

  return {
    metadata: {
      organizationName: organization?.name || "—",
      organizationLogo: resolveMediaUrl(organization?.logo),
      organizationAddress: organization?.address || "—",
      organizationContact: organization?.contactNumber || "—",
      patientName: getPatientFullName(patient),
      patientPhone: patient?.phoneNumber || "—",
      patientGender: formatGender(patient?.gender),
      patientAge: patientAge !== null ? String(patientAge) : "—",
      doctorName: getDoctorName(doctor),
      doctorEducation: doctor?.qualification || "—",
      doctorSignature: doctor?.signature
        ? resolveMediaUrl(doctor.signature)
        : undefined,
      departmentName: getSessionDepartmentName(session) || undefined,
      visitType,
      documentDate: formatDisplayDate(new Date()),
      admittedDate:
        visitType === "inpatient" && session.admittedDate
          ? formatDisplayDate(session.admittedDate)
          : undefined,
      noteTitle: session.title?.trim() || undefined,
    },
    complaint: aiNotes.subjective,
    treatmentHistory: aiNotes.objective,
    observation: aiNotes.assessment,
    suggestedTreatment: aiNotes.plan,
    remarks: aiNotes.remarks || aiNotes.summary,
    medications: aiNotes.medications || [],
    summary: aiNotes.summary,
    subjective: aiNotes.subjective,
    objective: aiNotes.objective,
    assessment: aiNotes.assessment,
    plan: aiNotes.plan,
  };
};

const sectionHtml = (title: string, body?: string) => `
  <section style="margin-bottom:16px;">
    <h3 style="margin:0 0 6px;font-size:14px;color:#111827;">${escapeHtml(title)}</h3>
    <p style="margin:0;font-size:13px;line-height:1.5;color:#374151;">${
      body?.trim() ? escapeHtml(body) : "—"
    }</p>
  </section>
`;

export const buildAiNotesExportHtml = (content: AiNotesExportContent) => {
  const medRows =
    content.medications.length === 0
      ? `<tr><td colspan="3" style="padding:8px;border:1px solid #e5e7eb;">No medications</td></tr>`
      : content.medications
          .map((med) => {
            const dose = [med.morning, med.afternoon, med.night]
              .filter(Boolean)
              .join(" · ");
            return `<tr>
              <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(med.medicine)}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(
                `${dose}${med.days ? ` · ${med.days} days` : ""}`,
              )}</td>
              <td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(
                med.instructions || "—",
              )}</td>
            </tr>`;
          })
          .join("");

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Consultation Report</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111827;">
      <header style="border-bottom:2px solid #2563eb;padding-bottom:12px;margin-bottom:20px;">
        <h1 style="margin:0;font-size:20px;">${escapeHtml(
          content.metadata.organizationName,
        )}</h1>
        <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">
          ${escapeHtml(content.metadata.organizationAddress)} · ${escapeHtml(
            content.metadata.organizationContact,
          )}
        </p>
      </header>

      <h2 style="margin:0 0 12px;font-size:18px;">Consultation Report</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#4b5563;">
        Patient: <strong>${escapeHtml(content.metadata.patientName)}</strong>
        · ${escapeHtml(content.metadata.patientAge)} yrs
        · ${escapeHtml(content.metadata.patientGender)}
        · ${escapeHtml(content.metadata.patientPhone)}<br/>
        Doctor: <strong>${escapeHtml(content.metadata.doctorName)}</strong>
        · ${escapeHtml(content.metadata.doctorEducation)}${
          content.metadata.departmentName
            ? `<br/>Department: <strong>${escapeHtml(content.metadata.departmentName)}</strong>`
            : ""
        }<br/>
        Date: ${escapeHtml(content.metadata.documentDate)}
        · Visit: ${escapeHtml(content.metadata.visitType)}
      </p>

      ${sectionHtml("Chief Complaint / HPI", content.complaint)}
      ${sectionHtml("Examination", content.treatmentHistory)}
      ${sectionHtml("Assessment / Diagnosis", content.observation)}
      ${sectionHtml("Treatment Plan", content.suggestedTreatment)}
      ${sectionHtml("Advice / Follow-up", content.remarks)}

      <section style="margin-top:8px;">
        <h3 style="margin:0 0 8px;font-size:14px;">Prescription</h3>
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Medicine</th>
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Dose</th>
              <th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Instructions</th>
            </tr>
          </thead>
          <tbody>${medRows}</tbody>
        </table>
      </section>
    </body>
  </html>`;
};
