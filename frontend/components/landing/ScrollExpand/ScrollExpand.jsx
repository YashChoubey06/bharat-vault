'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import styles from './ScrollExpand.module.css';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

// Green Map Pin Icon matching screenshot
const MapPinIcon = ({ label }) => (
  <div className={styles.mapPinMarker}>
    <svg width="20" height="24" viewBox="0 0 24 24" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
    </svg>
    <span className={styles.pinLabel}>{label}</span>
  </div>
);

export default function ScrollExpand({
  src = '/cadastral_map_hero.jpg',
  mediaType = 'image',
  poster = '',
  alt = 'Cadastral Map',
  title = 'Digitization is only the beginning.',
  scrollHint = 'Scroll to reveal',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.25,
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.4,
  useWindowScroll = true,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const heroMapRef = useRef(null);
  const titleRef = useRef(null);
  const overlayRef = useRef(null);
  const scrimRef = useRef(null);
  const hintRef = useRef(null);

  const propsRef = useRef({});
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled
  };

  const applyProgress = useCallback(p => {
    const frame = frameRef.current;
    if (!frame) return;
    const c = propsRef.current;

    const e = smoothstep(0, 1, p);

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    // Synchronized Fade Out of Hero Cadastral Map Box AND Title
    const out = smoothstep(0.25, 0.82, p);

    if (heroMapRef.current) {
      heroMapRef.current.style.opacity = `${1 - out}`;
      heroMapRef.current.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e}) translate3d(0, ${-24 * out}px, 0)`;
    }

    if (scrimRef.current) {
      scrimRef.current.style.opacity = `${c.overlayScrim * e}`;
    }

    if (titleRef.current) {
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-32 * out}px, 0) scale(${1 + 0.05 * out})`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.15, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${10 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.45, 0.95, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${20 * (1 - inn)}px, 0)`;
      overlayRef.current.style.pointerEvents = inn > 0.8 ? 'auto' : 'none';
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.058, 24, 76)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * c.smoothing));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      target = readProgress();
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      target = readProgress();
      current = target;
      applyProgress(current);
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  return (
    <div
      ref={rootRef}
      className={`${styles.scrollExpand} ${useWindowScroll ? '' : styles.scrollExpandScroller} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className={styles.scrollExpandTrack}>
        <div ref={stageRef} className={styles.scrollExpandStage}>

          <div ref={frameRef} className={styles.scrollExpandFrame}>

            {/* INITIAL HERO CADASTRAL GIS MAP BOX (Behind Text) */}
            <div ref={heroMapRef} className={styles.heroMapContainer}>
              <img
                src={src || "/cadastral_map_hero.jpg"}
                alt="Cadastral GIS Map"
                className={styles.cadastralMapImg}
              />
              <div className={styles.mapGridOverlay}>
                {/* SVG Parcel Boundaries Matching User Screenshot */}
                <svg width="100%" height="100%" className={styles.svgParcelOverlay}>
                  <polygon points="120,80 320,60 420,180 200,220" fill="rgba(34,197,94,0.06)" stroke="#16a34a" strokeWidth="1.5" />
                  <polygon points="430,70 650,110 580,260 380,200" fill="rgba(37,99,235,0.05)" stroke="#2563eb" strokeWidth="2" />
                  <polygon points="210,230 450,210 390,420 180,380" fill="rgba(37,99,235,0.08)" stroke="#2563eb" strokeWidth="2.5" />
                  <text x="220" y="140" fill="#1e293b" fontSize="11" fontWeight="700">PLOT 501</text>
                  <text x="480" y="170" fill="#1e293b" fontSize="11" fontWeight="700">PLOT 625</text>
                  <text x="310" y="310" fill="#1e293b" fontSize="12" fontWeight="800">PLOT 628</text>
                  <text x="520" y="330" fill="#1e293b" fontSize="11" fontWeight="700">PLOT 726</text>
                </svg>

                {/* Verified Pin Markers */}
                <div style={{ position: 'absolute', top: '15%', left: '38%' }}>
                  <MapPinIcon label="PLOT 624 - Verified" />
                </div>
                <div style={{ position: 'absolute', top: '22%', left: '56%' }}>
                  <MapPinIcon label="PLOT 625 - Verified" />
                </div>
                <div style={{ position: 'absolute', top: '38%', left: '46%' }}>
                  <MapPinIcon label="PLOT 624" />
                </div>
              </div>
            </div>

            <div ref={scrimRef} className={styles.scrollExpandScrim} />

            {/* EXPANDED CONTENT (ConveyorScanner) */}
            {children ? (
              <div ref={overlayRef} className={styles.scrollExpandOverlay}>
                {children}
              </div>
            ) : null}

          </div>

          {/* HERO TITLE OVERLAY */}
          {title ? (
            <div ref={titleRef} className={styles.scrollExpandTitle}>
              {title}
            </div>
          ) : null}

          {/* SCROLL HINT */}
          {scrollHint ? (
            <div ref={hintRef} className={styles.scrollExpandHint}>
              {scrollHint} &darr;
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}
