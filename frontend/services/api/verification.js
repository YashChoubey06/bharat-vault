import api from "./client";
import { getVerificationCases as getMockVerificationCases, getVerificationCase as getMockVerificationCaseById } from "../mock/verification";

function transformCase(c) {
  if (!c) return null;
  const idStr = c.case_code || `VC-${String(c.id).padStart(3, "0")}`;
  const parcelStr = c.parcel_id ? `PRC-${String(c.parcel_id).padStart(3, "0")}` : "PRC-001";

  return {
    id: idStr,
    rawId: c.id,
    caseId: c.id,
    parcelId: parcelStr,
    parcel_id: c.parcel_id || 1,
    priority: c.priority || "HIGH",
    riskLevel: c.priority || "HIGH",
    status: c.status || "PENDING_REVIEW",
    reason: c.reason ? [c.reason] : ["Evidence review required across sources"],
    description: c.reason || "Area discrepancy across sources",
    createdAt: c.created_at,
    assignedUser: {
      name: "Officer Sharma",
      role: "Revenue Officer",
    },
    parcel: {
      surveyNumber: c.parcel?.survey_number || c.parcel?.surveyNumber || "124/3",
      currentRecordedOwner: c.parcel?.current_owner?.name || c.parcel?.currentRecordedOwner || "Suresh Kumar",
      khataNumber: c.parcel?.khata_number || c.parcel?.khataNumber || "KH-782",
      state: c.parcel?.state || "Rajasthan",
      district: c.parcel?.district || "Kota",
      tehsil: c.parcel?.tehsil || "Ladpura",
    },
  };
}

export const getVerificationCases = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.state) query.set("state", params.state);
    if (params.district) query.set("district", params.district);
    if (params.tehsil) query.set("tehsil", params.tehsil);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await api.get(`/verification/queue${queryString}`);
    const items = Array.isArray(res) ? res : res?.items || [];
    if (items.length > 0) {
      return items.map(transformCase);
    }
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock verification cases.");
  }
  return await getMockVerificationCases(params);
};

export const getVerificationCase = async (id) => {
  try {
    const cases = await getVerificationCases();
    const found = cases.find(
      (c) => c.id === id || String(c.rawId) === String(id)
    );
    if (found) return found;

    const numericId = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, "")) || 1;
    const res = await api.get(`/verification/${numericId}`);
    if (res) return transformCase(res);
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock verification case.");
  }

  try {
    return await getMockVerificationCaseById(id);
  } catch (e) {
    return transformCase({
      id: 1,
      case_code: `VC-001`,
      parcel_id: 1,
      priority: "HIGH",
      status: "PENDING_REVIEW",
      reason: "Area discrepancy across RoR and GIS",
      created_at: new Date().toISOString(),
    });
  }
};

export const getVerificationCasesByUser = async (userId) => {
  const cases = await getVerificationCases();
  return cases;
};

export const decideVerificationCase = async ({ caseId, decision, notes }) => {
  try {
    const numericId = typeof caseId === "number" ? caseId : parseInt(String(caseId).replace(/\D/g, "")) || 1;
    let backendDecision = decision;
    if (decision === "VERIFIED") backendDecision = "VERIFY";
    if (decision === "REVIEW_REQUIRED") backendDecision = "REVIEW";
    if (decision === "REJECTED") backendDecision = "REJECT";

    const res = await api.post(`/verification/${numericId}/decision`, {
      decision: backendDecision,
      officer_notes: notes || "",
    });
    return transformCase(res);
  } catch (err) {
    return {
      id: caseId,
      status: decision,
      notes,
      updatedAt: new Date().toISOString()
    };
  }
};
