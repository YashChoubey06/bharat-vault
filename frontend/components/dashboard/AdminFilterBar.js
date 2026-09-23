"use client";

import { useMemo } from "react";
import { ChevronDown, MapPin, RotateCcw, Building2, Map, Globe } from "lucide-react";
import {
  LOCATION_HIERARCHY,
  getAvailableStates,
  getAvailableDistricts,
  getAvailableTehsils,
} from "@/services/mock/data/locations";

import styles from "./AdminFilterBar.module.css";

export default function AdminFilterBar({ scope, onChangeScope }) {
  const selectedState = scope.state || "";
  const selectedDistrict = scope.district || "";
  const selectedTehsil = scope.tehsil || "";

  const availableStates = useMemo(() => getAvailableStates(), []);
  const availableDistricts = useMemo(
    () => getAvailableDistricts(selectedState),
    [selectedState]
  );
  const availableTehsils = useMemo(
    () => getAvailableTehsils(selectedState, selectedDistrict),
    [selectedState, selectedDistrict]
  );

  function handleStateChange(e) {
    const newState = e.target.value;
    onChangeScope({
      level: newState ? "STATE" : "ALL_INDIA",
      state: newState,
      district: "",
      tehsil: "",
    });
  }

  function handleDistrictChange(e) {
    const newDistrict = e.target.value;
    onChangeScope({
      level: newDistrict ? "DISTRICT" : selectedState ? "STATE" : "ALL_INDIA",
      state: selectedState,
      district: newDistrict,
      tehsil: "",
    });
  }

  function handleTehsilChange(e) {
    const newTehsil = e.target.value;
    onChangeScope({
      level: newTehsil
        ? "TEHSIL"
        : selectedDistrict
        ? "DISTRICT"
        : selectedState
        ? "STATE"
        : "ALL_INDIA",
      state: selectedState,
      district: selectedDistrict,
      tehsil: newTehsil,
    });
  }

  function handleReset() {
    onChangeScope({
      level: "ALL_INDIA",
      state: "",
      district: "",
      tehsil: "",
    });
  }

  const activeScopeLabel = useMemo(() => {
    if (selectedTehsil) return `Tehsil: ${selectedTehsil}, ${selectedDistrict}`;
    if (selectedDistrict) return `District: ${selectedDistrict}, ${selectedState}`;
    if (selectedState) return `State: ${selectedState}`;
    return "All India (National)";
  }, [selectedState, selectedDistrict, selectedTehsil]);

  const hasFilter = Boolean(selectedState || selectedDistrict || selectedTehsil);

  return (
    <div className={styles.barContainer}>
      <div className={styles.controlsGroup}>
        <div className={styles.labelGroup}>
          <MapPin size={15} style={{ color: "#4f46e5" }} />
          <span>Scope</span>
        </div>

        {/* State Dropdown */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.selectInput}
            value={selectedState}
            onChange={handleStateChange}
            aria-label="Select State"
          >
            <option value="">All India</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.chevronIcon} />
        </div>

        {/* District Dropdown */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.selectInput}
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!selectedState}
            aria-label="Select District"
          >
            <option value="">All Districts</option>
            {availableDistricts.map((dst) => (
              <option key={dst} value={dst}>
                {dst}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.chevronIcon} />
        </div>

        {/* Tehsil Dropdown */}
        <div className={styles.selectWrapper}>
          <select
            className={styles.selectInput}
            value={selectedTehsil}
            onChange={handleTehsilChange}
            disabled={!selectedDistrict}
            aria-label="Select Tehsil"
          >
            <option value="">All Tehsils</option>
            {availableTehsils.map((ths) => (
              <option key={ths} value={ths}>
                {ths}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className={styles.chevronIcon} />
        </div>

        {hasFilter && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={handleReset}
            title="Reset Scope to All India"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      <div className={styles.scopeBadgeGroup}>
        <div className={styles.scopeBadge}>
          {selectedTehsil ? (
            <Building2 size={13} />
          ) : selectedDistrict ? (
            <Map size={13} />
          ) : selectedState ? (
            <Building2 size={13} />
          ) : (
            <Globe size={13} />
          )}
          <span>{activeScopeLabel}</span>
        </div>
      </div>
    </div>
  );
}
