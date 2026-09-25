# 🏛️ BharatVault (भारत वॉल्ट)

> **Next-Gen Sovereign Land Titling Verification Engine & Explainable Cadastral Intelligence Platform**  
> *Empowering Digital Public Infrastructure (DPI) with Cryptographic Provenance, Bilingual Document Vision, and Deterministic Cross-Source Reconciliation.*

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015%20(Turbopack)-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.13-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL 17](https://img.shields.io/badge/Database-PostgreSQL%2017%20%2B%20SQLAlchemy-4169E1?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Mapbox GL](https://img.shields.io/badge/GIS-Mapbox%20GL%20Cadastral%20Studio-000000?style=for-the-badge&logo=mapbox)](https://www.mapbox.com/)
[![Security](https://img.shields.io/badge/Security-Zero--Trust%20%7C%20Air--Gapped%20OCR-red?style=for-the-badge&logo=auth0)](#-security--sovereignty)
[![Compliance](https://img.shields.io/badge/Compliance-DPDP%20Act%20%7C%20DILRMP%20Ready-green?style=for-the-badge)](#-compliance--governance)

---

## ⚡ The Buzzword Taxonomy

| Pillar | Keywords & Industry Buzzwords |
| :--- | :--- |
| 🛡️ **Sovereignty & Security** | *Zero-Trust Architecture*, *Air-Gapped Local Inference*, *Zero Data-Leakage*, *Cryptographic Provenance*, *SHA-256 Content-Addressed Storage*, *HttpOnly RBAC*, *District Multi-Tenancy* |
| 🧠 **Intelligent Vision** | *Bilingual OCR Engine (English + Hindi/Devanagari)*, *Pixel-Coordinate Spatial Mapping*, *Explainable Information Extraction (XAI)*, *No Hallucination Architecture* |
| ⚖️ **Data Reconciliation** | *Deterministic Multi-Source Corroboration*, *Canonical Typed Claims Engine*, *Automated Dispute Detection*, *Tolerance-Bounded Unit Normalization* |
| 🗺️ **Geospatial & Cadastre** | *Cadastral GIS Vector Engine*, *GeoJSON Polygon Boundary Auditing*, *CRS Normalization*, *3D Spatial Parcel Studio (Mapbox GL)* |
| 📜 **GovTech & Trust** | *Digital Public Infrastructure (DPI)*, *Append-Only Hash-Linked Audit Trails*, *Human-in-the-Loop (HITL) Adjudication*, *DILRMP Compliance* |

---

## 📌 Executive Summary

**BharatVault** is an enterprise-grade **Land Titling Verification & Cadastral Intelligence Platform** purpose-built to eliminate property fraud, conflicting ownership claims, and boundary overlap in land registries.

By orchestrating **local bilingual Computer Vision (OCR)**, **deterministic cross-source resolution**, and **tamper-proof cryptographic audit trails**, BharatVault bridges the gap between physical land records (*Jamabandi / RoR*, *Registered Sale Deeds*, *Namantaran / Mutations*) and authoritative spatial cadastral maps—without sending sensitive citizen records to public cloud LLMs or third-party APIs.

---

## 🌟 Core Pillars & Key Features

### 1. 👁️ Bilingual Vision & Zero-Cloud Document Extraction
- **English + Devanagari (Hindi) OCR**: Durable, local OCR engine processing multi-page PDFs, scans, and high-res imagery up to 25 MP per page.
- **Pixel-Accurate Provenance**: Extracts fields with bounding-box coordinates (`[ymin, xmin, ymax, xmax]`), visual confidence scores, and raw token anchors.
- **Privacy-First & Air-Gapped**: 100% on-premise execution. No document data or PII ever leaves your secure perimeter.

### 2. ⚖️ Deterministic Multi-Source Evidence Resolution
- **Canonical Fact Modeling**: Translates heterogeneous government documents into normalized, typed claims (Owner, Khasra/Survey Number, Area, Mutation Entry, Registration Timestamps).
- **Zero Hallucination Assurance**: Eliminates generative AI drift. Resolves facts using rule-based multi-source corroboration (requiring 2+ independent source groups for ownership validation).
- **Unit Normalization Engine**: Mathematically normalizes Hectares, Acres, Sq. Meters, and regional units with strict precision tolerance (`AREA_TOLERANCE_HA = 0.02`).

### 3. 🗺️ Interactive Cadastral Studio & Spatial GIS Engine
- **Cadastral Vector Overlays**: Vector polygon boundary rendering powered by **Mapbox GL** and **Three.js**.
- **Spatial Variance Auditing**: Instant programmatic cross-check between documentary land area claims and calculated geospatial boundary polygons.
- **Multi-CRS Geometry**: Support for custom survey coordinates, cadastral layers, and surveyor field notes.

### 4. 🔗 Tamper-Proof Cryptographic Audit Trail
- **Merkle-Inspired Append-Only Logs**: Every state transition, officer decision, and document ingestion is hashed (SHA-256) and chained chronologically.
- **Immutable Provenance Snapshots**: PostgreSQL triggers enforce write-once-read-many (WORM) constraints on raw queries, normalized claims, and verification runs.
- **Portable Evidence Dossiers**: One-click cryptographic JSON exports for legal proceedings and revenue courts.

### 5. 🧑‍⚖️ Human-in-the-Loop (HITL) Adjudication Queue
- **Granular RBAC**: Tiered access workflows (`Officer`, `Operator`, `Admin`) with district scoping and rate-limited session authentication.
- **Interactive Conflict Resolver**: Officers can review highlighted visual discrepancies, inspect conflicting source documents, attach reasoned justifications, and record unalterable rulings.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph UI ["Modern Frontend Layer (Next.js 15 + Turbopack)"]
        A[Parcel Registry & Dashboard] --> B[Interactive Evidence Viewer]
        B --> C[3D Cadastral Studio (Mapbox GL)]
        C --> D[HITL Adjudication & Risk Queue]
    end

    subgraph Core ["Sovereign Backend (FastAPI + Async Worker)"]
        E[API Gateway & RBAC Guard] --> F[Durable Bilingual OCR Pipeline]
        F --> G[Canonical Claims & Normalizer]
        G --> H[Evidence Resolution Planner]
        H --> I[Cross-Source Corroboration Engine]
    end

    subgraph Data ["Immutable Persistence Layer (PostgreSQL 17)"]
        J[(Source Records & Raw Payloads)]
        K[(Canonical Typed Claims)]
        L[(Hash-Linked Audit Chain)]
        M[(Spatial Parcel Geometry)]
    end

    UI <===>|Secure HttpOnly Cookies / REST API| Core
    Core <===>|SQLAlchemy 2.0 ORM & Alembic| Data
```

---

## 💻 Tech Stack

### Frontend & Visualization
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Runtime & UI**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Spatial / Cadastral**: [Mapbox GL](https://www.mapbox.com/), [Three.js](https://threejs.org/)
- **Motion & Analytics**: [Framer Motion](https://motion.dev/), [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)

### Backend & Core Engine
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous ASGI)
- **Language**: Python 3.11+ / 3.13
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/), [Alembic](https://alembic.sqlalchemy.org/)
- **Database**: [PostgreSQL 17](https://www.postgresql.org/) (with enterprise SCRAM-SHA-256) & [SQLite](https://www.sqlite.org/) (Local Test/Dev)
- **OCR & Computer Vision**: Tesseract OCR (Trained bilingual models: `hin` + `eng`), Pillow, PDF2Image

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js** v20+ & **pnpm** (or npm)
- **Python** 3.11+ (Tested on Python 3.13)
- **Tesseract OCR 5** with `eng` and `hin` language packs installed

### 1. One-Click Automated Launch (Windows PowerShell)

```powershell
# Navigate to the work workspace
cd work

# Start backend & frontend concurrently (Production / Optimized mode)
./start-local.ps1

# Or run with Hot-Reloading for frontend development
./start-local.ps1 -Dev
```
> App will be accessible at: **`http://localhost:3003`**  
> Backend APIs running at: **`http://127.0.0.1:8000/docs`**

To cleanly shut down services:
```powershell
./stop-local.ps1
```

---

### 2. Manual Step-by-Step Installation

#### Backend Setup
```bash
cd work/backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
python -m backend.main
```

#### Frontend Setup
```bash
cd work
pnpm install
pnpm dev
```

---

## 🛡️ Default RBAC Roles & Verification

BharatVault ships with local zero-trust demonstration credentials configured for testing:

| Role | Email Identifier | Capabilities |
| :--- | :--- | :--- |
| **Officer** | `officer@bharatvault.gov` | Full write, manual OCR mapping, case verification & approval |
| **Operator** | `operator@bharatvault.gov` | Ingest scans, run OCR, inspect discrepancies; cannot approve |
| **Admin** | `admin@bharatvault.gov` | District-wide compliance auditing, cross-jurisdiction inspection |

---

## 🧪 Rigorous Automated Testing

```powershell
# Execute the comprehensive backend test suite
./backend/.venv/Scripts/python.exe -m unittest backend.test_mvp -v
./backend/.venv/Scripts/python.exe -m unittest backend.test_resolution -v

# Run Frontend Linting & Production Build
pnpm lint
pnpm build
```

---

## 📜 Compliance & Governance

- **DILRMP Alignment**: Adheres to the principles of the *Digital India Land Records Modernization Programme*, driving conclusive land titling.
- **DPDP Act (2023) Compliance**: Zero secondary data sharing, strict data minimization, and sovereign local residency of citizen property records.
- **WORM Standard**: Audit trails adhere to *Write Once, Read Many* integrity checks to resist administrative repudiation.

---

## 🤝 Contributing & License

Contributions are welcome! Please submit PRs with matching test suites and ensure all cryptographic and evidence constraints pass validation.

Distributed under the **MIT License**. Built with pride for Sovereign Digital Governance.
