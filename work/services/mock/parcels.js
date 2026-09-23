import {
  parcels,
  villages,
  owners,
  registrations,
  mutations,
  gis,
  courtCases,
  riskScores,
  ownershipHistory,
} from "./data";

export async function getParcels() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return parcels.map((parcel) => ({
    ...parcel,
    village: villages.find(
      (village) => village.id === parcel.villageId
    ),
    owner: owners.find(
      (owner) => owner.id === parcel.currentRecordedOwnerId
    ),
  }));
}

export async function getParcelById(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const cleanId = String(parcelId || "").trim();
  const cleanDigits = cleanId.replace(/\D/g, "");

  let parcel = parcels.find(
    (item) =>
      item.id.toLowerCase() === cleanId.toLowerCase() ||
      (cleanDigits && item.id.replace(/\D/g, "") === cleanDigits)
  );

  if (!parcel) {
    parcel = parcels[0] || {
      id: cleanId || "PRC-001",
      surveyNumber: "124/3",
      khataNumber: "KH-782",
      villageId: "VIL-001",
      landClassification: "Agricultural",
      recordedArea: 2.5,
      areaUnit: "hectare",
      currentRecordedOwnerId: "OWN-003",
      currentRecordedOwner: "Suresh Kumar",
      recordStatus: "REVIEW_REQUIRED",
      recordHealth: 87,
      riskScore: 72,
      riskLevel: "HIGH",
    };
  }

  const pId = parcel.id;

  return {
    ...parcel,

    village: villages.find(
      (village) => village.id === parcel.villageId
    ) || villages[0],

    owner: owners.find(
      (owner) => owner.id === parcel.currentRecordedOwnerId
    ) || owners[0] || { name: parcel.currentRecordedOwner || "Suresh Kumar" },

    registration: registrations.find(
      (item) => item.parcelId === pId
    ) || registrations[0] || {
      id: "REG-2021-094",
      area: 2.45,
      seller: "Ramesh Kumar",
      buyer: parcel.currentRecordedOwner || "Suresh Kumar",
      date: "14 Jan 2021",
    },

    mutation: mutations.find(
      (item) => item.parcelId === pId
    ) || mutations[0] || {
      id: "MUT-2021-412",
      type: "Sale Deed Mutation",
      status: "APPROVED",
      date: "02 Feb 2021",
    },

    gis: gis.find(
      (item) => item.parcelId === pId
    ) || gis[0] || {
      id: "GIS-124-2025",
      area: 2.20,
      source: "High-Res Satellite Survey 2025",
      updatedAt: "2025-01-10",
    },

    courtCase: courtCases.find(
      (item) => item.parcelId === pId
    ) || courtCases[0] || {
      id: "CC-2023-889",
      caseNumber: "CS-2023-889",
      caseType: "Ownership Title Dispute",
      court: "District Court, Kota",
      courtName: "District Revenue Court, Kota",
      status: "Pending Hearing",
      filedDate: "2023-04-12",
    },

    risk: riskScores.find(
      (item) => item.parcelId === pId
    ) || riskScores[0] || {
      parcelId: pId,
      score: parcel.riskScore || 72,
      level: parcel.riskLevel || "HIGH",
      factors: [
        { factor: "Area mismatch across RoR and GIS", impact: 25 },
        { factor: "Title continuity gap", impact: 20 },
      ],
    },

    ownershipHistory: ownershipHistory.find(
      (item) => item.parcelId === pId
    ) || ownershipHistory[0] || {
      parcelId: pId,
      history: [
        { id: 1, ownerName: parcel.currentRecordedOwner || "Suresh Kumar", date: "2021 - Present" },
        { id: 2, ownerName: "Ramesh Kumar", date: "2010 - 2021" },
      ],
    },
  };
}

export async function searchParcels(searchTerm) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const term = searchTerm.trim().toLowerCase();

  if (!term) {
    return getParcels();
  }

  const results = parcels.filter((parcel) => {
    return (
      parcel.id.toLowerCase().includes(term) ||
      parcel.surveyNumber.toLowerCase().includes(term) ||
      parcel.khataNumber.toLowerCase().includes(term) ||
      parcel.currentRecordedOwner?.toLowerCase().includes(term)
    );
  });

  return results;
}
