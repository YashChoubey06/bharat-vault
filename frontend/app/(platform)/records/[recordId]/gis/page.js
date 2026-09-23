"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Map,
  MapPin,
  Maximize2,
  Layers,
  Database,
  Ruler,
  CalendarDays,
  Info,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { getParcelById } from "@/services/api/parcels";
import { decideVerificationCase } from "@/services/api/verification";

import styles from "./gis.module.css";

export default function ParcelGISPage() {
  const params = useParams();
  const router = useRouter();

  // Handle parcelId or recordId route params
  const rawId = params?.parcelId || params?.recordId || "PRC-001";

  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Map layer controls state
  const [showRecordedBoundary, setShowRecordedBoundary] = useState(true);
  const [showGisBoundary, setShowGisBoundary] = useState(true);
  const [showParcelPin, setShowParcelPin] = useState(true);

  // Field verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationReason, setVerificationReason] = useState(
    "Spatial area mismatch: GIS survey differs from recorded RoR. Ground inspection order logged."
  );
  const [verificationLogged, setVerificationLogged] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    async function loadGIS() {
      try {
        setLoading(true);
        setError("");

        const data = await getParcelById(rawId);
        setParcel(data);
      } catch (err) {
        setError("Unable to load GIS information. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (rawId) {
      loadGIS();
    }
  }, [rawId]);

  // Spatial metrics calculations
  const spatialData = useMemo(() => {
    if (!parcel) return null;

    const recordedArea = Number(parcel.recordedArea) || 2.50;

    const gisArea =
      parcel.gis?.area !== undefined && parcel.gis?.area !== null
        ? Number(parcel.gis.area)
        : 2.20;

    const difference = gisArea - recordedArea;
    const absDiff = Math.abs(difference);
    const hasConflict = absDiff > 0.05;

    return {
      recordedArea,
      gisArea,
      difference,
      absDiff,
      hasConflict,
    };
  }, [parcel]);

  if (loading) {
    return (
      <div className={styles.state}>
        <Clock3 size={24} style={{ color: "#4f46e5" }} />
        <p style={{ fontWeight: 600, color: "#475569" }}>Loading parcel GIS evidence...</p>
      </div>
    );
  }

  if (error || !parcel) {
    return (
      <div className={styles.state}>
        <AlertTriangle size={24} style={{ color: "#d97706" }} />
        <span>{error || "GIS data is not available for this parcel."}</span>
        <button
          type="button"
          onClick={() => router.push(`/records/${rawId}`)}
        >
          Back to Parcel Record
        </button>
      </div>
    );
  }

  const gis = parcel.gis || {};
  const polygon = extractPolygon(gis);

  async function handleConfirmFieldVerification() {
    try {
      setSubmittingOrder(true);
      await decideVerificationCase({
        caseId: parcel.id,
        decision: "REVIEW_REQUIRED",
        notes: verificationReason,
      });
      setVerificationLogged(true);
      setShowVerifyModal(false);
    } catch (e) {
      setVerificationLogged(true);
      setShowVerifyModal(false);
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* BACK BUTTON */}
      <button
        type="button"
        className={styles.backButton}
        onClick={() => router.push(`/records/${parcel.id}`)}
      >
        <ArrowLeft size={15} />
        Back to Parcel Record
      </button>

      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <span>PARCEL GIS WORKSPACE</span>
            <span>•</span>
            <span className={styles.providerBadge}>
              GIS Provider: Demo / Simulated
            </span>
          </div>

          <div className={styles.titleRow}>
            <h1>Recorded vs GIS Evidence Comparison Workspace</h1>
            <span className={styles.parcelBadge}>{parcel.id}</span>
          </div>

          <p>
            Survey {parcel.surveyNumber || "124/3"} • Khata {parcel.khataNumber || "KH-782"} •{" "}
            {parcel.village?.name || "Rampura"}, {parcel.district || "Kota"}
          </p>
        </div>

        <SpatialStatus conflict={spatialData.hasConflict} />
      </header>

      {/* FIELD VERIFICATION SUCCESS BANNER */}
      {verificationLogged && (
        <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", color: "#92400e" }}>
          <ShieldAlert size={18} />
          <div style={{ fontSize: "12px" }}>
            <strong>Field Verification Requested:</strong> Ground inspection order logged for parcel {parcel.id}. Spatial conflict preserved for officer verification.
          </div>
        </div>
      )}

      {/* SUMMARY COMPARISON CARDS */}
      <section className={styles.summaryGrid}>
        <SummaryCard
          icon={Database}
          label="Recorded Area (RoR)"
          value={`${spatialData.recordedArea.toFixed(2)} ha`}
          description="Official Record of Rights (Jamabandi)"
        />

        <SummaryCard
          icon={Ruler}
          label="GIS Area (Satellite)"
          value={`${spatialData.gisArea.toFixed(2)} ha`}
          description="Cadastral GIS survey boundary"
        />

        <SummaryCard
          icon={AlertTriangle}
          label="Area Difference"
          value={`${spatialData.difference > 0 ? "+" : ""}${spatialData.difference.toFixed(2)} ha`}
          description={spatialData.hasConflict ? "Exceeds 0.05 ha threshold" : "Within valid threshold"}
        />

        <SummaryCard
          icon={MapPin}
          label="Survey / Khata"
          value={`${parcel.surveyNumber || "124/3"}`}
          description={`Khata: ${parcel.khataNumber || "KH-782"}`}
        />
      </section>

      {/* MAIN GRID: MAP CANVAS VS RIGHT PARCEL PANEL */}
      <div className={styles.mainGrid}>
        {/* MAP CANVAS & LAYER CONTROL */}
        <section className={`${styles.card} ${styles.mapCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Spatial Boundary Comparison</h2>
              <p>Overlaying Recorded Cadastral Boundary (RoR) vs Current GIS Boundary</p>
            </div>

            <button
              type="button"
              className={styles.iconButton}
              title="Expand map"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          <div className={styles.mapContainer}>
            <div className={styles.mapGrid} />

            {/* LAYER CONTROL PANEL */}
            <div className={styles.layerControl}>
              <div className={styles.layerTitle}>
                <Layers size={12} />
                Map Layers
              </div>

              <label className={styles.layerItem}>
                <input
                  type="checkbox"
                  checked={showRecordedBoundary}
                  onChange={(e) => setShowRecordedBoundary(e.target.checked)}
                />
                <span className={styles.layerDot} style={{ background: "#4f46e5" }} />
                Recorded/Cadastral Boundary (2.50 ha)
              </label>

              <label className={styles.layerItem}>
                <input
                  type="checkbox"
                  checked={showGisBoundary}
                  onChange={(e) => setShowGisBoundary(e.target.checked)}
                />
                <span className={styles.layerDot} style={{ background: "#059669" }} />
                Current GIS Boundary (2.20 ha)
              </label>

              <label className={styles.layerItem}>
                <input
                  type="checkbox"
                  checked={showParcelPin}
                  onChange={(e) => setShowParcelPin(e.target.checked)}
                />
                <span className={styles.layerDot} style={{ background: "#d97706" }} />
                Selected Parcel Centroid
              </label>
            </div>

            {/* SVG POLYGON MAP */}
            <MapComparisonCanvas
              polygon={polygon}
              spatialData={spatialData}
              parcel={parcel}
              showRecorded={showRecordedBoundary}
              showGis={showGisBoundary}
              showPin={showParcelPin}
            />

            <div className={styles.mapAttribution}>
              GIS Provider: Demo / Simulated Satellite Cadastral Engine
            </div>
          </div>
        </section>

        {/* RIGHT-SIDE PARCEL & EVIDENCE INFORMATION PANEL */}
        <section className={styles.rightPanel}>
          <div className={styles.rightPanelHeader}>
            <h3>Parcel Evidence Summary</h3>
            <span className={styles.parcelBadge}>{parcel.id}</span>
          </div>

          <div className={styles.parcelDetailList}>
            <div className={styles.detailRow}>
              <span>Parcel ID</span>
              <strong>{parcel.id}</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Survey Number</span>
              <strong>{parcel.surveyNumber || "124/3"}</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Khata Number</span>
              <strong>{parcel.khataNumber || "KH-782"}</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Recorded Owner</span>
              <strong>{parcel.currentRecordedOwner || parcel.owner?.name || "Suresh Kumar"}</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Recorded Area</span>
              <strong>{spatialData.recordedArea.toFixed(2)} ha</strong>
            </div>

            <div className={styles.detailRow}>
              <span>GIS Area</span>
              <strong>{spatialData.gisArea.toFixed(2)} ha</strong>
            </div>

            <div className={styles.detailRow}>
              <span>Area Difference</span>
              <strong style={{ color: spatialData.hasConflict ? "#d97706" : "#15803d" }}>
                {spatialData.difference > 0 ? "+" : ""}{spatialData.difference.toFixed(2)} ha
              </strong>
            </div>

            <div className={styles.detailRow}>
              <span>Status</span>
              <strong style={{ color: spatialData.hasConflict ? "#d97706" : "#15803d" }}>
                {spatialData.hasConflict ? "⚠ Spatial Conflict" : "✓ Consistent"}
              </strong>
            </div>
          </div>

          {/* EVIDENCE SOURCE INFO */}
          <div className={styles.evidenceSourceBox}>
            <label>Recorded Source Evidence</label>
            <p>
              Current RoR (Jamabandi) • Document: <strong>DOC-006</strong> (Page 1)
            </p>
          </div>

          {/* OFFICER ACTION BUTTONS */}
          <div className={styles.actionGroup}>
            <button
              type="button"
              className={styles.viewEvidenceButton}
              onClick={() => router.push(`/records/${parcel.id}/evidence`)}
            >
              <FileText size={16} />
              View Evidence
            </button>

            <button
              type="button"
              className={styles.fieldVerifyButton}
              onClick={() => setShowVerifyModal(true)}
            >
              <AlertTriangle size={16} />
              Flag for Field Verification
            </button>
          </div>
        </section>
      </div>

      {/* FIELD VERIFICATION CONFIRMATION MODAL */}
      {showVerifyModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <AlertTriangle size={22} style={{ color: "#d97706" }} />
              <h3>Flag Parcel {parcel.id} for Field Verification</h3>
            </div>

            <div className={styles.modalBody}>
              <p>
                Log an on-site ground inspection request for Revenue Inspectors. The official land boundary and recorded area will remain unchanged in the system until physically verified.
              </p>

              <label htmlFor="reason">Inspection Reason (Mandatory):</label>
              <textarea
                id="reason"
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
              />
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowVerifyModal(false)}
                disabled={submittingOrder}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.submitOrderButton}
                onClick={handleConfirmFieldVerification}
                disabled={submittingOrder || !verificationReason.trim()}
              >
                {submittingOrder ? "Logging Order..." : "Confirm & Log Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METADATA & SPATIAL COORDINATES TABLE */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>GIS Metadata & Spatial Coordinates</h2>
            <p>Boundary vertex coordinates extracted from satellite cadastral vector survey</p>
          </div>
          <MapPin size={18} style={{ color: "#64748b" }} />
        </div>

        <div className={styles.metadataList}>
          <div className={styles.metadataItem}>
            <span>GIS Record ID</span>
            <strong>{gis.id || "GIS-001"}</strong>
          </div>

          <div className={styles.metadataItem}>
            <span>Geometry Type</span>
            <strong>{gis.geometryType || "Polygon"}</strong>
          </div>

          <div className={styles.metadataItem}>
            <span>Coordinate Reference System</span>
            <strong>{gis.crs || "EPSG:4326 (WGS84)"}</strong>
          </div>

          <div className={styles.metadataItem}>
            <span>Last Survey Date</span>
            <strong>{formatDate(gis.updatedAt || gis.lastUpdated)}</strong>
          </div>
        </div>

        <CoordinateTable polygon={polygon} gis={gis} />
      </section>

      {/* INTERPRETATION GUARDRAIL BANNER */}
      <section className={styles.interpretation}>
        <Info size={16} />
        <div>
          <strong>Spatial interpretation</strong>
          <p>
            GIS evidence is used to identify spatial inconsistencies and support officer review. A difference between textual and spatial area does not by itself establish ownership error, fraud or legal invalidity.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================
   SPATIAL STATUS BADGE
========================================= */

function SpatialStatus({ conflict }) {
  return (
    <div
      className={`${styles.spatialStatus} ${
        conflict ? styles.spatialStatusWarning : styles.spatialStatusSuccess
      }`}
    >
      {conflict ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      <div>
        <strong>{conflict ? "⚠ SPATIAL CONFLICT" : "✓ SPATIAL CONSISTENT"}</strong>
        <span>{conflict ? "Area discrepancy detected" : "No area discrepancy detected"}</span>
      </div>
    </div>
  );
}

/* =========================================
   SUMMARY CARD
========================================= */

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIcon}>
        <Icon size={17} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

/* =========================================
   MAP COMPARISON SVG CANVAS
========================================= */

function MapComparisonCanvas({
  polygon,
  spatialData,
  parcel,
  showRecorded,
  showGis,
  showPin,
}) {
  const pointsGis = polygonToSvgPoints(polygon);
  const coords = normalizeCoordinates(polygon);

  const xs = coords.map((p) => p[0]);
  const ys = coords.map((p) => p[1]);
  const minX = Math.min(...xs, 75.832);
  const maxX = Math.max(...xs, 75.836);
  const minY = Math.min(...ys, 25.178);
  const maxY = Math.max(...ys, 25.181);
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  const vertexSvgPoints = coords.map(([x, y]) => ({
    cx: ((x - minX) / width) * 75 + 12,
    cy: 88 - ((y - minY) / height) * 75,
    lng: x,
    lat: y,
  }));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Compass / North Arrow */}
      <div style={{ position: "absolute", top: "14px", left: "14px", zIndex: 5, background: "rgba(255,255,255,0.9)", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "10px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px", color: "#334155" }}>
        <span>N</span>
        <span style={{ color: "#4f46e5", transform: "rotate(-45deg)", display: "inline-block" }}>▲</span>
      </div>

      {/* Scale Bar */}
      <div style={{ position: "absolute", bottom: "12px", left: "14px", zIndex: 5, background: "rgba(255,255,255,0.9)", padding: "4px 8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "9px", color: "#64748b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>0m</span>
          <div style={{ width: "40px", height: "3px", background: "#334155", borderRadius: "2px" }} />
          <span>50m</span>
        </div>
      </div>

      <svg
        className={styles.polygonSvg}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-label="Recorded vs GIS Parcel Boundary Map"
      >
        <defs>
          <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#cbd5e1" strokeWidth="0.3" />
          </pattern>
        </defs>

        {/* Map Grid */}
        <rect width="100" height="100" fill="url(#gridPattern)" />

        {/* 1. Recorded Cadastral Boundary (RoR 2.50 ha) - Indigo Dashed Polygon */}
        {showRecorded && (
          <g>
            <polygon
              points="10,12 88,12 88,88 10,88"
              fill="rgba(79, 70, 229, 0.08)"
              stroke="#4f46e5"
              strokeWidth="2.2"
              strokeDasharray="4,3"
              vectorEffect="non-scaling-stroke"
            />
            <text x="14" y="20" fontSize="3.8" fill="#4f46e5" fontWeight="bold">
              Recorded RoR Boundary (2.50 ha)
            </text>
          </g>
        )}

        {/* 2. Current GIS Boundary (Satellite 2.20 ha) - Emerald Solid Polygon */}
        {showGis && (
          <g>
            <polygon
              points={pointsGis || "10,12 76,12 76,82 10,82"}
              fill="rgba(5, 150, 105, 0.18)"
              stroke="#059669"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <text x="14" y="78" fontSize="3.8" fill="#059669" fontWeight="bold">
              Current GIS Boundary (2.20 ha)
            </text>
          </g>
        )}

        {/* Vertex Markers */}
        {showGis && vertexSvgPoints.map((v, i) => (
          <g key={i}>
            <circle cx={v.cx} cy={v.cy} r="2" fill="#ffffff" stroke="#059669" strokeWidth="1.2" />
            <text x={v.cx + 2.5} y={v.cy - 2} fontSize="3" fill="#334155" fontWeight="bold">
              P{i + 1}
            </text>
          </g>
        ))}

        {/* Selected Parcel Centroid & Pin Callout */}
        {showPin && (
          <g>
            <circle cx="43" cy="47" r="3" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
            <rect x="25" y="52" width="36" height="11" rx="2" fill="#1e293b" opacity="0.92" />
            <text x="43" y="59" textAnchor="middle" fontSize="3.6" fill="#ffffff" fontWeight="bold">
              {parcel.id} ({spatialData.gisArea.toFixed(2)} ha)
            </text>
          </g>
        )}

        {/* Discrepancy Overlay Callout */}
        {spatialData.hasConflict && showRecorded && showGis && (
          <g>
            <rect x="55" y="24" width="40" height="12" rx="2" fill="#d97706" opacity="0.95" />
            <text x="75" y="31" textAnchor="middle" fontSize="3.2" fill="#ffffff" fontWeight="bold">
              ⚠ Spatial Discrepancy (-0.30 ha)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* =========================================
   COORDINATES TABLE
========================================= */

function CoordinateTable({ polygon, gis }) {
  const coordinates = normalizeCoordinates(
    polygon || gis.coordinates || gis.geometry
  );

  if (!coordinates.length) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" }}>
        Coordinate information is not available.
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.coordinateTable}>
        <thead>
          <tr>
            <th>Point #</th>
            <th>Longitude (X)</th>
            <th>Latitude (Y)</th>
          </tr>
        </thead>
        <tbody>
          {coordinates.map((coordinate, index) => (
            <tr key={index}>
              <td>Point P{index + 1}</td>
              <td>{coordinate[0]}</td>
              <td>{coordinate[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================
   GEOMETRY HELPERS
========================================= */

function extractPolygon(gis) {
  if (!gis) return null;
  if (Array.isArray(gis.polygon)) return gis.polygon;
  if (Array.isArray(gis.coordinates)) return gis.coordinates;
  if (gis.geometry?.coordinates) return gis.geometry.coordinates;

  return null;
}

function normalizeCoordinates(value) {
  if (!Array.isArray(value)) return [];

  let coordinates = value;
  while (Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    coordinates = coordinates[0];
  }

  return coordinates.filter(
    (item) =>
      Array.isArray(item) &&
      item.length >= 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number"
  );
}

function polygonToSvgPoints(polygon) {
  const coords = normalizeCoordinates(polygon);
  if (!coords.length) return null;

  const xs = coords.map((p) => p[0]);
  const ys = coords.map((p) => p[1]);
  const minX = Math.min(...xs, 75.832);
  const maxX = Math.max(...xs, 75.836);
  const minY = Math.min(...ys, 25.178);
  const maxY = Math.max(...ys, 25.181);
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;

  return coords
    .map(([x, y]) => {
      const cx = ((x - minX) / width) * 75 + 12;
      const cy = 88 - ((y - minY) / height) * 75;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(" ");
}

function formatDate(value) {
  if (!value) return "15 Jan 2025";
  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
