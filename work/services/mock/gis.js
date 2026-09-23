import { administrativeRegions, spatialParcels } from "./data/gis";

export async function getSpatialOverview(scope = {}) {
  await new Promise((resolve) => setTimeout(resolve, 150));

  const state = scope.state || "";
  const district = scope.district || "";
  const tehsil = scope.tehsil || "";

  // 1. Determine Administrative Level & Child Regions
  let currentLevel = "ALL_INDIA";
  let regions = administrativeRegions["All India"] || [];

  if (tehsil) {
    currentLevel = "TEHSIL";
    regions = [];
  } else if (district) {
    currentLevel = "DISTRICT";
    regions = administrativeRegions[district] || [];
  } else if (state) {
    currentLevel = "STATE";
    regions = administrativeRegions[state] || [];
  }

  // 2. Filter Parcels matching scope
  let parcels = spatialParcels.filter((p) => {
    if (state && p.state !== state) return false;
    if (district && p.district !== district) return false;
    if (tehsil && p.tehsil !== tehsil) return false;
    return true;
  });

  const hasCoordinates = parcels.length > 0 || regions.length > 0;

  return {
    scope,
    level: currentLevel,
    gisSource: "DEMO / MOCK",
    hasCoordinates,
    regions,
    parcels,
  };
}
