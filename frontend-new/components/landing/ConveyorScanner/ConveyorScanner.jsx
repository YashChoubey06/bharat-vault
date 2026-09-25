'use client';

import React from 'react';
import styles from './ConveyorScanner.module.css';

export default function ConveyorScanner() {
  // Raw Input Documents ONLY for the Left Conveyor Stream (Before Scanner)
  const documentInputs = [
    { id: 'd1', type: 'photo', title: 'Survey Photo', tag: 'JPG', tiltClass: styles.tiltLeft },
    { id: 'd2', type: 'pdf', title: 'Registry Deed', tag: 'PDF', tiltClass: styles.tiltRight },
    { id: 'd3', type: 'doc', title: 'Tax Notice', tag: 'DOC', tiltClass: styles.tiltLeftAlt },
    { id: 'd4', type: 'map', title: 'Cadastral Map', tag: 'MAP', tiltClass: styles.tiltRightAlt },
  ];

  // Transformed Land Parcels ONLY for the Right Conveyor Stream (After Scanner)
  const landParcels = [
    { id: 'BV-9842', khasra: 'Khasra 412/A', area: '2.45 Acres', location: 'Jaipur', status: 'Title Verified' },
    { id: 'BV-7731', khasra: 'Plot 88-B', area: '1.80 Hectares', location: 'Udaipur', status: 'GIS Reconciled' },
    { id: 'BV-5109', khasra: 'Khatauni #890', area: '4.12 Acres', location: 'Jodhpur', status: 'Ownership Verified' },
    { id: 'BV-3320', khasra: 'Khasra 104', area: '0.95 Acres', location: 'Kota', status: 'Blockchain Sealed' },
  ];

  const renderDocumentCard = (item, key) => (
    <div key={key} className={`${styles.docCard} ${item.tiltClass}`}>
      <div className={styles.docHeader}>
        <span className={styles.docTitle}>{item.title}</span>
        <span className={styles.rawStatusBadge}>RAW</span>
      </div>
      {item.type === 'photo' ? (
        <div className={styles.photoBox}>
          <div className={styles.photoLandscape} />
          <span className={styles.photoSubTag}>LAT 26.91 / LON 75.78</span>
        </div>
      ) : item.type === 'map' ? (
        <div className={styles.mapBox}>
          <div className={styles.mapGrid} />
          <span className={styles.mapSubTag}>GIS EPSG:4326</span>
        </div>
      ) : (
        <div className={styles.skeletonContainer}>
          <div className={styles.skeletonLine} style={{ width: '85%' }} />
          <div className={styles.skeletonLine} style={{ width: '60%' }} />
          <div className={styles.skeletonLine} style={{ width: '75%' }} />
        </div>
      )}
      <div className={styles.docFooter}>
        <span className={styles.unscannedText}>UNSCANNED</span>
        <span className={styles.docTag}>{item.tag}</span>
      </div>
    </div>
  );

  const renderParcelCard = (parcel, key) => (
    <div key={key} className={styles.parcelCard}>
      <div className={styles.parcelHeader}>
        <span className={styles.parcelTitle}>Parcel #{parcel.id}</span>
        <span className={styles.parcelBadge}>✓ {parcel.status}</span>
      </div>
      <div className={styles.parcelRow}>
        <span>Plot No:</span>
        <span className={styles.valHighlight}>{parcel.khasra}</span>
      </div>
      <div className={styles.parcelRow}>
        <span>Land Area:</span>
        <span>{parcel.area}</span>
      </div>
      <div className={styles.parcelRow}>
        <span>Location:</span>
        <span>{parcel.location}</span>
      </div>
    </div>
  );

  return (
    <div className={styles.canvasCard}>
      {/* Corner Accents */}
      <span className={`${styles.cornerPlus} ${styles.topLeft}`}>+</span>
      <span className={`${styles.cornerPlus} ${styles.topRight}`}>+</span>
      <span className={`${styles.cornerPlus} ${styles.bottomLeft}`}>+</span>
      <span className={`${styles.cornerPlus} ${styles.bottomRight}`}>+</span>

      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.brand}>
          <div className={styles.logoIcon}>
            <span className={styles.logoDot} />
            <span className={styles.logoDot} />
            <span className={styles.logoDot} />
            <span className={styles.logoDot} />
          </div>
          BhuSutra
        </div>
        <ul className={styles.navLinks}>
        </ul>
        <a href="/login" className={styles.btnNav}>
          Sign In &rarr;
        </a>
      </nav>

      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <h1 className={styles.headline}>
          From fragmented records<span className={styles.highlightPill}> to trusted evidence.</span>
        </h1>
        <p className={styles.subheadline}>
          Lower effort, higher accuracy—automation that turns photos, deeds &amp; docs into verified land parcels
        </p>
        <button className={styles.ctaBtn}>Request a demo</button>
      </div>

      {/* Conveyor Stage Container */}
      <div className={styles.stageContainer}>
        <div className={styles.trackRibbon} />

        {/* LEFT TRACK: Raw Documents ONLY */}
        <div className={styles.leftTrackContainer}>
          <div className={styles.docsConveyorBelt}>
            {[1, 2, 3].map((cycle) => (
              <React.Fragment key={`left-cycle-${cycle}`}>
                {documentInputs.map((doc, idx) =>
                  renderDocumentCard(doc, `left-doc-${cycle}-${idx}`)
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* RIGHT TRACK: Converted Land Parcels ONLY */}
        <div className={styles.rightTrackContainer}>
          <div className={styles.parcelsConveyorBelt}>
            {[1, 2, 3].map((cycle) => (
              <React.Fragment key={`right-cycle-${cycle}`}>
                {landParcels.map((parcel, idx) =>
                  renderParcelCard(parcel, `right-parcel-${cycle}-${idx}`)
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Central Scanner Container with Laser Sweep & Skeleton Reveal */}
        <div className={styles.scannerContainer}>
          <div className={styles.scannerAuraGlow} />

          <div className={styles.scannerFrame}>
            <span className={`${styles.scannerBracket} ${styles.bracketTopLeft}`} />
            <span className={`${styles.scannerBracket} ${styles.bracketTopRight}`} />
            <span className={`${styles.scannerBracket} ${styles.bracketBottomLeft}`} />
            <span className={`${styles.scannerBracket} ${styles.bracketBottomRight}`} />

            <div className={styles.scannerTopBadge}>
              <span className={styles.livePulseDot} />
              AI SCANNER
            </div>
            <div className={styles.scannerBottomBadge}>
              PARCEL PARSER
            </div>

            <div className={styles.gridAperture}>
              <div className={styles.blueprintGridPattern} />

              {/* DOCUMENT SKELETON WIREFRAME (Synchronized with laser sweep!) */}
              <div className={styles.skeletonWireframeLayer}>
                <div className={styles.skeletonCardInner}>
                  <div className={styles.skeletonHeader}>
                    <span className={styles.skeletonTitle}>PARSING DOC</span>
                    <span className={styles.skeletonBadge}>OCR LIVE</span>
                  </div>
                  <div className={styles.skeletonCadBox}>
                    <div className={styles.skeletonCadMesh} />
                    <span className={styles.skeletonCenterCross}>+</span>
                  </div>
                  <div className={styles.skeletonLinesGroup}>
                    <div className={styles.skeletonBar} style={{ width: '90%' }} />
                    <div className={styles.skeletonBar} style={{ width: '65%' }} />
                    <div className={styles.skeletonBar} style={{ width: '80%' }} />
                  </div>
                  <div className={styles.skeletonFooter}>
                    <span>KHASRA DETECTED</span>
                    <span>EPSG:4326</span>
                  </div>
                </div>
              </div>

              <div className={styles.sweepingLaserBeam} />
              <div className={styles.scanGlowShimmer} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
