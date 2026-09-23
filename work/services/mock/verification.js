import { verificationCases, users, parcels, auditLogs } from "./data";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getVerificationCases(params = {}) {
  await delay(150);

  const { state, district, tehsil } = params;

  return verificationCases.map((vc, idx) => {
    const baseParcel = parcels.find((p) => p.id === vc.parcelId) || parcels[0];

    const displayState = state || "Rajasthan";
    const displayDistrict = district || "Kota";
    const displayTehsil = tehsil || "Ladpura";

    return {
      ...vc,
      id: vc.id || `VC-${idx + 100}`,
      assignedUser: users.find((u) => u.id === vc.assignedTo) || { name: "Officer Sharma", role: "Revenue Officer" },
      parcel: {
        ...baseParcel,
        surveyNumber: vc.parcel?.surveyNumber || baseParcel.surveyNumber || `Khasra 12${idx}/3`,
        currentRecordedOwner: vc.parcel?.currentRecordedOwner || baseParcel.currentRecordedOwner || "Recorded Owner",
        khataNumber: vc.parcel?.khataNumber || baseParcel.khataNumber || "KH-782",
        state: displayState,
        district: displayDistrict,
        tehsil: displayTehsil,
        villageName: `${displayTehsil} Sector ${idx + 1}`,
      },
    };
  });
}

export async function getVerificationCase(caseId) {
  await delay(200);

  const verificationCase = verificationCases.find(
    (item) => item.id === caseId
  );

  if (!verificationCase) {
    throw new Error("Verification case not found.");
  }

  return {
    ...verificationCase,
    assignedUser: users.find(
      (user) => user.id === verificationCase.assignedTo
    ),
    parcel: parcels.find(
      (parcel) => parcel.id === verificationCase.parcelId
    ),
  };
}

export async function getVerificationCasesByUser(userId) {
  await delay(200);

  return verificationCases.filter(
    (item) => item.assignedTo === userId
  );
}

export async function decideVerificationCase({
  caseId,
  decision,
  notes,
  userId = "USR-001",
}) {
  await delay(300);

  const verificationCase = verificationCases.find(
    (item) => item.id === caseId
  );

  if (!verificationCase) {
    throw new Error("Verification case not found.");
  }

  const allowedDecisions = ["VERIFY", "REVIEW", "REJECT"];

  if (!allowedDecisions.includes(decision)) {
    throw new Error("Invalid verification decision.");
  }

  if (!notes || !notes.trim()) {
    throw new Error("Officer remarks are required.");
  }

  const statusMap = {
    VERIFY: "VERIFIED",
    REVIEW: "PENDING_REVIEW",
    REJECT: "REJECTED",
  };

  const previousStatus = verificationCase.status;
  const newStatus = statusMap[decision];

  verificationCase.status = newStatus;
  verificationCase.decision = decision;
  verificationCase.notes = notes.trim();
  verificationCase.reviewedBy = userId;
  verificationCase.reviewedAt = new Date().toISOString();

  const auditId = `AUD-${String(auditLogs.length + 1).padStart(3, "0")}`;

  auditLogs.push({
    id: auditId,
    entityId: caseId,
    action: "CASE_DECISION_RECORDED",
    user: userId,
    timestamp: verificationCase.reviewedAt,
    description: `Verification case decision changed from ${previousStatus} to ${newStatus}.`,
    metadata: {
      decision,
      previousStatus,
      newStatus,
      notes: notes.trim(),
    },
  });

  return {
    ...verificationCase,
    assignedUser: users.find(
      (user) => user.id === verificationCase.assignedTo
    ),
    parcel: parcels.find(
      (parcel) => parcel.id === verificationCase.parcelId
    ),
    auditLogId: auditId,
  };
}
