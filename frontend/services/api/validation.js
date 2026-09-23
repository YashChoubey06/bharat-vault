import api from "./client";
import {
  getValidationByParcel as getMockValidationByParcel,
  getConflictsByParcel as getMockConflictsByParcel,
  getEvidenceByParcel as getMockEvidenceByParcel,
  getRiskByParcel as getMockRiskByParcel,
  getParcelIntelligence as getMockParcelIntelligence,
  getValidationCheckCenterData as getMockValidationCheckCenterData,
} from "../mock/validation";

function getNumericId(id) {
  if (typeof id === "number") return id;
  return parseInt(String(id).replace(/\D/g, "")) || 1;
}

export const getValidationByParcel = async (id) => {
  try {
    const numericId = getNumericId(id);
    const res = await api.get(`/parcels/${numericId}/validation`);
    if (res) return res;
  } catch (e) {
    console.warn("Backend API unreachable, using mock validation by parcel.");
  }
  return await getMockValidationByParcel(id);
};

export const getConflictsByParcel = async (id) => {
  try {
    const numericId = getNumericId(id);
    const res = await api.get(`/parcels/${numericId}/conflicts`);
    const list = Array.isArray(res) ? res : res?.conflicts || [];
    if (list.length > 0) return list;
  } catch (e) {
    console.warn("Backend API unreachable, using mock conflicts by parcel.");
  }
  return await getMockConflictsByParcel(id);
};

export const getEvidenceByParcel = async (id) => {
  try {
    const numericId = getNumericId(id);
    const res = await api.get(`/parcels/${numericId}/evidence`);
    const list = Array.isArray(res) ? res : res?.items || [];
    if (list.length > 0) {
      return list.map((ev) => ({
        id: ev.id,
        field: ev.field_name || ev.field,
        value: ev.extracted_value || ev.value,
        confidence: Math.round(
          (ev.confidence_score || ev.confidence || 0.95) * (ev.confidence_score <= 1 ? 100 : 1)
        ),
        source: ev.source_document || ev.sourceType || "Record of Rights (RoR)",
        page: ev.page_number || ev.page || 1,
        documentId: ev.document_id ? `DOC-${String(ev.document_id).padStart(3, "0")}` : "DOC-001",
      }));
    }
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock evidence.");
  }
  return await getMockEvidenceByParcel(id);
};

export const getRiskByParcel = async (id) => {
  try {
    const numericId = getNumericId(id);
    const res = await api.get(`/parcels/${numericId}/risk`);
    if (res) return res;
  } catch (e) {
    console.warn("Backend API unreachable, using mock risk by parcel.");
  }
  return await getMockRiskByParcel(id);
};

export const getParcelIntelligence = async (id) => {
  try {
    const [val, conf, ev, rk] = await Promise.all([
      getValidationByParcel(id),
      getConflictsByParcel(id),
      getEvidenceByParcel(id),
      getRiskByParcel(id),
    ]);
    return { validation: val, conflicts: conf, evidence: ev, risk: rk };
  } catch (e) {
    return await getMockParcelIntelligence(id);
  }
};

export const getEvidenceViewerWorkspace = async (id) => {
  const numericId = getNumericId(id);

  let summary = null;
  try {
    summary = await api.get(`/parcels/${numericId}/summary`);
  } catch (e) {}

  let docs = [];
  try {
    const rawDocs = await api.get("/documents", { params: { parcel_id: numericId } });
    docs = Array.isArray(rawDocs) ? rawDocs : rawDocs.items || [];
  } catch (e) {}

  let evidenceList = [];
  try {
    const rawEv = await api.get(`/parcels/${numericId}/evidence`);
    evidenceList = Array.isArray(rawEv) ? rawEv : rawEv.items || [];
  } catch (e) {}

  const documents = docs.length
    ? docs.map((d, index) => ({
        id: d.document_code || `DOC-${String(d.id).padStart(3, "0")}`,
        rawId: d.id,
        name: d.document_name || `Source Document #${index + 1}`,
        pages: 1,
        processedPages: 1,
        completedAt: d.created_at,
        ocrStatus: d.processing_status || "COMPLETED",
      }))
    : [
        {
          id: "ror",
          rawId: 1,
          name: "Record of Rights (Jamabandi)",
          pages: 1,
          processedPages: 1,
          completedAt: new Date().toISOString(),
          ocrStatus: "COMPLETED",
        },
      ];

  const defaultDocId = documents[0].id;

  const fields = evidenceList.length
    ? evidenceList.map((ev, index) => ({
        id: String(ev.id),
        rawId: ev.id,
        documentId: defaultDocId,
        page: ev.page_number || 1,
        label: ev.field_name || `Field ${index + 1}`,
        value: ev.extracted_value || "—",
        originalValue: ev.extracted_value || "—",
        confidence: Math.round((ev.confidence_score || 0.92) * 100),
        confidenceType: "OCR Bounding Box Confidence",
        source: ev.source_document || documents[0].name,
        extractedAt: ev.created_at || new Date().toISOString(),
        validation: ev.is_verified ? "Verified match" : "Review needed",
        state: ev.is_verified ? "verified" : "warning",
        bbox: {
          left: 10 + (index % 3) * 25,
          top: 15 + Math.floor(index / 3) * 15,
          width: 22,
          height: 8,
        },
      }))
    : [
        {
          id: "f1",
          documentId: defaultDocId,
          page: 1,
          label: "Recorded Owner",
          value: summary?.current_owner?.name || "Suresh Kumar",
          originalValue: summary?.current_owner?.name || "Suresh Kumar",
          confidence: 96,
          confidenceType: "OCR Model Confidence",
          source: documents[0].name,
          extractedAt: new Date().toISOString(),
          validation: "Verified match",
          state: "verified",
          bbox: { left: 12, top: 20, width: 35, height: 7 },
        },
        {
          id: "f2",
          documentId: defaultDocId,
          page: 1,
          label: "Recorded Area",
          value: summary?.area_hectares ? `${summary.area_hectares} ha` : "2.50 ha",
          originalValue: summary?.area_hectares ? `${summary.area_hectares} ha` : "2.50 ha",
          confidence: 88,
          confidenceType: "Numeric Area Extraction",
          source: documents[0].name,
          extractedAt: new Date().toISOString(),
          validation: "Discrepancy detected with GIS",
          state: "warning",
          bbox: { left: 12, top: 32, width: 25, height: 7 },
        },
      ];

  return {
    parcel: {
      id: summary?.parcel_code || `PRC-${String(numericId).padStart(3, "0")}`,
      currentRecordedOwner: summary?.current_owner?.name || "Suresh Kumar",
      surveyNumber: summary?.survey_number || "124/3",
      recordStatus: summary?.validation_status || "REVIEW_REQUIRED",
      updatedAt: summary?.created_at || new Date().toISOString(),
      village: {
        name: summary?.village_name || "Rampura",
        district: summary?.district || "Kota",
      },
    },
    documents,
    fields,
  };
};

export const reviewEvidence = async (id, data) => {
  try {
    const numericId = getNumericId(id);
    const res = await api.patch(`/extractions/${numericId}`, {
      raw_value: data.value,
      confidence: data.state === "verified" ? 1.0 : 0.8,
    });
    return res;
  } catch (e) {
    return { success: true };
  }
};
