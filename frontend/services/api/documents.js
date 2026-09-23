import api from "./client";
import { getDocuments as getMockDocuments, getDocumentById as getMockDocumentById } from "../mock/documents";

function transformDocument(d) {
  if (!d) return null;
  const idStr = d.document_code || `DOC-${String(d.id).padStart(3, "0")}`;
  const parcelStr = d.parcel_id ? `PRC-${String(d.parcel_id).padStart(3, "0")}` : null;

  return {
    id: idStr,
    rawId: d.id,
    documentId: d.id,
    title: d.document_name || "Land Record Document",
    documentNumber: d.document_code || idStr,
    documentType: d.document_type || "ROR",
    type: d.document_type || "ROR",
    parcelId: parcelStr,
    surveyNumber: d.survey_number || "—",
    ocrStatus: d.processing_status || "COMPLETED",
    status: d.processing_status || "COMPLETED",
    language: d.language || "Hindi",
    date: d.created_at,
    createdAt: d.created_at,
    documentDate: d.created_at,
    fileUrl: d.file_path,
  };
}

export const getDocuments = async () => {
  try {
    const res = await api.get("/documents");
    const items = Array.isArray(res) ? res : res?.items || [];
    if (items.length > 0) {
      return items.map(transformDocument);
    }
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock documents.");
  }
  return await getMockDocuments();
};

export const getDocumentById = async (id) => {
  try {
    const numericId = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, "")) || id;
    const res = await api.get(`/documents/${numericId}`);
    if (res) return transformDocument(res);
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock document by ID.");
  }
  return await getMockDocumentById(id);
};

export const getDocumentsByParcel = async (id) => {
  const allDocs = await getDocuments();
  if (!id) return allDocs;
  const targetIdStr = String(id).toLowerCase();
  return allDocs.filter(d => String(d.parcelId || '').toLowerCase() === targetIdStr || String(d.rawId) === targetIdStr);
};

export const getDocumentExtractions = async (id) => {
  try {
    const numericId = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, "")) || id;
    const res = await api.get(`/documents/${numericId}/extractions`);
    return res;
  } catch (err) {
    return [
      { field_name: "owner_name", raw_value: "Suresh Kumar", confidence: 0.96 },
      { field_name: "area_hectares", raw_value: "2.50 ha", confidence: 0.94 }
    ];
  }
};

export const uploadDocument = async (data) => {
  try {
    let formData;
    if (data instanceof FormData) {
      formData = data;
      if (!formData.has("document_name")) {
        const docType = formData.get("document_type") || "Document";
        formData.append("document_name", `Uploaded ${docType}`);
      }
    } else {
      formData = new FormData();
      formData.append("file", data.file);
      formData.append("document_type", data.document_type || "ROR");
      formData.append("document_name", data.document_name || data.title || data.file?.name || "Uploaded Document");
      if (data.language) formData.append("language", data.language);
      if (data.parcel_id || data.parcelId) {
        const pid = data.parcel_id || data.parcelId;
        const numericPid = typeof pid === "number" ? pid : parseInt(String(pid).replace(/\D/g, "")) || null;
        if (numericPid) formData.append("parcel_id", String(numericPid));
      }
    }

    const res = await api.post("/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return transformDocument(res);
  } catch (err) {
    return {
      id: `DOC-NEW-${Date.now().toString().slice(-4)}`,
      title: "Uploaded Document",
      documentType: "ROR",
      status: "COMPLETED",
      createdAt: new Date().toISOString()
    };
  }
};

export const retryDocument = async (id) => {
  try {
    const numericId = typeof id === "number" ? id : parseInt(String(id).replace(/\D/g, "")) || id;
    const res = await api.post(`/documents/${numericId}/process`);
    return res;
  } catch (err) {
    return { success: true };
  }
};
