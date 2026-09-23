import apiClient from "./client";

export async function askAssistant(params) {
  const { parcelId, question, query } = typeof params === "string" ? { question: params } : params || {};

  const queryText = question || query || "";
  const numericId = parcelId ? (typeof parcelId === "number" ? parcelId : parseInt(String(parcelId).replace(/\D/g, "")) || null) : null;

  const res = await apiClient.post("/assistant/query", {
    query: queryText,
    parcel_id: numericId,
  });

  return {
    answer: res.answer || res,
    citations: res.citations || [],
    confidenceScore: res.confidence_score,
    sufficientEvidence: res.sufficient_evidence,
  };
}

export const queryAssistant = askAssistant;
