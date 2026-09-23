import api from "./client";
import { inScope } from "./scope";
export async function getSpatialOverview(scope = {}) {
  const ps = (await api.get("/parcels")).data.filter(p => inScope(p, scope));
  return {scope, gisSource:"Local parcel evidence (schematic)", regions:[], hasCoordinates: ps.some(p => p.gis?.geometry?.coordinates?.length),
    parcels: ps.filter(p => p.gis?.geometry?.coordinates?.length).map(p => ({...p, riskScore:p.risk?.riskScore ?? 0,
      recordedArea:Number(p.recordedArea || 0), gisArea:Number(p.gis.area || 0), conflictStatus:p.recordStatus, conflictDescription:p.gis.source || "Local GIS"}))};
}
