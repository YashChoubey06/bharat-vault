import api from "./client";
import { inScope } from "./scope";
export const getVerificationCases = async (scope = {}) => (await api.get("/verification")).data.filter(c => inScope(c.parcel || {}, scope));
export const getVerificationCase = async id => (await api.get("/verification/"+encodeURIComponent(id))).data;
export const getVerificationCasesByUser = async id => (await getVerificationCases()).filter(c=>c.assignedTo===id);
export const decideVerificationCase = async ({caseId,decision,notes}) => (await api.post("/verification/"+encodeURIComponent(caseId)+"/decision",{decision,notes})).data;
