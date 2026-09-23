import api from "./client";
import {
  getReportSummary as getMockReportSummary,
  getRiskDistribution as getMockRiskDistribution,
  getValidationDistribution as getMockValidationDistribution,
  getRiskReport as getMockRiskReport,
  getConflictReport as getMockConflictReport,
  getValidationReport as getMockValidationReport,
} from "../mock/reports";

export const getReportSummary = async () => {
  try {
    const summary = await api.get("/dashboard/summary");
    if (summary) {
      return {
        totalRecords: summary.total_documents || summary.totalRecords || 0,
        processedRecords: summary.processed_documents || summary.processedRecords || 0,
        verifiedRecords: summary.verified_records || summary.verifiedRecords || 0,
        reviewRequired: summary.pending_review || summary.reviewRequired || 0,
        highRisk: summary.high_risk || summary.highRisk || 0,
        criticalRisk: summary.critical || summary.criticalRisk || 0,
      };
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock report summary.");
  }
  return await getMockReportSummary();
};

export const getRiskDistribution = async () => {
  try {
    const summary = await api.get("/dashboard/summary");
    if (summary?.risk_distribution) {
      const rd = summary.risk_distribution || {};
      return [
        { name: "Low Risk", value: rd.LOW || 0 },
        { name: "Medium Risk", value: rd.MEDIUM || 0 },
        { name: "High Risk", value: rd.HIGH || 0 },
        { name: "Critical Risk", value: rd.CRITICAL || 0 },
      ];
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock risk distribution.");
  }
  return await getMockRiskDistribution();
};

export const getValidationDistribution = async () => {
  try {
    const summary = await api.get("/dashboard/summary");
    if (summary) {
      const pd = summary.processing_distribution || {};
      return [
        { name: "Verified", value: summary.verified_records || 0 },
        { name: "Review Required", value: summary.pending_review || 0 },
        { name: "Processing", value: pd.PROCESSING || 0 },
        { name: "Completed", value: pd.COMPLETED || 0 },
      ];
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock validation distribution.");
  }
  return await getMockValidationDistribution();
};

export const getRiskReport = async () => {
  try {
    let items = [];
    try {
      const res = await api.get("/parcels/risk/summary");
      items = Array.isArray(res) ? res : res?.items || [];
    } catch (e) {
      const res = await api.get("/parcels");
      items = Array.isArray(res) ? res : res?.items || [];
    }
    if (items.length > 0) {
      return items.map((p) => ({
        id: p.id,
        parcelId: p.parcel_code || `PRC-${String(p.id).padStart(3, "0")}`,
        score: p.risk_score || 45,
        riskScore: p.risk_score || 45,
        level: p.risk_level || "MEDIUM",
        riskLevel: p.risk_level || "MEDIUM",
      }));
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock risk report.");
  }
  return await getMockRiskReport();
};

export const getConflictReport = async () => {
  try {
    const res = await api.get("/parcels");
    const items = Array.isArray(res) ? res : res?.items || [];
    if (items.length > 0) {
      return items
        .filter((p) => p.pending_dispute || p.risk_level === "HIGH" || p.risk_level === "CRITICAL")
        .map((p) => ({
          id: p.id,
          parcelId: p.parcel_code || `PRC-${String(p.id).padStart(3, "0")}`,
          conflictType: p.pending_dispute ? "Revenue Court Dispute" : "Area Discrepancy",
          description: p.pending_dispute
            ? "Active legal dispute filed against recorded title."
            : "Inconsistency between registered deed and GIS survey boundary.",
        }));
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock conflict report.");
  }
  return await getMockConflictReport();
};

export const getValidationReport = async () => {
  try {
    const res = await api.get("/parcels");
    const items = Array.isArray(res) ? res : res?.items || [];
    if (items.length > 0) {
      return items.map((p) => ({
        id: p.id,
        parcelId: p.parcel_code || `PRC-${String(p.id).padStart(3, "0")}`,
        overallResult: p.validation_status || "REVIEW_REQUIRED",
        checks: 4,
        conflicts: p.pending_dispute ? 1 : 0,
        status: p.validation_status || "REVIEW_REQUIRED",
      }));
    }
  } catch (err) {
    console.warn("Backend API unreachable, using mock validation report.");
  }
  return await getMockValidationReport();
};
