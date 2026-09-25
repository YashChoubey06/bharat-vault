"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
import {
  ArrowLeft,
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
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";

import { getParcelById } from "@/services/api/parcels";
import { getVerificationCases, decideVerificationCase } from "@/services/api/verification";
import RecordTabs from "@/components/records/RecordTabs";

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
  const [isLayersOpen, setIsLayersOpen] = useState(false);

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

    const recordedArea = Number(parcel.recordedArea) || 0;

    const gisArea =
      parcel.gis?.area !== undefined && parcel.gis?.area !== null
        ? Number(parcel.gis.area)
        : 0;

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

  if (error || !parcel || !parcel.gis) {
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
      const cases = await getVerificationCases();
      const activeCase = cases.find(c => c.parcelId === parcel.id);
      if (!activeCase) throw new Error("No verification case exists for this parcel.");
      await decideVerificationCase({
        caseId: activeCase.id,
        decision: "REVIEW_REQUIRED",
        notes: verificationReason,
      });
      setVerificationLogged(true);
      setShowVerifyModal(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmittingOrder(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* NAVIGATION */}
      <div style={{ marginBottom: '16px' }}>
        <RecordTabs recordId={parcel.id} />
      </div>

      {/* HEADER */}
      <header className={styles.header}>
        <div>
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
        <StatCard
          icon={Database}
          label="Recorded Area (RoR)"
          value={`${spatialData.recordedArea.toFixed(2)} ha`}
          subtext="Official Record of Rights (Jamabandi)"
          variant="neutral"
        />

        <StatCard
          icon={Ruler}
          label="GIS Area (Satellite)"
          value={`${spatialData.gisArea.toFixed(2)} ha`}
          subtext="Cadastral GIS survey boundary"
          variant="neutral"
        />

        <StatCard
          icon={AlertTriangle}
          label="Area Difference"
          value={`${spatialData.difference > 0 ? "+" : ""}${spatialData.difference.toFixed(2)} ha`}
          subtext={spatialData.hasConflict ? "Exceeds 0.05 ha threshold" : "Within valid threshold"}
          variant={spatialData.hasConflict ? "warning" : "success"}
        />

        <StatCard
          icon={MapPin}
          label="Survey / Khata"
          value={`${parcel.surveyNumber || "124/3"}`}
          subtext={`Khata: ${parcel.khataNumber || "KH-782"}`}
          variant="neutral"
        />
      </section>

      {/* MAIN GRID: MAP CANVAS VS RIGHT PARCEL PANEL */}
      <div className={styles.mainGrid}>
        {/* MAP CANVAS & LAYER CONTROL */}
        <section className={`${styles.card} ${styles.mapCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h2>Spatial Boundary Comparison</h2>
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
            <div className={styles.layerControlWrapper}>
              <button
                type="button"
                className={styles.layerToggleButton}
                onClick={() => setIsLayersOpen(!isLayersOpen)}
              >
                <Layers size={14} />
                Map Layers
                <ChevronDown size={14} />
              </button>

              {isLayersOpen && (
                <div className={styles.layerControlPopup}>
                  <label className={styles.layerItem}>
                    <input
                      type="checkbox"
                      checked={showRecordedBoundary}
                      onChange={(e) => setShowRecordedBoundary(e.target.checked)}
                    />
                    <span className={styles.layerDot} style={{ background: "#4f46e5" }} />
                    Recorded area: {spatialData.recordedArea.toFixed(2)} ha
                  </label>

                  <label className={styles.layerItem}>
                    <input
                      type="checkbox"
                      checked={showGisBoundary}
                      onChange={(e) => setShowGisBoundary(e.target.checked)}
                    />
                    <span className={styles.layerDot} style={{ background: "#059669" }} />
                    GIS area: {spatialData.gisArea.toFixed(2)} ha
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
              )}
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
              GIS Source: {gis.source || "Local parcel evidence"}
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
                {spatialData.hasConflict ? "Spatial Conflict" : "✓ Consistent"}
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
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const coords = useMemo(() => normalizeCoordinates(polygon), [polygon]);
  
  // ensure closed polygon
  const coordsGis = useMemo(() => coords.length && coords[0] !== coords[coords.length - 1] ? [...coords, coords[0]] : coords, [coords]);
  
  const coordsRec = useMemo(() => normalizeCoordinates(parcel.recordedGeometry?.coordinates), [parcel.recordedGeometry]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-v9",
      center: coordsGis.length ? coordsGis[0] : [75.834, 25.179],
      zoom: 17,
      pitch: 20,
    });
    
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    mapRef.current.on('load', () => {
      // GIS Boundary
      if (coordsGis.length > 0) {
        mapRef.current.addSource('gis', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coordsGis] } }
        });
        mapRef.current.addLayer({
          id: 'gis-layer-fill',
          type: 'fill',
          source: 'gis',
          paint: { 'fill-color': '#059669', 'fill-opacity': 0.18 }
        });
        mapRef.current.addLayer({
          id: 'gis-layer-line',
          type: 'line',
          source: 'gis',
          paint: { 'line-color': '#059669', 'line-width': 2 }
        });
      }

      // Recorded Boundary
      if (coordsRec.length > 0) {
        mapRef.current.addSource('recorded', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coordsRec] } }
        });
        mapRef.current.addLayer({
          id: 'recorded-layer-fill',
          type: 'fill',
          source: 'recorded',
          paint: { 'fill-color': '#4f46e5', 'fill-opacity': 0.08 }
        });
        mapRef.current.addLayer({
          id: 'recorded-layer-line',
          type: 'line',
          source: 'recorded',
          paint: { 'line-color': '#4f46e5', 'line-width': 2, 'line-dasharray': [3, 2] }
        });
      }

      if (coordsGis.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        coordsGis.forEach(c => bounds.extend(c));
        coordsRec.forEach(c => bounds.extend(c));
        mapRef.current.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coordsGis, coordsRec]);

  // Update visibility on state changes
  useEffect(() => {
    if (!mapRef.current) return;
    
    const updateVisibility = () => {
      if (!mapRef.current.isStyleLoaded()) return;
      if (mapRef.current.getLayer('gis-layer-fill')) {
        const gVisibility = showGis ? 'visible' : 'none';
        mapRef.current.setLayoutProperty('gis-layer-fill', 'visibility', gVisibility);
        mapRef.current.setLayoutProperty('gis-layer-line', 'visibility', gVisibility);
      }
      if (mapRef.current.getLayer('recorded-layer-fill')) {
        const rVisibility = showRecorded ? 'visible' : 'none';
        mapRef.current.setLayoutProperty('recorded-layer-fill', 'visibility', rVisibility);
        mapRef.current.setLayoutProperty('recorded-layer-line', 'visibility', rVisibility);
      }
    };

    if (mapRef.current.isStyleLoaded()) {
      updateVisibility();
    } else {
      mapRef.current.once('styledata', updateVisibility);
    }
  }, [showGis, showRecorded]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#e2e8f0" }}>
      <div ref={mapContainer} style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
      {spatialData.hasConflict && showRecorded && showGis && (
        <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", background: "#d97706", color: "white", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "14px", zIndex: 10, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
          ⚠ Spatial Discrepancy ({(spatialData.gisArea - spatialData.recordedArea).toFixed(2)} ha)
        </div>
      )}
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
  if (!value) return "Unavailable";
  const d = new Date(value);

  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
