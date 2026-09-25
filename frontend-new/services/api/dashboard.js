import api from "./client";
import { inScope } from "./scope";
export async function getDashboardStats(scope = {}) {
  const [summary, parcels, documents] = await Promise.all([api.get("/dashboard"), api.get("/parcels"), api.get("/documents")]);
  const ps = parcels.data.filter(p => inScope(p, scope));
  const ids = new Set(ps.map(p => p.id));
  const docs = documents.data.filter(d => ids.has(d.parcelId));
  const riskDistribution = Object.fromEntries(["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(level => [level.toLowerCase(), ps.filter(p => p.riskLevel === level).length]));
  return {...summary.data, totalRecords: ps.length, totalDocuments: docs.length,
    verifiedRecords: ps.filter(p => p.recordStatus === "VERIFIED").length,
    reviewRequired: ps.filter(p => p.recordStatus === "REVIEW_REQUIRED").length,
    highRisk: riskDistribution.high, criticalRisk: riskDistribution.critical, riskDistribution,
    recordHealth: ps.length ? Math.round(ps.reduce((sum,p) => sum + (p.recordHealth || 0),0)/ps.length) : 0,
    processedRecords: ps.filter(p => docs.some(d => d.parcelId === p.id && d.ocrStatus === "COMPLETED")).length,
    processingToday: docs.filter(d => d.uploadedAt?.slice(0,10) === new Date().toISOString().slice(0,10)).length};
}
