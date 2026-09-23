import {
  validationResults,
  validationCheckCenterData,
  conflicts,
  evidence,
  riskScores,
} from "./data";

export async function getValidationCheckCenterData(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return validationCheckCenterData;
}

export async function getValidationByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const validation = validationResults.find(
    (item) => String(item.parcelId).trim().toLowerCase() === String(parcelId).trim().toLowerCase()
  );

  if (!validation) {
    return validationResults[0];
  }

  return validation;
}

export async function getConflictsByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const items = conflicts.filter(
    (item) => item.parcelId === parcelId
  );

  return items.length > 0 ? items : conflicts.slice(0, 2);
}

export async function getEvidenceByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const items = evidence.filter(
    (item) =>
      item.entityType === "PARCEL" &&
      (item.entityId === parcelId || String(parcelId).includes(String(item.entityId)))
  );

  return items.length > 0 ? items : evidence;
}

export async function getRiskByParcel(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const risk = riskScores.find(
    (item) => item.parcelId === parcelId
  );

  if (!risk) {
    return riskScores[0] || null;
  }

  return risk;
}

export async function getParcelIntelligence(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const validation = validationResults.find(
    (item) => item.parcelId === parcelId
  ) || validationResults[0];

  const parcelConflicts = conflicts.filter(
    (item) => item.parcelId === parcelId
  );

  const parcelEvidence = evidence.filter(
    (item) =>
      item.entityType === "PARCEL" &&
      item.entityId === parcelId
  );

  const risk = riskScores.find(
    (item) => item.parcelId === parcelId
  ) || riskScores[0];

  return {
    validation,
    conflicts: parcelConflicts.length ? parcelConflicts : conflicts.slice(0, 2),
    evidence: parcelEvidence.length ? parcelEvidence : evidence,
    risk,
  };
}