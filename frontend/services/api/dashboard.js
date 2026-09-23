import api from "./client";
import { getDashboardStats as getMockDashboardStats, calculateDilrmpProgress } from "../mock/dashboard";

export const getDashboardStats = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.state) query.set("state", params.state);
    if (params.district) query.set("district", params.district);
    if (params.tehsil) query.set("tehsil", params.tehsil);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const raw = await api.get(`/dashboard/summary${queryString}`);

    if (raw && (raw.total_documents >= 0 || raw.verified_records >= 0)) {
      const totalDocs = raw.total_documents || 0;
      const verified = raw.verified_records || 0;
      const health = totalDocs > 0 ? Math.round((verified / totalDocs) * 100) || 93 : 93;

      const dilrmpProgress = raw.dilrmp_progress || calculateDilrmpProgress(params);

      return {
        totalRecords: raw.total_documents || 0,
        verifiedRecords: raw.verified_records || 0,
        reviewRequired: raw.pending_review || 0,
        highRisk: raw.high_risk || 0,
        criticalRisk: raw.critical || 0,
        totalDocuments: raw.total_documents || 0,
        recordHealth: health,
        processedRecords: raw.processed_documents || 0,
        processingToday: raw.processing_today || 0,
        averageProcessingTime: `${raw.average_processing_time_sec || 3.8}s`,
        riskDistribution: {
          low: raw.risk_distribution?.LOW || 0,
          medium: raw.risk_distribution?.MEDIUM || 0,
          high: raw.risk_distribution?.HIGH || 0,
          critical: raw.risk_distribution?.CRITICAL || 0,
        },
        processingDistribution: {
          uploaded: raw.processing_distribution?.UPLOADED || 0,
          queued: raw.processing_distribution?.PROCESSING || 0,
          ocr_completed: raw.processing_distribution?.COMPLETED || 0,
          verified: raw.verified_records || 0,
          failed: raw.processing_distribution?.FAILED || 0,
        },
        dilrmpProgress,
      };
    }
  } catch (err) {
    console.warn("Backend API unreachable, using fallback mock dashboard data.");
  }

  return await getMockDashboardStats(params);
};
