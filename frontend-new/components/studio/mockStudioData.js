export const TRANSLATIONS = {
  en: {
    buildingDirectory: 'Building Directory',
    searchPlotPlaceholder: 'Search Plot ID, Owner, Address...',
    floors: 'Floors',
    units: 'Units',
    legendTitle: 'Classification Legend',
    agricultural: 'Agricultural',
    residential: 'Residential',
    commercial: 'Commercial',
    industrial: 'Industrial',
    vacant: 'Vacant',
    explodedView: 'Exploded View',
    floorIsolator: 'Floor Isolator',
    allFloors: 'All Floors',
    groundFloor: 'Ground Floor (0)',
    floor1: 'First Floor (1)',
    floor2: 'Second Floor (2)'
  },
  hi: {
    buildingDirectory: 'भवन निर्देशिका',
    searchPlotPlaceholder: 'प्लॉट आईडी, मालिक, पता खोजें...',
    floors: 'मंजिलें',
    units: 'इकाइयां',
    legendTitle: 'वर्गीकरण किंवदंती',
    agricultural: 'कृषि',
    residential: 'आवासीय',
    commercial: 'व्यावसायिक',
    industrial: 'औद्योगिक',
    vacant: 'खाली',
    explodedView: 'विस्फोट दृश्य',
    floorIsolator: 'मंजिल पृथक्कारी',
    allFloors: 'सभी मंजिलें',
    groundFloor: 'भूतल (0)',
    floor1: 'पहली मंजिल (1)',
    floor2: 'दूसरी मंजिल (2)'
  }
};

export const LAND_DATASETS = [
  {
    id: 'svamitwa-drone',
    name: 'SVAMITVA Drone Dataset',
    subtitle: 'Kadugodi, Bengaluru East',
    location: 'Kadugodi, Bengaluru East',
    bldgsCount: 4,
    unitsCount: 9,
    coordinates: { lat: 12.9982, lng: 77.7607 },
    buildings: [
      {
        id: 'SVAMITVA-KA-BLR-0042-01',
        osmId: 'OSM #1042001',
        address: 'Kadugodi, Bengaluru East',
        footprint: 420.5,
        floorsCount: 3,
        unitsCount: 4,
        status: 'verified',
        isDisputed: false,
        owners: ['Ramesh Kumar Sharma', 'Meera Ramesh Sharma (+2 more)'],
        floors: [
          {
            floorNumber: 0,
            label: 'Ground Floor (Unit G-01)',
            classification: 'Commercial',
            color: '#3b82f6',
            ulpin: '1482-9014-4819',
            transactionId: 'TXN-2024-BLR-89102',
            khasra: 'KH-124-1A',
            surveyNo: 'Sy. No. 124/1',
            area: 140.2,
            ownerName: 'Ramesh Kumar Sharma',
            aadhaar: 'XXXX-XXXX-8492',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Kadugodi Main Road, Bengaluru',
            disputedReason: null
          },
          {
            floorNumber: 1,
            label: 'Floor 1 (Unit 1-01)',
            classification: 'Residential',
            color: '#f97316',
            ulpin: '1482-9014-4820',
            transactionId: 'TXN-2024-BLR-89103',
            khasra: 'KH-124-1B',
            surveyNo: 'Sy. No. 124/1',
            area: 140.1,
            ownerName: 'Meera Ramesh Sharma',
            aadhaar: 'XXXX-XXXX-3829',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Kadugodi, Bengaluru',
            disputedReason: null
          },
          {
            floorNumber: 2,
            label: 'Floor 2 (Unit 2-01 & 2-02)',
            classification: 'Residential',
            color: '#f97316',
            ulpin: '1482-9014-4821',
            transactionId: 'TXN-2024-BLR-89104',
            khasra: 'KH-124-1C',
            surveyNo: 'Sy. No. 124/1',
            area: 140.2,
            ownerName: 'Suresh Kumar Sharma',
            aadhaar: 'XXXX-XXXX-7120',
            aadhaarVerified: true,
            dilrmpSynced: false,
            locality: 'Kadugodi, Bengaluru',
            disputedReason: null
          }
        ]
      },
      {
        id: 'SVAMITVA-KA-BLR-0042-02',
        osmId: 'OSM #1042002',
        address: 'Kadugodi, Bengaluru East',
        footprint: 580.0,
        floorsCount: 2,
        unitsCount: 2,
        status: 'disputed',
        isDisputed: true,
        disputedReason: 'Boundary overlap detected with adjacent Khasra 125/2. Title claim pending in Sub-Registrar Court.',
        owners: ['Vijay M. Hegde', 'Anand K. Hegde'],
        floors: [
          {
            floorNumber: 0,
            label: 'Ground Floor (Industrial Workshop)',
            classification: 'Industrial',
            color: '#a855f7',
            ulpin: '8492-3019-1102',
            transactionId: 'TXN-2024-BLR-99011',
            khasra: 'KH-125-2A',
            surveyNo: 'Sy. No. 125/2',
            area: 290.0,
            ownerName: 'Vijay M. Hegde',
            aadhaar: 'XXXX-XXXX-9912',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Kadugodi Industrial Area',
            disputedReason: 'Boundary mismatch (+1.4m south boundary)'
          },
          {
            floorNumber: 1,
            label: 'Floor 1 (Storage Unit)',
            classification: 'Industrial',
            color: '#a855f7',
            ulpin: '8492-3019-1103',
            transactionId: 'TXN-2024-BLR-99012',
            khasra: 'KH-125-2B',
            surveyNo: 'Sy. No. 125/2',
            area: 290.0,
            ownerName: 'Anand K. Hegde',
            aadhaar: 'XXXX-XXXX-4410',
            aadhaarVerified: false,
            dilrmpSynced: false,
            locality: 'Kadugodi Industrial Area',
            disputedReason: 'Ownership verification pending UIDAI e-KYC'
          }
        ]
      },
      {
        id: 'SVAMITVA-KA-BLR-0042-03',
        osmId: 'OSM #1042003',
        address: 'Kadugodi, Bengaluru East',
        footprint: 310.2,
        floorsCount: 1,
        unitsCount: 1,
        status: 'verified',
        isDisputed: false,
        owners: ['Gram Panchayat Land'],
        floors: [
          {
            floorNumber: 0,
            label: 'Ground Floor (Community Hall)',
            classification: 'Vacant',
            color: '#64748b',
            ulpin: '9012-4419-0012',
            transactionId: 'TXN-2024-BLR-0001',
            khasra: 'KH-126-GP',
            surveyNo: 'Sy. No. 126',
            area: 310.2,
            ownerName: 'Gram Panchayat Kadugodi',
            aadhaar: 'GOVT-AUTH-GP-001',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Panchayat Circle, Kadugodi',
            disputedReason: null
          }
        ]
      },
      {
        id: 'SVAMITVA-KA-BLR-0042-04',
        osmId: 'OSM #1042004',
        address: 'Kadugodi, Bengaluru East',
        footprint: 650.0,
        floorsCount: 2,
        unitsCount: 2,
        status: 'verified',
        isDisputed: false,
        owners: ['Prakash Chandra Rao', 'Lakshmi P. Rao'],
        floors: [
          {
            floorNumber: 0,
            label: 'Ground Floor (Agricultural Seed Store)',
            classification: 'Agricultural',
            color: '#22c55e',
            ulpin: '7721-0091-3321',
            transactionId: 'TXN-2024-BLR-77810',
            khasra: 'KH-127-1',
            surveyNo: 'Sy. No. 127',
            area: 325.0,
            ownerName: 'Prakash Chandra Rao',
            aadhaar: 'XXXX-XXXX-9102',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Kadugodi Farm Greenbelt',
            disputedReason: null
          },
          {
            floorNumber: 1,
            label: 'Floor 1 (Farmer Residence)',
            classification: 'Residential',
            color: '#f97316',
            ulpin: '7721-0091-3322',
            transactionId: 'TXN-2024-BLR-77811',
            khasra: 'KH-127-1F',
            surveyNo: 'Sy. No. 127',
            area: 325.0,
            ownerName: 'Lakshmi P. Rao',
            aadhaar: 'XXXX-XXXX-1192',
            aadhaarVerified: true,
            dilrmpSynced: true,
            locality: 'Kadugodi Farm Greenbelt',
            disputedReason: null
          }
        ]
      }
    ]
  },
  {
    id: 'bhoomi-ror',
    name: 'Bhoomi RoR 3-Complex',
    subtitle: '3 buildings · 12 units',
    location: 'Whitefield, Bengaluru East',
    bldgsCount: 3,
    unitsCount: 12,
    coordinates: { lat: 12.9698, lng: 77.7499 },
    buildings: [
      {
        id: 'BHOOMI-KA-WF-001',
        osmId: 'OSM #209101',
        address: 'Whitefield Main Road',
        footprint: 720.0,
        floorsCount: 4,
        unitsCount: 4,
        status: 'verified',
        isDisputed: false,
        owners: ['Kavitha Narayanan', 'Rohan Narayanan'],
        floors: [
          { floorNumber: 0, label: 'Ground Floor (Retail)', classification: 'Commercial', color: '#3b82f6', ulpin: '3310-9182-4412', khasra: 'KH-88-1', surveyNo: 'Sy. No. 88', area: 180, ownerName: 'Kavitha Narayanan', aadhaarVerified: true, dilrmpSynced: true, locality: 'Whitefield Main Road' },
          { floorNumber: 1, label: 'Floor 1 (Office Space)', classification: 'Commercial', color: '#3b82f6', ulpin: '3310-9182-4413', khasra: 'KH-88-2', surveyNo: 'Sy. No. 88', area: 180, ownerName: 'Rohan Narayanan', aadhaarVerified: true, dilrmpSynced: true, locality: 'Whitefield Main Road' },
          { floorNumber: 2, label: 'Floor 2 (Residential)', classification: 'Residential', color: '#f97316', ulpin: '3310-9182-4414', khasra: 'KH-88-3', surveyNo: 'Sy. No. 88', area: 180, ownerName: 'Kavitha Narayanan', aadhaarVerified: true, dilrmpSynced: true, locality: 'Whitefield Main Road' },
          { floorNumber: 3, label: 'Floor 3 (Penthouse)', classification: 'Residential', color: '#f97316', ulpin: '3310-9182-4415', khasra: 'KH-88-4', surveyNo: 'Sy. No. 88', area: 180, ownerName: 'Rohan Narayanan', aadhaarVerified: true, dilrmpSynced: true, locality: 'Whitefield Main Road' }
        ]
      }
    ]
  }
];
