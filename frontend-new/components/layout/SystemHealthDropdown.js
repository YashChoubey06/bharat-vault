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
import styles from "./SystemHealthDropdown.module.css";

export default function SystemHealthDropdown({ isOpen, onClose }) {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await getSystemHealth();
      setHealthData(res);
    } catch (err) {
      setHealthData(null);
      console.error("Error fetching system health:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const providers = healthData?.providers || [];

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.dropdown} role="menu">
        <div className={styles.cardContainer}>
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <div className={styles.eyebrowRow}>
              <Server size={13} />
              <span>INTEGRATION READINESS</span>
            </div>
            <h2 className={styles.cardTitle}>System Health & Connectors</h2>
          </div>

          <div className={styles.overallBadge}>
            <Activity size={12} />
            <span>{healthData?.overall_status || "UNAVAILABLE"}</span>
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
