import { auditLogs } from "./data";

export async function getAuditLogs(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const { state, district, tehsil } = params;

  if (!state) {
    return auditLogs;
  }

  const scopeLabel = tehsil
    ? `${tehsil}, ${district}`
    : district
    ? `${district}, ${state}`
    : state;

  return [
    {
      id: "AUD-LOC-01",
      action: "PARCEL_RECONCILIATION",
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      description: `RoR Jamabandi verified for Khasra 124/3 in ${scopeLabel}`,
      user: `Officer Sharma (${district || state})`,
    },
    {
      id: "AUD-LOC-02",
      action: "FIELD_VERIFICATION_ORDERED",
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      description: `Spatial boundary discrepancy flagged for inspection in ${scopeLabel}`,
      user: `Inspector Verma (${district || state})`,
    },
    {
      id: "AUD-LOC-03",
      action: "OCR_EXTRACTION_COMPLETED",
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      description: `Sale deed registry scanned and ingested for ${scopeLabel} region`,
      user: "System AI Engine",
    },
    {
      id: "AUD-LOC-04",
      action: "MUTATION_RECORD_UPDATED",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      description: `Mutation title update processed under jurisdiction ${scopeLabel}`,
      user: `Tehsildar (${district || state})`,
    },
  ];
}

export async function getAuditLogsByEntity(entityId) {
  await new Promise((resolve) => setTimeout(resolve, 200));

  return auditLogs.filter(
    (log) => log.entityId === entityId
  );
}
