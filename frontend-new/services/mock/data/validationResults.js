export const validationCheckCenterData = [
  {
    id: "doc_quality",
    name: "Document Quality",
    category: "DOCUMENT",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "OCR Image Resolution", value: "300 DPI (High Clarity)" },
      { label: "Text Extraction Confidence", value: "99.4%" },
      { label: "Physical Damage Index", value: "0.2% (Negligible)" },
    ],
    difference: {
      type: "normal",
      title: "No Quality Defects",
      callout: "✓ Clear Document Scan",
      text: "Document scans meet high-resolution OCR parsing standards with zero unreadable text regions.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Page 1 of 2", ref: "DOC-001" },
      { name: "Mutation_Deed_2021.pdf", page: "Full Scan", ref: "DOC-002" },
    ],
    actions: [
      { label: "View RoR Evidence", path: "/records/PRC-001/evidence", iconName: "FileText" },
      { label: "Open Document Viewer", path: "/documents", iconName: "Eye" },
    ],
  },
  {
    id: "record_completeness",
    name: "Record Completeness",
    category: "DOCUMENT",
    status: "WARN",
    iconSymbol: "⚠",
    sourceValues: [
      { label: "Required Fields Present", value: "11 of 12 fields" },
      { label: "Missing Attribute", value: "Historical Ledger Volume # (2019)" },
      { label: "Khata & Survey IDs", value: "Complete (KH-782, Survey 124/3)" },
    ],
    difference: {
      type: "warning",
      title: "Attribute Deficit (1-year volume gap)",
      callout: "⚠ Potential inconsistency requiring investigation",
      text: "Volume index for 2019 transaction ledger is missing from physical archive index. Manual investigation is recommended.",
    },
    sourceDocuments: [
      { name: "Mutation_Ledger_2018.pdf", page: "Vol 14, Pg 88", ref: "DOC-2018-014" },
      { name: "Mutation_Ledger_2020.pdf", page: "Vol 16, Pg 12", ref: "DOC-2020-016" },
    ],
    actions: [
      { label: "View Archives", path: "/documents", iconName: "Search" },
      { label: "Investigate", path: "/verification", iconName: "ChevronRight" },
    ],
  },
  {
    id: "owner_consistency",
    name: "Owner Consistency",
    category: "IDENTITY",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "Current RoR Owner", value: "Suresh Kumar" },
      { label: "Sale Deed Buyer (2021)", value: "Suresh Kumar" },
      { label: "Property Tax Register", value: "Suresh Kumar" },
    ],
    difference: {
      type: "normal",
      title: "100% Name String & Identity Match",
      callout: "✓ Identity Verified",
      text: "Owner identity verified across revenue register, deed, and municipal tax databases.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Column 2 (Owner)", ref: "DOC-001" },
      { name: "Registry_Deed_2021.pdf", page: "Party 2 (Purchaser)", ref: "DOC-003" },
    ],
    actions: [
      { label: "View Ownership Timeline", path: "/records/PRC-001/timeline", iconName: "Eye" },
    ],
  },
  {
    id: "khasra_consistency",
    name: "Khasra Consistency",
    category: "IDENTITY",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "RoR Survey Number", value: "124/3" },
      { label: "Deed Schedule Khasra", value: "124/3" },
      { label: "Tehsil Cadastral Index", value: "124/3" },
    ],
    difference: {
      type: "normal",
      title: "Survey Number Exact Alignment",
      callout: "✓ Khasra Matched",
      text: "Survey subdivision identifier '124/3' is consistent across all legal records.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Header", ref: "DOC-001" },
      { name: "Cadastral_Index.pdf", page: "Sheet 4, Block B", ref: "CAD-124" },
    ],
    actions: [
      { label: "View Parcel Detail", path: "/records/PRC-001", iconName: "Eye" },
    ],
  },
  {
    id: "khata_consistency",
    name: "Khata Consistency",
    category: "IDENTITY",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "Jamabandi Khata #", value: "KH-782" },
      { label: "Revenue Ledger Khata", value: "KH-782" },
      { label: "Mutation Order Khata", value: "KH-782" },
    ],
    difference: {
      type: "normal",
      title: "Khata Identifier Verified",
      callout: "✓ Khata Verified",
      text: "Khata number 'KH-782' matched with zero discrepancy.",
    },
    sourceDocuments: [
      { name: "Jamabandi_2024.pdf", page: "Khata 782", ref: "DOC-001" },
    ],
    actions: [
      { label: "View Record", path: "/records/PRC-001", iconName: "Eye" },
    ],
  },
  {
    id: "area_consistency",
    name: "Area Consistency",
    category: "CROSS-SOURCE",
    status: "WARN",
    iconSymbol: "⚠",
    sourceValues: [
      { label: "RoR 2024", value: "2.50 hectares" },
      { label: "Registration Deed 2021", value: "2.45 hectares" },
      { label: "Mutation Order 2021", value: "2.50 hectares" },
      { label: "GIS Satellite Survey 2025", value: "2.20 hectares" },
    ],
    difference: {
      type: "warning",
      title: "Difference: 0.30 hectares (GIS vs RoR)",
      callout: "⚠ Potential inconsistency requiring investigation",
      text: "RoR records 2.50 ha while high-resolution satellite GIS survey measures 2.20 ha (0.30 ha variance). Registration deed records 2.45 ha.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Column 4 (Area)", ref: "DOC-001" },
      { name: "Registry_Deed_2021.pdf", page: "Schedule B", ref: "DOC-003" },
      { name: "GIS_Cadastral_Extract.png", page: "Polygon ID: GIS-124-2025", ref: "GIS-124" },
    ],
    actions: [
      { label: "View RoR Evidence", path: "/records/PRC-001/evidence", iconName: "FileText" },
      { label: "View GIS", path: "/records/PRC-001/gis", iconName: "MapPin" },
      { label: "Investigate", path: "/verification", iconName: "ChevronRight" },
    ],
  },
  {
    id: "mutation_continuity",
    name: "Mutation Continuity",
    category: "CROSS-SOURCE",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "Mutation Case #", value: "MUT-2021-412" },
      { label: "Sanctioning Officer", value: "Tehsildar Sadar" },
      { label: "Sanction Date", value: "02-Feb-2021" },
    ],
    difference: {
      type: "normal",
      title: "Valid Mutation Lineage",
      callout: "✓ Lineage Verified",
      text: "Mutation order approved and recorded in revenue register following 2021 sale deed.",
    },
    sourceDocuments: [
      { name: "Mutation_Order_412.pdf", page: "Page 1", ref: "DOC-002" },
    ],
    actions: [
      { label: "View Evidence Records", path: "/records/PRC-001/evidence", iconName: "FileText" },
    ],
  },
  {
    id: "registration_consistency",
    name: "Registration Consistency",
    category: "CROSS-SOURCE",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "Deed Reg Number", value: "REG-2021-094" },
      { label: "E-Stamp Certificate", value: "EST-99401284 (Verified)" },
      { label: "Sub-Registrar Office", value: "Sub-Registrar Sadar, Kota" },
    ],
    difference: {
      type: "normal",
      title: "Stamp Duty & Registration Authenticated",
      callout: "✓ Authenticated",
      text: "Registration entry validated against state e-stamp treasury portal.",
    },
    sourceDocuments: [
      { name: "Sale_Deed_2021.pdf", page: "Page 1 (Stamp)", ref: "DOC-003" },
    ],
    actions: [
      { label: "View Documents", path: "/documents", iconName: "FileText" },
    ],
  },
  {
    id: "historical_continuity",
    name: "Historical Continuity",
    category: "CROSS-SOURCE",
    status: "WARN",
    iconSymbol: "⚠",
    sourceValues: [
      { label: "1998 Legacy Deed Owner", value: "Ramesh Kumar" },
      { label: "2021 Sale Deed Buyer", value: "Suresh Kumar" },
      { label: "Lineage Gap", value: "1998-2007 mutation record gap" },
    ],
    difference: {
      type: "warning",
      title: "Historical Ownership Lineage Gap",
      callout: "⚠ Potential inconsistency requiring investigation",
      text: "Property transferred from Ramesh Kumar to Suresh Kumar in 2021, but 1998-2007 intermediate revenue entry volume index is incomplete.",
    },
    sourceDocuments: [
      { name: "Legacy_Deed_1998.pdf", page: "Page 2", ref: "DOC-1998-002" },
      { name: "Sale_Deed_2021.pdf", page: "Page 1", ref: "DOC-003" },
    ],
    actions: [
      { label: "Open Timeline", path: "/records/PRC-001/timeline", iconName: "Eye" },
      { label: "Investigate", path: "/verification", iconName: "ChevronRight" },
    ],
  },
  {
    id: "text_gis_consistency",
    name: "Text-GIS Consistency",
    category: "CROSS-SOURCE",
    status: "FAIL",
    iconSymbol: "🔴",
    sourceValues: [
      { label: "Text Boundary Description", value: "North: Govt Drainage Canal (G-401)" },
      { label: "GIS Polygon Overlay", value: "Overlap detected by 42 sq meters" },
      { label: "Conflict Category", value: "Public Easement Overlap" },
    ],
    difference: {
      type: "danger",
      title: "Spatial Boundary Overlap",
      callout: "⚠ Potential inconsistency requiring investigation",
      text: "GIS spatial polygon overlaps with Govt Nala plot #G-401 boundary by 42 sq. meters. Field survey verification recommended.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Page 2 (Boundary)", ref: "DOC-001" },
      { name: "GIS_Satellite_Survey.tif", page: "Layer: Govt Plots", ref: "GIS-124" },
    ],
    actions: [
      { label: "Inspect GIS", path: "/records/PRC-001/gis", iconName: "MapPin" },
      { label: "Investigate", path: "/verification", iconName: "ChevronRight" },
    ],
  },
  {
    id: "duplicate_detection",
    name: "Duplicate Detection",
    category: "DOCUMENT",
    status: "PASS",
    iconSymbol: "✓",
    sourceValues: [
      { label: "Digital Parcel Fingerprint", value: "HASH-7821094-PRC-001" },
      { label: "Duplicate Filing Index", value: "0 matches in state database" },
    ],
    difference: {
      type: "normal",
      title: "Unique Record Fingerprint",
      callout: "✓ Zero Duplicates",
      text: "No duplicate registration filings or double-mortgage entries found.",
    },
    sourceDocuments: [
      { name: "RoR_Jamabandi_124_3.pdf", page: "Entire File", ref: "DOC-001" },
    ],
    actions: [
      { label: "View Graph", path: "/records/PRC-001/graph", iconName: "Eye" },
    ],
  },
  {
    id: "dispute_status",
    name: "Dispute Status",
    category: "CROSS-SOURCE",
    status: "FAIL",
    iconSymbol: "🔴",
    sourceValues: [
      { label: "Revenue Court Case", value: "CS-2023-889 (District Revenue Court)" },
      { label: "Court Stay Order", value: "Title Boundary Dispute Pending" },
      { label: "Revenue Endorsement", value: "Un-endorsed in Jamabandi Khata" },
    ],
    difference: {
      type: "danger",
      title: "Active Court Dispute Signal",
      callout: "⚠ Potential inconsistency requiring investigation",
      text: "Revenue court title dispute (CS-2023-889) filed in 2023 is pending but unendorsed in local Jamabandi Khata.",
    },
    sourceDocuments: [
      { name: "Court_Order_2023_889.pdf", page: "Page 1 & 2", ref: "CC-2023-889" },
      { name: "Jamabandi_2024.pdf", page: "Khata 782", ref: "DOC-001" },
    ],
    actions: [
      { label: "Review Evidence", path: "/verification", iconName: "FileText" },
      { label: "Investigate", path: "/verification", iconName: "ChevronRight" },
    ],
  },
];

export const validationResults = [
  {
    parcelId: "PRC-001",
    overallResult: "REVIEW_REQUIRED",
    totalChecks: 12,
    passedCount: 7,
    warningCount: 3,
    criticalCount: 2,
    validationChecks: validationCheckCenterData,
    checks: [
      { check: "DOCUMENT_QUALITY", status: "PASS", message: "Scan meeting 300 DPI standards." },
      { check: "RECORD_COMPLETENESS", status: "WARN", message: "1-year volume index gap in historical ledger." },
      { check: "OWNER_CONSISTENCY", status: "PASS", message: "Suresh Kumar recorded across active files." },
      { check: "SURVEY_NUMBER_CONSISTENCY", status: "PASS", message: "Survey 124/3 matched." },
      { check: "KHATA_CONSISTENCY", status: "PASS", message: "Khata KH-782 matched." },
      { check: "AREA_CONSISTENCY", status: "WARN", message: "Area differs between RoR (2.50 ha) and GIS (2.20 ha)." },
      { check: "MUTATION_CONTINUITY", status: "PASS", message: "2021 sale followed by mutation MUT-2021-412." },
      { check: "REGISTRATION_CONSISTENCY", status: "PASS", message: "Stamp duty and registration authenticated." },
      { check: "HISTORICAL_CONTINUITY", status: "WARN", message: "1998-2007 ownership lineage gap." },
      { check: "TEXT_GIS_CONSISTENCY", status: "FAIL", message: "42 sq m overlap with Govt Nala easement." },
      { check: "DUPLICATE_DETECTION", status: "PASS", message: "Zero duplicate filings found." },
      { check: "DISPUTE_STATUS", status: "FAIL", message: "Pending Revenue Court case CS-2023-889." },
    ],
  },
];