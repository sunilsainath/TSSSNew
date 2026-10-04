/**
 * Message templates for blood help notifications.
 *
 * Only the information a volunteer needs to act is included - no unrelated
 * personal data.
 */

import { formatDate } from "@/lib/utils/format";

export type BloodHelpDetails = {
  requestNumber: string;
  requesterName: string;
  mobileNumber: string;
  bloodGroup: string;
  hospitalName: string;
  hospitalLocation: string;
  requiredDate: string | null;
  unitsRequired: number;
  message: string;
  districtName: string;
  areaName: string;
};

export function buildEmailSubject(details: BloodHelpDetails, unassigned: boolean): string {
  return unassigned
    ? `[TSSS UNASSIGNED] Blood help ${details.bloodGroup} - ${details.hospitalName} - ${details.requestNumber}`
    : `[TSSS Blood Help] ${details.bloodGroup} required - ${details.hospitalName} - ${details.requestNumber}`;
}

export function buildEmailBody(details: BloodHelpDetails, unassigned: boolean): string {
  const location = [details.hospitalLocation, details.areaName, details.districtName]
    .filter(Boolean)
    .join(", ");

  return [
    unassigned
      ? "No blood help administrator is configured for this area, so this request is being sent to the central team."
      : "A blood help request has been assigned to you by district/area.",
    "",
    `Request ID: ${details.requestNumber}`,
    `Requester: ${details.requesterName}`,
    `Contact number: ${details.mobileNumber}`,
    `Blood group: ${details.bloodGroup}`,
    `Units required: ${details.unitsRequired}`,
    `Hospital: ${details.hospitalName}`,
    `Location: ${location || "Not provided"}`,
    `Required date: ${details.requiredDate ? formatDate(details.requiredDate) : "As soon as possible"}`,
    "",
    details.message ? `Additional information:\n${details.message}` : "",
    "",
    "Please contact the requester directly. Do not share these details publicly.",
    "- Srinivasula Seva Samstha (TSSS)",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildWhatsAppBody(details: BloodHelpDetails, unassigned: boolean): string {
  const location = [details.hospitalLocation, details.areaName, details.districtName]
    .filter(Boolean)
    .join(", ");

  return [
    `TSSS Blood Help Request${unassigned ? " (UNASSIGNED)" : ""}`,
    `Request: ${details.requestNumber}`,
    `Blood Group: ${details.bloodGroup}`,
    `Units: ${details.unitsRequired}`,
    `Hospital: ${details.hospitalName}`,
    `Location: ${location || "Not provided"}`,
    `Required Date: ${details.requiredDate ? formatDate(details.requiredDate) : "ASAP"}`,
    `Contact: ${details.requesterName} - ${details.mobileNumber}`,
    details.message ? `Note: ${details.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
