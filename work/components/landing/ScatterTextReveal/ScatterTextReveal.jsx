'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './ScatterTextReveal.module.css';

// 1. Controlled Access (Lock Icon - matching user image 100%)
const IconControlledAccess = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  </div>
);

// 2. Evidence Provenance (Document Link Icon)
const IconEvidenceProvenance = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-4" />
      <path d="M9 15l3 3 3-3" />
    </svg>
  </div>
);

// 3. Tamper-Evident Audit (Linked Chain Icon)
const IconTamperAudit = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  </div>
);

// 4. Spatial GIS Boundary Icon
const IconSpatialGIS = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" x2="9" y1="3" y2="18" />
      <line x1="15" x2="15" y1="6" y2="21" />
    </svg>
  </div>
);

// 5. RoR Khatauni Textual Record Icon
const IconRoRRecord = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  </div>
);

// 6. Mutation & Transfer Deed Icon
const IconMutationDeed = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  </div>
);

// 7. Court Legal Dispute Icon
const IconCourtDispute = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h18" />
    </svg>
  </div>
);

// 8. Officer Sign-off Badge Icon
const IconOfficerSign = () => (
  <div className={styles.bvIconBadge}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  </div>
);

// Peripheral Scatter Icon Positions around the stage
const BHARAT_SCATTER_ICONS = [
  { Component: IconControlledAccess, targetX: -42, targetY: -32, rotate: -8 },
  { Component: IconEvidenceProvenance, targetX: 42, targetY: -30, rotate: 10 },
  { Component: IconTamperAudit, targetX: -40, targetY: 26, rotate: -12 },
  { Component: IconSpatialGIS, targetX: 38, targetY: 24, rotate: 14 },
  { Component: IconRoRRecord, targetX: -44, targetY: -4, rotate: -6 },
  { Component: IconMutationDeed, targetX: 44, targetY: -4, rotate: 8 },
  { Component: IconCourtDispute, targetX: -24, targetY: 34, rotate: -10 },
  { Component: IconOfficerSign, targetX: 24, targetY: 34, rotate: 6 },
];

export default function ScatterTextReveal() {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScroll = -rect.top;
      const progress = Math.max(0, Math.min(1, currentScroll / totalScrollable));
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getRangeProgress = (start, end) => {
    if (scrollProgress <= start) return 0;
    if (scrollProgress >= end) return 1;
    return (scrollProgress - start) / (end - start);
  };

  // 1. Headline Fade In & Slide
  const headerProgress = getRangeProgress(0.0, 0.25);

  // 2. Icon Scatter Explosion
  const scatterProgress = getRangeProgress(0.1, 0.55);

  // 3. Sequential Cards Reveal
  const card1Progress = getRangeProgress(0.30, 0.55); // Controlled Access
  const card2Progress = getRangeProgress(0.50, 0.75); // Evidence Provenance
  const card3Progress = getRangeProgress(0.70, 0.95); // Tamper-Evident Audit

  return (
    <div className={styles.pinnedTrackContainer} ref={containerRef} id="scatter-section">

      {/* STICKY STAGE CONTAINER (260vh track, 100vh viewport sticky) */}
      <div className={styles.stickyViewportStage}>

        {/* BACKGROUND SCATTER EVIDENCE ICONS */}
        <div className={styles.iconsStageOverlay} aria-hidden="true">
          {BHARAT_SCATTER_ICONS.map((iconData, idx) => {
            const IconComp = iconData.Component;

            const currentX = iconData.targetX * scatterProgress;
            const currentY = iconData.targetY * scatterProgress;
            const scale = 0.3 + (1 - 0.3) * scatterProgress;
            const opacity = Math.min(1, scatterProgress * 2.2);
            const rotation = iconData.rotate * scatterProgress;

            return (
              <div
                key={idx}
                className={styles.floatingScatterItem}
                style={{
                  transform: `translate3d(${currentX}vw, ${currentY}vh, 0) scale(${scale}) rotate(${rotation}deg)`,
                  opacity: opacity,
                }}
              >
                <IconComp />
              </div>
            );
          })}
        </div>

        {/* HEADLINE TOP BLOCK ("Every decision should have an evidence trail.") */}
        <div
          className={styles.headlineHeaderBlock}
          style={{
            opacity: headerProgress,
            transform: `translate3d(0, ${(1 - headerProgress) * -30}px, 0)`,
          }}
        >
          <h2 className={styles.mainTitle}>
            Every decision should have <span className={styles.blueTitleHighlight}>an evidence trail.</span>
          </h2>
          <p className={styles.mainSubtitle}>
            Bharat Vault is designed around traceability, controlled access and accountable human verification.
          </p>
        </div>

        {/* 3 CORE BHARAT VAULT EVIDENCE CARDS (Sequential Reveal) */}
        <div className={styles.cardsStackList}>

          {/* Card 1: Controlled Access */}
          <div
            className={styles.evidenceCardItem}
            style={{
              opacity: card1Progress,
              transform: `translate3d(0, ${(1 - card1Progress) * 45}px, 0)`,
            }}
          >
            <div className={styles.cardIconWrapper}>
              <IconControlledAccess />
            </div>
            <div className={styles.cardTextGroup}>
              <h3 className={styles.cardTitle}>Controlled Access</h3>
              <p className={styles.cardDesc}>
                Role-aware access keeps sensitive records available only to authorized users.
              </p>
            </div>
          </div>

          {/* Card 2: Evidence Provenance */}
          <div
            className={styles.evidenceCardItem}
            style={{
              opacity: card2Progress,
              transform: `translate3d(0, ${(1 - card2Progress) * 45}px, 0)`,
            }}
          >
            <div className={styles.cardIconWrapper}>
              <IconEvidenceProvenance />
            </div>
            <div className={styles.cardTextGroup}>
              <h3 className={styles.cardTitle}>Evidence Provenance</h3>
              <p className={styles.cardDesc}>
                Verification findings remain connected to their supporting source evidence.
              </p>
            </div>
          </div>

          {/* Card 3: Tamper-Evident Audit */}
          <div
            className={styles.evidenceCardItem}
            style={{
              opacity: card3Progress,
              transform: `translate3d(0, ${(1 - card3Progress) * 45}px, 0)`,
            }}
          >
            <div className={styles.cardIconWrapper}>
              <IconTamperAudit />
            </div>
            <div className={styles.cardTextGroup}>
              <h3 className={styles.cardTitle}>Tamper-Evident Audit</h3>
              <p className={styles.cardDesc}>
                Hash-linked audit records make unauthorized changes detectable.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
