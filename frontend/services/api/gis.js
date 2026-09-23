import api from "./client";
import { getSpatialOverview as getMockSpatialOverview } from "../mock/gis";

export const getSpatialOverview = async (scope = {}) => {
  try {
    const params = new URLSearchParams();
    if (scope.state) params.set("state", scope.state);
    if (scope.district) params.set("district", scope.district);
    if (scope.tehsil) params.set("tehsil", scope.tehsil);

    const data = await api.get(`/gis/overview?${params.toString()}`);
    if (data && (data.parcels || data.regions)) {
      return data;
    }
  } catch (err) {
    console.warn("Backend API /gis/overview unreachable, using fallback mock spatial overview.");
  }
  return await getMockSpatialOverview(scope);
};
