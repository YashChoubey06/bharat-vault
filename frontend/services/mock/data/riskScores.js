export const riskScores = [
  {
    parcelId: "PRC-001",
    overallRisk: 87,
    riskScore: 87,
    maxScore: 100,
    riskLevel: "HIGH",
    recordHealth: 87,
    factors: [
      { name: "Area inconsistency", points: 25, impact: 25 },
      { name: "Ownership inconsistency", points: 20, impact: 20 },
      { name: "Dispute", points: 30, impact: 30 },
      { name: "Historical gap", points: 12, impact: 12 },
    ],
    total: 87,
    recommendation: "Prioritize this record for officer investigation.",
  },
];

export const defaultRiskExplanation = {
  overallRisk: 87,
  maxScore: 100,
  factors: [
    { name: "Area inconsistency", points: 25 },
    { name: "Ownership inconsistency", points: 20 },
    { name: "Dispute", points: 30 },
    { name: "Historical gap", points: 12 },
  ],
  total: 87,
  recommendation: "Prioritize this record for officer investigation.",
};