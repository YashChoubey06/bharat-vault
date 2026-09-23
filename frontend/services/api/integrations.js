import api from "./client";
import { getSystemHealth as getMockSystemHealth } from "../mock/integrations";

export const getSystemHealth = async () => {
  try {
    const data = await api.get("/integrations/health");
    if (data && data.providers && data.providers.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Backend /integrations/health API unreachable, using fallback mock system health.");
  }
  return await getMockSystemHealth();
};
