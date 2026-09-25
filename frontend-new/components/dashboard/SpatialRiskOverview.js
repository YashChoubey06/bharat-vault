"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin,
  Globe,
  AlertTriangle,
  ExternalLink,
  Layers,
  X,
} from "lucide-react";
import { getSpatialOverview } from "@/services/api/gis";
import styles from "./SpatialRiskOverview.module.css";

// Use environment variable if available, else a public demo token (or fallback to empty string)
mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function SpatialRiskOverview({ scope = {}, onChangeScope }) {
  const router = useRouter();
  const [spatialData, setSpatialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

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
  const parcels = useMemo(() => spatialData?.parcels || [], [spatialData]);
  const hasData =
    (regions.length > 0 || parcels.length > 0) &&
    spatialData?.hasCoordinates !== false;

  // Initialize Mapbox map once data is loaded
  useEffect(() => {
    if (!hasData || loading || !mapContainer.current) return;
    
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-v9",
        center: [78.9629, 20.5937], // Center over India initially
        zoom: 4,
        pitch: 45,
        bearing: -17.6,
      });

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hasData, loading]);

  // Update Markers when spatialData changes
  useEffect(() => {
    if (!mapRef.current || !hasData) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let boundsCount = 0;


    parcels.forEach((p) => {
      const ring = p.gis?.geometry?.coordinates?.[0];
      if (!ring?.length) return;
      // Create a marker DOM element Custom HTML
      const el = document.createElement("div");
      
      const isCritical = p.riskLevel === "CRITICAL";
      const isHigh = p.riskLevel === "HIGH";
      const dotColor = isCritical
        ? "#dc2626"
        : isHigh
        ? "#ea580c"
        : p.riskLevel === "MEDIUM"
        ? "#d97706"
        : "#16a34a";

      el.style.width = "40px";
      el.style.height = "40px";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.cursor = "pointer";

      // The parcel square & circle style matching standard gis
      el.innerHTML = `
        <div style="font-size: 11px; font-weight: bold; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8); margin-bottom: 2px;">

        </div>
        <div style="
          width: 24px; 
          height: 24px; 
          border: 2px solid ${dotColor}; 
          background: ${dotColor}33; 
          display: flex; 
          align-items: center; 
          justify-content: center;
        ">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${dotColor}; border: 1.5px solid white;"></div>
        </div>
      `;

      el.firstElementChild.textContent = p.surveyNumber || p.id;
      el.addEventListener("click", () => {
        setSelectedParcel(p);
      });

      // Position the marker within the stored parcel coordinates.
      const lng = ring.reduce((sum, point) => sum + point[0], 0) / ring.length;
      const lat = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
      
      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
      boundsCount++;
    });

    if (boundsCount > 0) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 1000 });
    }
  }, [parcels, hasData, loading]);

  function handleOpenParcelGIS(parcelId) {
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
        </div>

        <div className={styles.sourceBadge}>
          <Layers size={13} style={{ color: "#4f46e5" }} />
          <span>GIS Source: Mapbox Satellite</span>
        </div>
      </div>

      {/* Map Canvas / Visualization Container */}
      <div className={styles.mapWrapper}>
        {/* Legend */}
        <div className={styles.legendBar} style={{ zIndex: 2 }}>
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
          <div className={styles.emptyState}>
            <MapPin size={32} style={{ color: "#94a3b8" }} />
            <span className={styles.emptyTitle}>Spatial data unavailable for this scope</span>
          </div>
        ) : (
          <div ref={mapContainer} style={{ width: "100%", height: "100%", minHeight: "350px", position: "relative" }} />
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
    </div>
  );
}
