import React from "react";
import { DoctorConsultationsView } from "@/components/doctor/DoctorConsultationsView";

/** Today's clinic queue — parity with web `/doctor/consultations`. */
export default function ConsultationsTabScreen() {
  return <DoctorConsultationsView />;
}
