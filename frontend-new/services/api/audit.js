import api from "./client";
import { inScope } from "./scope";
export const getAuditLogs = async (scope = {}) => {
  const logs = (await api.get("/audit")).data;
  if (!scope.state && !scope.district && !scope.tehsil) return logs;
  const ids = new Set((await api.get("/parcels")).data.filter(p => inScope(p, scope)).map(p => p.id));
  return logs.filter(log => ids.has(log.entityId));
};
export const getAuditLogsByEntity = async entityId => (await api.get("/audit",{params:{entityId}})).data;

export const verifyAuditIntegrity = async () => (await api.get("/audit/integrity")).data;
