export const mockSystemHealth = {
  app_name: "Bharat Vault Land Intelligence Platform",
  system_mode: "LOCAL_DEMO_MVP",
  overall_status: "SIMULATED",
  total_providers: 5,
  connected_providers: 0,
  simulated_providers: 3,
  mock_providers: 2,
  updated_at: "2026-09-20T23:50:00Z",
  providers: [
    {
      id: "dilrmp",
      name: "DILRMP / Land Records",
      category: "Land Records",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:42 AM",
      message: "Simulated protocol adapter active (No live API key configured)",
      configured: false,
    },
    {
      id: "registration",
      name: "Registration Records",
      category: "Deed Registry",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:41 AM",
      message: "Simulated Sub-Registrar deed registry adapter active",
      configured: false,
    },
    {
      id: "revenue_court",
      name: "Revenue Court Records",
      category: "Litigation & Orders",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:40 AM",
      message: "Simulated revenue court litigation adapter active",
      configured: false,
    },
    {
      id: "gis",
      name: "Cadastral / GIS Engine",
      category: "Spatial Boundaries",
      status: "MOCK",
      mode: "LOCAL_GEOJSON",
      last_sync_at: "10:39 AM",
      message: "Local GeoJSON boundary dataset provider active",
      configured: false,
    },
    {
      id: "ocr",
      name: "OCR / ICR Engine",
      category: "Document Intelligence",
      status: "MOCK",
      mode: "DEVANAGARI_OCR",
      last_sync_at: "10:38 AM",
      message: "Pluggable Devanagari multilingual OCR provider active",
      configured: false,
    },
  ],
};

export async function getSystemHealth() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockSystemHealth;
}
