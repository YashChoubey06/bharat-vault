export const LOCATION_HIERARCHY = {
  "Rajasthan": {
    "Kota": ["Ladpura", "Sangod", "Digod", "Ramganj Mandi"],
    "Jaipur": ["Sanganer", "Amer", "Chaksu", "Kotputli"],
    "Udaipur": ["Girwa", "Mavli", "Salumbar", "Vallabhnagar"],
    "Jodhpur": ["Luni", "Phalodi", "Osian", "Shergarh"],
  },
  "Madhya Pradesh": {
    "Bhopal": ["Huzur", "Berasia"],
    "Indore": ["Indore", "Depalpur", "Sanwer", "Mhow"],
    "Gwalior": ["Gwalior", "Dabra", "Bhantar"],
  },
  "Maharashtra": {
    "Pune": ["Haveli", "Khed", "Ambegaon", "Baramati"],
    "Nagpur": ["Nagpur Urban", "Nagpur Rural", "Kamptee"],
    "Nashik": ["Nashik", "Niphad", "Sinnar"],
  },
  "Uttar Pradesh": {
    "Lucknow": ["Lucknow", "Mohanlalganj", "Bakshi Ka Talab"],
    "Varanasi": ["Varanasi", "Pindra", "Raja Talab"],
  },
};

export const getAvailableStates = () => Object.keys(LOCATION_HIERARCHY);

export const getAvailableDistricts = (stateName) => {
  if (!stateName || !LOCATION_HIERARCHY[stateName]) return [];
  return Object.keys(LOCATION_HIERARCHY[stateName]);
};

export const getAvailableTehsils = (stateName, districtName) => {
  if (!stateName || !districtName || !LOCATION_HIERARCHY[stateName]?.[districtName]) return [];
  return LOCATION_HIERARCHY[stateName][districtName];
};
