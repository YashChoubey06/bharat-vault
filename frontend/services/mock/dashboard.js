import { dashboard } from "./data/dashboard";
import { LOCATION_HIERARCHY } from "./data/locations";

const STATE_WEIGHTS = {
  "Rajasthan": 0.45,
  "Madhya Pradesh": 0.25,
  "Maharashtra": 0.18,
  "Uttar Pradesh": 0.12,
};

const DISTRICT_WEIGHTS = {
  "Kota": 0.35,
  "Jaipur": 0.40,
  "Udaipur": 0.15,
  "Jodhpur": 0.10,
  "Bhopal": 0.55,
  "Indore": 0.45,
  "Pune": 0.65,
  "Nagpur": 0.35,
  "Lucknow": 0.60,
  "Varanasi": 0.40,
};

const TEHSIL_WEIGHTS = {
  "Ladpura": 0.45,
  "Sangod": 0.25,
  "Digod": 0.18,
  "Ramganj Mandi": 0.12,
  "Sanganer": 0.50,
  "Amer": 0.50,
};

export function calculateDilrmpProgress(params = {}) {
  const { state, district, tehsil } = params;

  let ror = 94;
  let map = 87;
  let linkage = 78;
  let reg = 81;
  let court = 64;

  if (state === "Rajasthan") {
    ror = 96; map = 91; linkage = 83; reg = 85; court = 71;
  } else if (state === "Madhya Pradesh") {
    ror = 92; map = 84; linkage = 74; reg = 79; court = 60;
  } else if (state === "Maharashtra") {
    ror = 95; map = 89; linkage = 80; reg = 84; court = 68;
  } else if (state === "Uttar Pradesh") {
    ror = 90; map = 82; linkage = 72; reg = 76; court = 58;
  }

  if (district) {
    if (district === "Kota") {
      ror = 98; map = 94; linkage = 89; reg = 90; court = 78;
    } else if (district === "Jaipur") {
      ror = 97; map = 93; linkage = 87; reg = 89; court = 76;
    } else if (district === "Bhopal") {
      ror = 95; map = 88; linkage = 81; reg = 84; court = 67;
    } else if (district === "Pune") {
      ror = 96; map = 92; linkage = 85; reg = 88; court = 74;
    }
  }

  if (tehsil) {
    if (tehsil === "Ladpura") {
      ror = 99; map = 96; linkage = 92; reg = 93; court = 84;
    } else if (tehsil === "Sangod") {
      ror = 97; map = 92; linkage = 86; reg = 88; court = 73;
    }
  }

  return {
    ror_digitized_percent: ror,
    cadastral_digitized_percent: map,
    ror_map_linked_percent: linkage,
    registration_integrated_percent: reg,
    court_integration_percent: court,
    last_updated: "2026-09-20",
    source_status: "SIMULATED DATA",
  };
}

export async function getDashboardStats(params = {}) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const { state, district, tehsil } = params;
  const dilrmpProgress = calculateDilrmpProgress(params);

  if (!state) {
    return {
      ...dashboard,
      dilrmpProgress,
      scope: { level: "ALL_INDIA", label: "All India (National)" },
    };
  }

  let scale = STATE_WEIGHTS[state] || 0.40;
  let level = "STATE";
  let label = `${state} State`;

  if (district) {
    const distScale = DISTRICT_WEIGHTS[district] || 0.35;
    scale = scale * distScale;
    level = "DISTRICT";
    label = `${district} District, ${state}`;

    if (tehsil) {
      const tehsilScale = TEHSIL_WEIGHTS[tehsil] || 0.40;
      scale = scale * tehsilScale;
      level = "TEHSIL";
      label = `${tehsil} Tehsil, ${district}, ${state}`;
    }
  }

  const totalRecords = Math.round(dashboard.totalRecords * scale);
  const processedRecords = Math.round(dashboard.processedRecords * scale);
  const verifiedRecords = Math.round(dashboard.verifiedRecords * scale);
  const reviewRequired = Math.round(dashboard.reviewRequired * scale);
  const highRisk = Math.round(dashboard.highRisk * scale);
  const criticalRisk = Math.max(1, Math.round(dashboard.criticalRisk * scale));
  const processingToday = Math.max(5, Math.round(dashboard.processingToday * scale));

  const lowRisk = Math.round(dashboard.riskDistribution.low * scale);
  const mediumRisk = Math.round(dashboard.riskDistribution.medium * scale);

  const health = totalRecords > 0 ? Math.min(99, Math.max(75, Math.round((verifiedRecords / totalRecords) * 100))) : 93;

  return {
    totalRecords,
    processedRecords,
    verifiedRecords,
    reviewRequired,
    highRisk,
    criticalRisk,
    mediumRisk,
    lowRisk,
    processingToday,
    averageProcessingTime: "3.8s",
    recordHealth: health,
    riskDistribution: {
      low: lowRisk,
      medium: mediumRisk,
      high: highRisk,
      critical: criticalRisk,
    },
    validationDistribution: {
      verified: verifiedRecords,
      reviewRequired,
      highRisk,
      critical: criticalRisk,
    },
    dilrmpProgress,
    scope: { level, label, state, district, tehsil },
  };
}