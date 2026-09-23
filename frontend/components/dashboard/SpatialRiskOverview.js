"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Globe,
  AlertTriangle,
  Info,
  ExternalLink,
  Layers,
  X,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { getSpatialOverview } from "@/services/api/gis";
import styles from "./SpatialRiskOverview.module.css";

export default function SpatialRiskOverview({ scope = {}, onChangeScope }) {
  const router = useRouter();
  const [spatialData, setSpatialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);

  useEffect(() => {
    async function loadSpatial() {
      try {
        setLoading(true);
        setSelectedParcel(null);
        const res = await getSpatialOverview(scope);
        setSpatialData(res);
      } catch (err) {
        console.error("Error loading spatial overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpatial();
  }, [scope]);

  const activeScopeTitle = scope.tehsil
    ? `${scope.tehsil} Tehsil`
    : scope.district
    ? `${scope.district} District`
    : scope.state
    ? `${scope.state} State`
    : "All India";

  const regions = spatialData?.regions || [];
  const parcels = spatialData?.parcels || [];
  const hasData = (regions.length > 0 || parcels.length > 0) && spatialData?.hasCoordinates !== false;

  function handleRegionClick(r) {
    if (!onChangeScope) return;

    if (scope.state === "" || !scope.state) {
      // All India -> Select State
      onChangeScope({ level: "STATE", state: r.name, district: "", tehsil: "" });
    } else if (!scope.district) {
      // State level -> Select District
      onChangeScope({ level: "DISTRICT", state: scope.state, district: r.name, tehsil: "" });
    } else if (!scope.tehsil) {
      // District level -> Select Tehsil
      onChangeScope({ level: "TEHSIL", state: scope.state, district: scope.district, tehsil: r.name });
    }
  }

  function handleParcelClick(p) {
    setSelectedParcel(p);
  }

  function handleOpenParcelGIS(parcelId) {
    // Navigate to existing parcel GIS workflow
    router.push(`/records/${parcelId}/gis`);
  }

  return (
    <div className={styles.cardContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrow}>
            <Globe size={13} />
            <span>CADASTRAL SURVEILLANCE • {activeScopeTitle.toUpperCase()}</span>
          </div>
          <h2 className={styles.title}>Spatial & Risk Overview</h2>
          <p className={styles.subtitle}>
            Administrative land parcel risk distribution & spatial anomaly signals
          </p>
        </div>

        <div className={styles.sourceBadge}>
          <Layers size={13} style={{ color: "#4f46e5" }} />
          <span>GIS Source: {spatialData?.gisSource || "DEMO / MOCK"}</span>
        </div>
      </div>

      {/* Map Canvas / Visualization Container */}
      <div className={styles.mapWrapper}>
        {/* Legend */}
        <div className={styles.legendBar}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#dc2626" }} />
            <span>Critical Risk</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#ea580c" }} />
            <span>High Risk</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#d97706" }} />
            <span>Medium Risk</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: "#16a34a" }} />
            <span>Low / Verified</span>
          </div>
        </div>

        {/* Dynamic Spatial Canvas */}
        {!hasData ? (
          /* TRUTHFUL EMPTY STATE */
          <div className={styles.emptyState}>
            <MapPin size={32} style={{ color: "#94a3b8" }} />
            <span className={styles.emptyTitle}>Spatial data unavailable for this scope</span>
            <p className={styles.emptySub}>
              No spatial boundary coordinates or GIS survey vectors exist for {activeScopeTitle} in current dataset.
            </p>
          </div>
        ) : (
          <svg className={styles.mapCanvas} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="overviewGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.4" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#overviewGrid)" />

            {/* Region Polygons (Clickable to change scope) */}
            {regions.map((r, i) => {
              const fill =
                r.criticalRiskCount > 5
                  ? "rgba(239, 68, 68, 0.12)"
                  : r.highRiskCount > 30
                  ? "rgba(249, 115, 22, 0.12)"
                  : "rgba(99, 102, 241, 0.08)";

              const stroke =
                r.criticalRiskCount > 5
                  ? "#ef4444"
                  : r.highRiskCount > 30
                  ? "#f97316"
                  : "#6366f1";

              return (
                <g key={r.id} onClick={() => handleRegionClick(r)} style={{ cursor: "pointer" }}>
                  {r.path && (
                    <path
                      d={r.path}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth="1.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Region Centroid Marker & Label */}
                  <circle
                    cx={(i + 1) * 20 + 5}
                    cy={(i % 2 === 0 ? 35 : 65)}
                    r="3.5"
                    fill={stroke}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <rect
                    x={(i + 1) * 20 - 10}
                    y={(i % 2 === 0 ? 35 : 65) + 5}
                    width="30"
                    height="10"
                    rx="2"
                    fill="#1e293b"
                    opacity="0.9"
                  />
                  <text
                    x={(i + 1) * 20 + 5}
                    y={(i % 2 === 0 ? 35 : 65) + 12}
                    textAnchor="middle"
                    fontSize="3"
                    fill="#ffffff"
                    fontWeight="bold"
                  >
                    {r.name} ({r.highRiskCount} Risk)
                  </text>
                </g>
              );
            })}

            {/* Parcel Level Polygons & Centroids */}
            {parcels.map((p, i) => {
              const isHigh = p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL";
              const dotColor =
                p.riskLevel === "CRITICAL"
                  ? "#dc2626"
                  : p.riskLevel === "HIGH"
                  ? "#ea580c"
                  : p.riskLevel === "MEDIUM"
                  ? "#d97706"
                  : "#16a34a";

              const cx = 25 + i * 25;
              const cy = 40 + (i % 2) * 20;

              return (
                <g key={p.id} onClick={() => handleParcelClick(p)} style={{ cursor: "pointer" }}>
                  {/* Cadastral Parcel Polygon Overlay */}
                  <polygon
                    points={`${cx - 8},${cy - 8} ${cx + 8},${cy - 8} ${cx + 8},${cy + 8} ${cx - 8},${cy + 8}`}
                    fill={`${dotColor}22`}
                    stroke={dotColor}
                    strokeWidth="1.8"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={cx} cy={cy} r="3" fill={dotColor} stroke="#ffffff" strokeWidth="1" />
                  <text x={cx} y={cy - 11} textAnchor="middle" fontSize="3.2" fill="#0f172a" fontWeight="bold">
                    {p.surveyNumber}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Parcel Click Preview Tooltip / Card */}
        {selectedParcel && (
          <div className={styles.parcelPreviewCard}>
            <div className={styles.previewHeader}>
              <div>
                <strong className={styles.previewTitle}>{selectedParcel.id}</strong>
                <span className={styles.previewSubtitle}>
                  Survey {selectedParcel.surveyNumber} • Khata {selectedParcel.khataNumber}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedParcel(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className={`${styles.previewRiskBadge} ${styles[`badge_${selectedParcel.riskLevel.toLowerCase()}`]}`}>
                {selectedParcel.riskLevel} RISK ({selectedParcel.riskScore}/100)
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>
                {selectedParcel.tehsil || selectedParcel.district}
              </span>
            </div>

            <div className={styles.previewGrid}>
              <div className={styles.previewMetaItem}>
                <span>Recorded Area</span>
                <strong>{selectedParcel.recordedArea.toFixed(2)} ha</strong>
              </div>
              <div className={styles.previewMetaItem}>
                <span>GIS Area</span>
                <strong>{selectedParcel.gisArea.toFixed(2)} ha</strong>
              </div>
            </div>

            <div className={styles.conflictBanner}>
              <AlertTriangle size={14} style={{ color: "#ea580c", flexShrink: 0 }} />
              <span>{selectedParcel.conflictStatus}: {selectedParcel.conflictDescription}</span>
            </div>

            <button
              type="button"
              className={styles.openParcelBtn}
              onClick={() => handleOpenParcelGIS(selectedParcel.id)}
            >
              <span>Open Parcel GIS</span>
              <ExternalLink size={13} />
            </button>
          </div>
        )}
      </div>

      <div className={styles.hintBar}>
        <span>💡 Click any administrative region on the map to filter global dashboard scope</span>
        <span>Click parcel centroids for risk preview & detailed GIS workflow</span>
      </div>
    </div>
  );
}
