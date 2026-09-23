'use client';

import React from 'react';
import styles from './StackingFeatureDeck.module.css';

// Line-art SVG Icons matching screenshot 100%
const IconExtraction = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconValidation = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);

const IconSpatialGIS = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconTimeline = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

const IconEvidenceGraph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="8.5" rx="1" />
    <line x1="10" x2="14" y1="12" y2="6.5" />
    <line x1="10" x2="14" y1="12" y2="17.5" />
  </svg>
);

const IconHumanLoop = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const FEATURES = [
  {
    id: 'extraction',
    icon: IconExtraction,
    title: 'Evidence-linked extraction',
    desc: 'Every extracted field can retain its source document, page, location and confidence.',
    tag: 'FIELD TRACEABILITY',
    highlight: '100% Page-Anchored',
    detail: 'Document & Page Bounding Box Links'
  },
  {
    id: 'validation',
    icon: IconValidation,
    title: 'Multi-source validation',
    desc: 'Compare RoR, registration, mutation, historical and other authorized evidence.',
    tag: 'CROSS-RECONCILIATION',
    highlight: 'Automated Checks',
    detail: 'RoR • Deed • GIS Mutual Validation'
  },
  {
    id: 'gis',
    icon: IconSpatialGIS,
    title: 'Text–GIS consistency',
    desc: 'Surface discrepancies between textual records and spatial parcel evidence.',
    tag: 'SPATIAL ALIGNMENT',
    highlight: 'Variance Alerting',
    detail: '2.50 ha Text vs 2.20 ha Cadastral Map'
  },
  {
    id: 'timeline',
    icon: IconTimeline,
    title: 'Ownership timeline',
    desc: 'Trace recorded ownership changes and transactions across time.',
    tag: 'CHAIN OF TITLE',
    highlight: 'Chronological Audit',
    detail: 'Historical Deeds & Mutation Ledger'
  },
  {
    id: 'graph',
    icon: IconEvidenceGraph,
    title: 'Parcel evidence graph',
    desc: 'Connect owners, parcels, documents, transactions, mutations and disputes.',
    tag: 'KNOWLEDGE GRAPH',
    highlight: 'Entity Linking',
    detail: 'Owners • Deeds • Parcels • Disputes'
  },
  {
    id: 'human',
    icon: IconHumanLoop,
    title: 'Human-in-the-loop',
    desc: 'Keep the officer in control of the final verification decision.',
    tag: 'OFFICER GOVERNANCE',
    highlight: 'Final Decision',
    detail: 'Human Verification & Sign-off'
  }
];

export default function StackingFeatureDeck() {
  return (
    <section className={styles.deckSectionWrapper} id="evidence-deck">
      <div className={styles.deckContainer}>
        
        {/* LEFT COLUMN: Sticky Section Header & Context */}
        <div className={styles.stickyLeftColumn}>
          <div className={styles.headerBadge}>SYSTEM INTELLIGENCE</div>
          <h2 className={styles.mainTitle}>
            Intelligence built around <span className={styles.blueTitleHighlight}>evidence.</span>
          </h2>
          <p className={styles.mainSubheadline}>
            The system does not replace the record or the officer. It makes the evidence easier to connect, compare and investigate.
          </p>

          {/* Quick Capability Feature Counter Pills */}
          
        </div>

        {/* RIGHT COLUMN: Apple/Linear-Style Sticky Stacking Deck */}
        <div className={styles.stackingRightColumn}>
          {FEATURES.map((card, index) => {
            const IconComp = card.icon;
            const topOffset = 100 + index * 24;

            return (
              <div
                key={card.id}
                className={styles.stackingCard}
                style={{
                  top: `${topOffset}px`,
                  zIndex: index + 10,
                }}
              >
                {/* Card Icon & Badge Row */}
                <div className={styles.cardHeaderRow}>
                  <div className={styles.iconContainer}>
                    <IconComp />
                  </div>
                  <span className={styles.cardTagBadge}>{card.tag}</span>
                </div>

                {/* Card Title & Main Description */}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p className={styles.cardDesc}>{card.desc}</p>
                </div>

                {/* Bottom Highlight Banner */}
                <div className={styles.cardFooterBanner}>
                  <div className={styles.highlightBadge}>
                    <span className={styles.greenPulseDot} />
                    <span>{card.highlight}</span>
                  </div>
                  <span className={styles.detailText}>{card.detail}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
