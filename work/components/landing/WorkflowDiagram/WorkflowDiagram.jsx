'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import styles from './WorkflowDiagram.module.css';

// Line-Art SVG Icons
const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const IconLandRecord = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconExchange = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1s4 4 4 4-4 4-4-4" />
    <path d="M3 5h18" />
    <path d="M7 23s-4-4-4-4 4-4 4 4" />
    <path d="M21 19H3" />
  </svg>
);

const IconSpatialLegal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" x2="9" y1="3" y2="18" />
    <line x1="15" x2="15" y1="6" y2="21" />
  </svg>
);

const IconOCR = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" x2="17" y1="12" y2="12" />
  </svg>
);

const IconFieldExtract = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 9v12" />
  </svg>
);

const IconLink = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconReconcileScale = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

const IconConflictAlert = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" x2="12" y1="9" y2="13" />
    <line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);

const IconRiskChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="18" y1="20" y2="10" />
    <line x1="12" x2="12" y1="20" y2="4" />
    <line x1="6" x2="6" y1="20" y2="14" />
  </svg>
);

const IconOfficer = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
);

const IconRiskQueue = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <line x1="12" x2="12" y1="12" y2="15" />
    <line x1="12" x2="12.01" y1="18" y2="18" />
  </svg>
);

const IconDecision = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconSummary = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
  </svg>
);

const IconAuditTrail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M7 7h.01" />
    <path d="M7 12h.01" />
    <path d="M7 17h.01" />
    <path d="M11 7h6" />
    <path d="M11 12h6" />
    <path d="M11 17h6" />
  </svg>
);

export default function WorkflowDiagram() {
  const containerRef = useRef(null);

  // Source Card Refs (Left Column)
  const cardUploadRef = useRef(null);
  const cardLandRef = useRef(null);
  const cardExchangeRef = useRef(null);
  const cardSpatialRef = useRef(null);

  // Engine Card Ref (Center Column)
  const engineCardRef = useRef(null);

  // Right Cascade Card Refs (Right Column)
  const cardRiskQueueRef = useRef(null);
  const cardOfficerReviewRef = useRef(null);
  const cardOfficerDecisionRef = useRef(null);
  const cardDeliverablesRef = useRef(null);

  // Dynamic Calculated Connector Coordinates
  const [coords, setCoords] = useState(null);

  // IntersectionObserver & Viewport Triggering
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Dynamic Anchor Calculation Engine
  const recalculateConnectors = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    const getRelRect = (ref) => {
      if (!ref.current) return null;
      const r = ref.current.getBoundingClientRect();
      return {
        x: r.left - containerRect.left,
        y: r.top - containerRect.top,
        right: r.right - containerRect.left,
        bottom: r.bottom - containerRect.top,
        width: r.width,
        height: r.height,
        centerX: r.left - containerRect.left + r.width / 2,
        centerY: r.top - containerRect.top + r.height / 2,
      };
    };

    const cUpload = getRelRect(cardUploadRef);
    const cLand = getRelRect(cardLandRef);
    const cExchange = getRelRect(cardExchangeRef);
    const cSpatial = getRelRect(cardSpatialRef);
    const cEngine = getRelRect(engineCardRef);
    const cRiskQueue = getRelRect(cardRiskQueueRef);
    const cOfficerReview = getRelRect(cardOfficerReviewRef);
    const cOfficerDecision = getRelRect(cardOfficerDecisionRef);
    const cDeliverables = getRelRect(cardDeliverablesRef);

    if (!cEngine || !cUpload || !cLand || !cExchange || !cSpatial || !cRiskQueue) return;

    const maxLeftRight = Math.max(cUpload.right, cLand.right, cExchange.right, cSpatial.right);
    const leftJunctionX = maxLeftRight + (cEngine.x - maxLeftRight) * 0.5;
    const leftJunctionY = cEngine.centerY;
    const rightConnectorStartY = cRiskQueue.centerY;

    setCoords({
      width: containerRect.width,
      height: containerRect.height,

      // Left Sources
      sources: [
        { id: 'upload', startX: cUpload.right, startY: cUpload.centerY, isDashed: true },
        { id: 'land', startX: cLand.right, startY: cLand.centerY, isDashed: false },
        { id: 'exchange', startX: cExchange.right, startY: cExchange.centerY, isDashed: false },
        { id: 'spatial', startX: cSpatial.right, startY: cSpatial.centerY, isDashed: false },
      ],
      leftJunctionX,
      leftJunctionY,
      engineInputX: cEngine.x,

      // Center -> Right (Engine -> Risk Queue)
      engineOutputX: cEngine.right,
      engineOutputY: rightConnectorStartY,
      riskQueueInputX: cRiskQueue.x,
      riskQueueInputY: cRiskQueue.centerY,

      // Vertical Cascade Steps (Right Column)
      step1: {
        startX: cRiskQueue.centerX,
        startY: cRiskQueue.bottom,
        endX: cOfficerReview.centerX,
        endY: cOfficerReview.y,
      },
      step2: {
        startX: cOfficerReview.centerX,
        startY: cOfficerReview.bottom,
        endX: cOfficerDecision.centerX,
        endY: cOfficerDecision.y,
      },
      step3: {
        startX: cOfficerDecision.centerX,
        startY: cOfficerDecision.bottom,
        endX: cDeliverables.centerX,
        endY: cDeliverables.y,
      },
    });
  }, []);

  // Set up ResizeObserver & Event Listeners
  useEffect(() => {
    recalculateConnectors();

    const observers = [];
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      const ro = new ResizeObserver(() => {
        requestAnimationFrame(recalculateConnectors);
      });
      ro.observe(containerRef.current);
      observers.push(ro);

      const elementsToObserve = [
        cardUploadRef.current,
        cardLandRef.current,
        cardExchangeRef.current,
        cardSpatialRef.current,
        engineCardRef.current,
        cardRiskQueueRef.current,
        cardOfficerReviewRef.current,
        cardOfficerDecisionRef.current,
        cardDeliverablesRef.current,
      ];

      elementsToObserve.forEach((el) => {
        if (el) ro.observe(el);
      });
    }

    window.addEventListener('resize', recalculateConnectors);
    window.addEventListener('scroll', recalculateConnectors);

    return () => {
      observers.forEach((ro) => ro.disconnect());
      window.removeEventListener('resize', recalculateConnectors);
      window.removeEventListener('scroll', recalculateConnectors);
    };
  }, [recalculateConnectors]);

  // Viewport IntersectionObserver logic
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setShouldAnimate(true);
          setHasAnimated(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold: 0.35 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (shouldAnimate) {
      const timer = setTimeout(() => {
        setShouldAnimate(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate]);

  const animStateClass = hasAnimated && !shouldAnimate
    ? styles.isCompletedState
    : shouldAnimate
      ? styles.isAnimatingState
      : styles.isInitialState;

  return (
    <div
      className={`${styles.outerCanvasContainer} ${animStateClass}`}
      id="workflow"
      ref={containerRef}
    >
      {/* ============================================================
         DYNAMIC RESPONSIVE SVG CONNECTOR OVERLAY
         ============================================================ */}
      {coords && (
        <svg
          className={styles.dynamicConnectorSvgOverlay}
          viewBox={`0 0 ${coords.width} ${coords.height}`}
          aria-hidden="true"
        >
          <defs>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ea580c" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
            </marker>
          </defs>

          {/* STEP 3: Left Blue Connectors & Junction Node */}
          <g className={styles.animSeq2}>
            {coords.sources.map((src) => (
              <path
                key={src.id}
                d={`M ${src.startX} ${src.startY} L ${coords.leftJunctionX} ${src.startY} L ${coords.leftJunctionX} ${coords.leftJunctionY}`}
                stroke="#2563eb"
                strokeWidth="1.8"
                strokeDasharray={src.isDashed ? '3 3' : 'none'}
                fill="none"
              />
            ))}

            <circle
              cx={coords.leftJunctionX}
              cy={coords.leftJunctionY}
              r="5"
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth="2"
            />

            <line
              x1={coords.leftJunctionX}
              y1={coords.leftJunctionY}
              x2={coords.engineInputX - 4}
              y2={coords.leftJunctionY}
              stroke="#2563eb"
              strokeWidth="1.8"
              markerEnd="url(#arrow-blue)"
            />
          </g>

          {/* STEP 9: Center -> Right (Engine -> Risk Queue) */}
          <g className={styles.animSeq5}>
            <path
              d={`M ${coords.engineOutputX} ${coords.engineOutputY} L ${coords.riskQueueInputX - 4} ${coords.riskQueueInputY}`}
              stroke="#ea580c"
              strokeWidth="1.8"
              strokeDasharray="4 3"
              fill="none"
              markerEnd="url(#arrow-amber)"
            />
          </g>

          {/* STEP 10-13 VERTICAL CASCADE CONNECTORS */}
          {coords.step1 && coords.step1.endY > coords.step1.startY && (
            <g className={styles.animSeq6a}>
              <line
                x1={coords.step1.startX}
                y1={coords.step1.startY + 2}
                x2={coords.step1.endX}
                y2={coords.step1.endY - 4}
                stroke="#ea580c"
                strokeWidth="1.8"
                markerEnd="url(#arrow-amber)"
              />
            </g>
          )}

          {coords.step2 && coords.step2.endY > coords.step2.startY && (
            <g className={styles.animSeq6b}>
              <line
                x1={coords.step2.startX}
                y1={coords.step2.startY + 2}
                x2={coords.step2.endX}
                y2={coords.step2.endY - 4}
                stroke="#16a34a"
                strokeWidth="1.8"
                markerEnd="url(#arrow-green)"
              />
            </g>
          )}

          {coords.step3 && coords.step3.endY > coords.step3.startY && (
            <g className={styles.animSeq6c}>
              <line
                x1={coords.step3.startX}
                y1={coords.step3.startY + 2}
                x2={coords.step3.endX}
                y2={coords.step3.endY - 4}
                stroke="#2563eb"
                strokeWidth="1.8"
                markerEnd="url(#arrow-blue)"
              />
            </g>
          )}
        </svg>
      )}

      {/* 1. TOP HEADER SECTION */}
      <div className={`${styles.workflowHeader} ${styles.animSeq0}`}>
        <span className={styles.wfBadge}>PRODUCT SYSTEM ARCHITECTURE</span>

        {/* Story Pipeline Breadcrumbs */}
        <div className={styles.flowBreadcrumb}>
          <span className={styles.flowPill}>Fragmented Records</span>
          <span className={styles.flowArrow}>&rarr;</span>
          <span className={styles.flowPillActive}>Unified Evidence</span>
          <span className={styles.flowArrow}>&rarr;</span>
          <span className={styles.flowPill}>Explainable Decisions</span>
        </div>

        {/* Philosophy Tagline */}
        <div className={styles.philosophyTagline}>
          <span>Source-aware</span>
          <span className={styles.philosophyDot}>•</span>
          <span>Evidence-linked</span>
          <span className={styles.philosophyDot}>•</span>
          <span>Human-verified</span>
        </div>
      </div>

      {/* 2. MAIN SYSTEM CONTAINER WITH TINTED SECTION PANELS */}
      <div className={styles.mainSystemFrame}>
        <div className={styles.diagramGrid}>

          {/* ============================================================
             COLUMN 01: CAPTURE (Left Column)
             ============================================================ */}
          <div className={`${styles.diagramColumn} ${styles.sectionPanel}`}>
            <div className={`${styles.columnHeader} ${styles.animSeq1}`}>
              <span className={styles.columnNumber}>01</span>
              <div>
                <h3 className={styles.columnTitle}>CAPTURE</h3>

              </div>
            </div>

            <div className={`${styles.captureGrid} ${styles.animSeq1b}`}>
              {/* Card 1 — Upload Records */}
              <div ref={cardUploadRef} className={`${styles.wfCard} ${styles.wfCardActiveUpload}`}>
                <div className={styles.wfCardIconHeader}>
                  <div className={styles.iconWithLabel}>
                    <IconUpload />
                    <div>
                      <span className={styles.categoryTag}>DOCUMENT FALLBACK</span>
                      <h4 className={styles.cardTitleInline}>Upload Records</h4>
                    </div>
                  </div>

                </div>
                <p className={styles.cardDesc}>Scans / PDFs / Images</p>

                {/* Ingestion Progress Mock */}
                <div className={styles.uploadProgressContainer}>
                  <div className={styles.progressItem}>
                    <div className={styles.progressLabelRow}>
                      <span>Khatauni_7-12.pdf</span>
                      <span className={styles.pctDone}>100%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFill} style={{ width: '100%' }} />
                    </div>
                  </div>

                  <div className={styles.progressItem}>
                    <div className={styles.progressLabelRow}>
                      <span>Deed_Registry.jpg</span>
                      <span className={styles.pctActive}>85%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                      <div className={styles.progressBarFillOrange} style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 — Land Records */}
              <div ref={cardLandRef} className={styles.wfCard}>
                <div className={styles.wfCardIconHeader}>
                  <div className={styles.iconWithLabel}>
                    <IconLandRecord />
                    <div>
                      <span className={styles.categoryTag}>TEXTUAL RECORDS</span>
                      <h4 className={styles.cardTitleInline}>RoR / 7-12 Records</h4>
                    </div>
                  </div>

                </div>

              </div>

              {/* Card 3 — Transactions */}
              <div ref={cardExchangeRef} className={styles.wfCard}>
                <div className={styles.wfCardIconHeader}>
                  <div className={styles.iconWithLabel}>
                    <IconExchange />
                    <div>
                      <span className={styles.categoryTag}>TRANSACTIONAL RECORDS</span>
                      <h4 className={styles.cardTitleInline}>Registration &amp; Mutation</h4>
                    </div>
                  </div>

                </div>

              </div>

              {/* Card 4 — Spatial & Legal */}
              <div ref={cardSpatialRef} className={styles.wfCard}>
                <div className={styles.wfCardIconHeader}>
                  <div className={styles.iconWithLabel}>
                    <IconSpatialLegal />
                    <div>
                      <span className={styles.categoryTag}>SPATIAL &amp; LEGAL RECORDS</span>
                      <h4 className={styles.cardTitleInline}>GIS &amp; Court Records</h4>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* CONNECTOR GAP COLUMN */}
          <div className={styles.connectorColGap} />

          {/* ============================================================
             COLUMN 02: RECONCILE (Center Column)
             ============================================================ */}
          <div className={`${styles.diagramColumn} ${styles.sectionPanelCenter}`}>
            {/* Header 02 Reconcile & Capabilities */}
            <div className={styles.cleanEngineContainer}>
              <div ref={engineCardRef} className={styles.centerEngineCard}>

                <div className={`${styles.columnHeader} ${styles.animSeq3}`}>
                  <span className={styles.columnNumber}>02</span>
                  <div>
                    <h3 className={styles.columnTitle}>RECONCILE</h3>
                  </div>
                </div>

                <div className={styles.engineHeader}>
                  <p className={styles.engineSubtitle}>Evidence Intelligence Engine</p>
                </div>

                {/* 6 Capability Tiles */}
                <div className={`${styles.tilesGrid} ${styles.animSeq3b}`}>
                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconOCR />
                      <span className={styles.tileCheckIcon}>✓</span>
                    </div>
                    <h5 className={styles.tileAction}>EXTRACT</h5>
                  </div>

                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconFieldExtract />
                      <span className={styles.tileCheckIcon}>✓</span>
                    </div>
                    <h5 className={styles.tileAction}>IDENTIFY</h5>
                  </div>

                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconLink />
                      <span className={styles.tileCheckIcon}>✓</span>
                    </div>
                    <h5 className={styles.tileAction}>TRACE</h5>
                  </div>

                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconReconcileScale />
                      <span className={styles.tileCheckIcon}>✓</span>
                    </div>
                    <h5 className={styles.tileAction}>CROSS-VALIDATE</h5>
                  </div>

                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconConflictAlert />
                      <span className={styles.tileAlertIcon}>!</span>
                    </div>
                    <h5 className={styles.tileAction}>DETECT</h5>
                  </div>

                  <div className={styles.capabilityTile}>
                    <div className={styles.tileIconRow}>
                      <IconRiskChart />
                      <span className={styles.tileCheckIcon}>✓</span>
                    </div>
                    <h5 className={styles.tileAction}>SCORE</h5>
                  </div>
                </div>

                {/* HERO DEMO FLOW: MULTI-SOURCE RECONCILIATION */}
                <div className={styles.reconciliationFlowHero}>
                  <div className={`${styles.flowHeroHeader} ${styles.animSeq4}`}>
                    <span className={styles.flowHeroBadge}>MULTI-SOURCE RECONCILIATION IN ACTION</span>
                    <span className={styles.parcelTag}>PARCEL #BV-9842</span>
                  </div>

                  {/* 3 Converging Input Sources (2.50 / 2.45 / 2.20) */}
                  <div className={`${styles.convergingSourcesRow} ${styles.animSeq4a}`}>
                    <div className={styles.sourceBox}>
                      {/*<span className={styles.srcCategory}>TEXTUAL</span>*/}
                      <span className={styles.srcLabel}>RoR Record</span>
                      <span className={styles.srcValue}>2.50 ha</span>
                    </div>
                    <div className={styles.sourceBox}>
                      {/*<span className={styles.srcCategory}>TRANSACTION</span>*/}
                      <span className={styles.srcLabel}>Registry Deed</span>
                      <span className={styles.srcValue}>2.45 ha</span>
                    </div>
                    <div className={styles.sourceBox}>
                      {/*<span className={styles.srcCategory}>SPATIAL</span>*/}
                      <span className={styles.srcLabel}>GIS Cadastral</span>
                      <span className={styles.srcValue}>2.20 ha</span>
                    </div>
                  </div>

                  {/* AREA CONFLICT DETECTED Banner */}
                  <div className={`${styles.convergenceCenterRow} ${styles.animSeq4b}`}>
                    <div className={styles.convergenceArrow}>↓</div>
                    <div className={`${styles.conflictAlertBanner} ${styles.amberPulseOneTime}`}>
                      <IconConflictAlert />
                      <div>
                        {/*<span className={styles.conflictBadgeText}>RECONCILIATION RESULT</span>*/}
                        <p className={styles.conflictDescText}>⚠️ AREA CONFLICT DETECTED &bull; 0.30 ha Variance</p>
                      </div>
                    </div>
                  </div>

                  {/* 72 / HIGH Priority Signal */}
                  <div className={`${styles.riskSignalActionRow} ${styles.animSeq4c}`}>
                    <div className={styles.riskBadgePill}>
                      <span className={styles.riskBadgeLabel}>INVESTIGATION PRIORITY</span>
                      <span className={styles.riskBadgeScore}>72/HIGH</span>
                    </div>
                    <Link href="/verification" className={styles.actionForwardArrow} style={{ textDecoration: 'none' }}>
                      &rarr; OFFICER REVIEW QUEUE
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONNECTOR GAP COLUMN */}
          <div className={styles.connectorColGap} />

          {/* ============================================================
             COLUMN 03: VERIFY & DELIVER (Right Column)
             ============================================================ */}
          <div className={`${styles.diagramColumn} ${styles.sectionPanel}`}>
            <div className={`${styles.columnHeader} ${styles.animSeq5b}`}>
              <span className={styles.columnNumber}>03</span>
              <div>
                <h3 className={styles.columnTitle}>VERIFY &amp; DELIVER</h3>
              </div>
            </div>

            {/* LINEAR CASCADE TOPOLOGY */}
            <div className={styles.cascadeContainer}>

              {/* Step 10: Risk Queue */}
              <Link href="/verification" ref={cardRiskQueueRef} className={`${styles.wfCardCompact} ${styles.animSeq6a}`} style={{ textDecoration: 'none' }}>
                <IconRiskQueue />
                <div>
                  <h4 className={styles.cardTitle}>Risk Queue</h4>
                </div>
              </Link>

              <div className={styles.cascadeGapSpacer} />

              {/* Step 11: Officer Review */}
              <Link href="/verification" ref={cardOfficerReviewRef} className={`${styles.wfCardCompact} ${styles.animSeq6b}`} style={{ textDecoration: 'none' }}>
                <IconOfficer />
                <div>
                  <h4 className={styles.cardTitle}>Officer Review</h4>
                </div>
              </Link>

              <div className={styles.cascadeGapSpacer} />

              {/* Step 12: Officer Decision */}
              <Link href="/verification" ref={cardOfficerDecisionRef} className={`${styles.wfCardCompact} ${styles.officerDecisionCard} ${styles.animSeq6c}`} style={{ textDecoration: 'none' }}>
                <div className={styles.decisionIconHeader}>
                  <IconDecision />
                  <span className={styles.humanLoopBadge}>HUMAN-IN-THE-LOOP</span>
                </div>
                <h4 className={styles.cardTitle}>Officer Decision</h4>
                <div className={styles.decisionPillsRow}>
                  <span className={`${styles.decPill} ${styles.decVerify}`}>VERIFY</span>
                  <span className={`${styles.decPill} ${styles.decReview}`}>REVIEW</span>
                  <span className={`${styles.decPill} ${styles.decReject}`}>REJECT</span>
                </div>
              </Link>

              <div className={styles.cascadeGapSpacer} />

              {/* Step 13: Deliverables */}
              <div ref={cardDeliverablesRef} className={`${styles.groupSection} ${styles.animSeq6d}`}>
                <span className={styles.groupLabelNeutral}>FINAL DELIVERABLES</span>
                <div className={styles.outputsGridBranching}>
                  <Link href="/records" className={styles.outputPillCardBranch} style={{ textDecoration: 'none' }}>
                    <IconSummary />
                    <div>
                      <span className={styles.outputTitle}>Parcel Summary</span>
                    </div>
                  </Link>

                  <Link href="/verification" className={styles.outputPillCardBranch} style={{ textDecoration: 'none' }}>
                    <IconConflictAlert />
                    <div>
                      <span className={styles.outputTitle}>Conflict Report</span>
                    </div>
                  </Link>

                  <Link href="/documents" className={styles.outputPillCardBranch} style={{ textDecoration: 'none' }}>
                    <IconOCR />
                    <div>
                      <span className={styles.outputTitle}>Evidence Report</span>
                    </div>
                  </Link>

                  <Link href="/audit" className={styles.outputPillCardBranch} style={{ textDecoration: 'none' }}>
                    <IconAuditTrail />
                    <div>
                      <span className={styles.outputTitle}>Audit Trail</span>
                    </div>
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
