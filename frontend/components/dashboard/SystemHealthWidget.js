"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ExternalLink,
  X,
  Server,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { getSystemHealth } from "@/services/api/integrations";
import styles from "./SystemHealthWidget.module.css";

export default function SystemHealthWidget() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await getSystemHealth();
      setHealthData(res);
    } catch (err) {
      console.error("Error fetching system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const providers = healthData?.providers || [
    {
      id: "dilrmp",
      name: "DILRMP / Land Records",
      category: "Land Records",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:42 AM",
      message: "Simulated protocol adapter active (No live API key configured)",
    },
    {
      id: "registration",
      name: "Registration Records",
      category: "Deed Registry",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:41 AM",
      message: "Simulated Sub-Registrar deed registry adapter active",
    },
    {
      id: "revenue_court",
      name: "Revenue Court Records",
      category: "Litigation & Orders",
      status: "SIMULATED",
      mode: "DEMO",
      last_sync_at: "10:40 AM",
      message: "Simulated revenue court litigation adapter active",
    },
    {
      id: "gis",
      name: "Cadastral / GIS Engine",
      category: "Spatial Boundaries",
      status: "MOCK",
      mode: "LOCAL_GEOJSON",
      last_sync_at: "10:39 AM",
      message: "Local GeoJSON boundary dataset provider active",
    },
    {
      id: "ocr",
      name: "OCR / ICR Engine",
      category: "Document Intelligence",
      status: "MOCK",
      mode: "DEVANAGARI_OCR",
      last_sync_at: "10:38 AM",
      message: "Pluggable Devanagari multilingual OCR provider active",
    },
  ];

  return (
    <>
      <div className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.eyebrowRow}>
              <Server size={13} />
              <span>INTEGRATION READINESS</span>
            </div>
            <h2 className={styles.cardTitle}>System Health & Connectors</h2>
            <p className={styles.cardSubtitle}>
              Truthful status of external data connectors & adapters
            </p>
          </div>

          <div className={styles.overallBadge}>
            <Activity size={12} />
            <span>{healthData?.overall_status || "SIMULATED"}</span>
          </div>
        </div>

        <div className={styles.providerList}>
          {providers.map((p) => {
            const toneKey = (p.status || "SIMULATED").toLowerCase();

            return (
              <div key={p.id} className={styles.providerRow}>
                <div className={styles.providerLeft}>
                  <span className={`${styles.statusDot} ${styles[`dot_${toneKey}`]}`} />
                  <div>
                    <span className={styles.providerName}>{p.name}</span>
                    <span className={styles.providerCategory}>• {p.category}</span>
                  </div>
                </div>

                <span className={`${styles.statusPill} ${styles[`pill_${toneKey}`]}`}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.cardFooter}>
          <button
            type="button"
            className={styles.detailsBtn}
            onClick={() => setShowModal(true)}
          >
            <span>View Integration Details</span>
            <ExternalLink size={12} />
          </button>

          <button
            type="button"
            onClick={fetchHealth}
            style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
            title="Refresh integration status"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Integration Detail Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Integration Health & Architecture</h3>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>
                  Pluggable adapter readiness & connector configuration log
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.guideBox}>
                <strong>🔌 Future-Ready Adapter Architecture:</strong>
                <br />
                Bharat Vault uses an abstract adapter pattern (`BaseIntegrationAdapter`). In production mode, live state land record APIs, Sub-Registrar portals, or GIS web services can be plugged in by setting environment variables (`DILRMP_API_KEY`, `REGISTRATION_API_KEY`, `GIS_SERVER_URL`) without altering any dashboard components.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {providers.map((p) => {
                  const toneKey = (p.status || "SIMULATED").toLowerCase();

                  return (
                    <div key={p.id} className={styles.modalDetailCard}>
                      <div className={styles.modalDetailHeader}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`${styles.statusDot} ${styles[`dot_${toneKey}`]}`} />
                          <strong style={{ fontSize: "13px", color: "#0f172a" }}>{p.name}</strong>
                        </div>
                        <span className={`${styles.statusPill} ${styles[`pill_${toneKey}`]}`}>
                          {p.status} ({p.mode || "DEMO"})
                        </span>
                      </div>

                      <p className={styles.modalMessage}>{p.message}</p>
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        Last Sync / Check: {p.last_sync_at || "N/A"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
