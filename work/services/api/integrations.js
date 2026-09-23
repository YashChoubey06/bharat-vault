import api from "./client";
export async function getSystemHealth() {
  const {data} = await api.get("/health");
  return {overall_status: data.status, providers: [{id:"backend",name:"Local backend",category:"Database",status:"CONNECTED",mode:data.storage,message:"Local database reachable"},
    {id:"sources",name:"External evidence sources",category:"Evidence",status:data.sourceMode === "mock" ? "SIMULATED" : "UNCONFIGURED",mode:data.sourceMode,message:"Source mode configured by the backend"}]};
}
