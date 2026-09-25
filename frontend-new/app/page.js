'use client';

import React from 'react';
import styles from './page.module.css';
import ScrollExpand from '@/components/landing/ScrollExpand/ScrollExpand';
import ConveyorScanner from '@/components/landing/ConveyorScanner/ConveyorScanner';
import WorkflowDiagram from '@/components/landing/WorkflowDiagram/WorkflowDiagram';
import StackingFeatureDeck from '@/components/landing/StackingFeatureDeck/StackingFeatureDeck';
import ScatterTextReveal from '@/components/landing/ScatterTextReveal/ScatterTextReveal';

import Link from 'next/link';

export default function DesignAnimationPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* 1. HERO SCROLL EXPAND COMPONENT ENCLOSING CONVEYOR SCANNER */}
      <ScrollExpand
        title="Digitization is only the beginning."
        scrollHint="Scroll to reveal"
        startWidth={42}
        startHeight={58}
        startRadius={24}
        useWindowScroll={true}
      >
        <ConveyorScanner />
      </ScrollExpand>

      {/* SCROLL DOWN INDICATOR */}
      <div className={styles.scrollDownIndicator}>
        <span className={styles.scrollText}>BHARAT VAULT PRODUCT WORKFLOW</span>
        <div className={styles.scrollArrow}>↓</div>
      </div>

      {/* 2. PRODUCT WORKFLOW DIAGRAM COMPONENT */}
      <WorkflowDiagram />

      {/* SCROLL DOWN INDICATOR */}
      <div className={styles.scrollDownIndicator}>
        <span className={styles.scrollText}>INTELLIGENCE BUILT AROUND EVIDENCE</span>
        <div className={styles.scrollArrow}>↓</div>
      </div>

      {/* 3. STACKING FEATURE DECK COMPONENT */}
      <StackingFeatureDeck />

      {/* SCROLL DOWN INDICATOR */}
      <div className={styles.scrollDownIndicator}>
        <span className={styles.scrollText}>EVERY DECISION SHOULD HAVE AN EVIDENCE TRAIL</span>
        <div className={styles.scrollArrow}>↓</div>
      </div>

      {/* 4. PINNED SCATTER & STATS REVEAL COMPONENT (MOBBIN HERO STYLE) */}
      <ScatterTextReveal />

      {/* 5. PLATFORM QUICK ACCESS CTA BANNER */}
      <footer style={{
        padding: '60px 24px 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #090d16 0%, #030712 100%)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        marginTop: '60px'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
            Ready to experience <span style={{ color: '#3b82f6' }}>Bharat Vault</span>?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '32px' }}>
            Access automated land parcel reconciliation, spatial GIS mapping, and tamper-evident audit trails.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '40px' }}>
            <Link href="/dashboard" style={{
              padding: '14px 28px',
              borderRadius: '10px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}>
              Launch Workspace &rarr;
            </Link>
            <Link href="/parcels" style={{
              padding: '14px 24px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none'
            }}>
              Explore Land Parcels
            </Link>
            <Link href="/verification" style={{
              padding: '14px 24px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none'
            }}>
              Verification Desk
            </Link>
          </div>

          <div style={{
            display: 'flex',
            justify: 'center',
            gap: '24px',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <Link href="/records" style={{ color: '#64748b', textDecoration: 'none' }}>Records Vault</Link>
            <span>•</span>
            <Link href="/documents" style={{ color: '#64748b', textDecoration: 'none' }}>Documents Ingestion</Link>
            <span>•</span>
            <Link href="/audit" style={{ color: '#64748b', textDecoration: 'none' }}>Audit Trail</Link>
            <span>•</span>
            <Link href="/reports" style={{ color: '#64748b', textDecoration: 'none' }}>Analytics & Reports</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}