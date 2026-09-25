"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { getParcels } from '@/services/api/parcels';
import ClassificationLegend from '@/components/studio/ClassificationLegend';
import BuildingDirectoryPanel from '@/components/studio/BuildingDirectoryPanel';
import FloorControlsBar from '@/components/studio/FloorControlsBar';
import UnitDetailsDrawer from '@/components/studio/UnitDetailsDrawer';
import {
  MapPin,
  Search,
  Globe,
  RotateCcw,
  PanelLeft,
  ChevronDown,
  Building
} from 'lucide-react';

const DynamicThreeCanvas = dynamic(
  () => import('@/components/studio/ThreeCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xs font-medium text-slate-600">Loading 3D Studio Cadastral WebGL Engine...</div>
      </div>
    )
  }
);

export default function StudioPage() {
  const router = useRouter();
  const [navSidebarOpen, setNavSidebarOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [datasetError, setDatasetError] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  useEffect(() => {
    getParcels().then(parcels => {
      const data = parcels.filter(p => p.gis?.geometry?.type === "Polygon").map(p => {
        const ring = p.gis.geometry.coordinates[0];
        return {parcel:p,id:p.id,name:`${p.id} · ${p.surveyNumber}`,location:p.gis.source || p.village?.name,
          coordinates:{lng:ring[0][0],lat:ring[0][1]}, geometry:p.gis.geometry, buildings:[],bldgsCount:0,unitsCount:0};
      });
      setDatasets(data); setSelectedDatasetId(data[0]?.id || "");
    }).catch(err => setDatasetError(err.message));
  }, []);
  const [activeBuildingId, setActiveBuildingId] = useState(null);
  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [explodedView, setExplodedView] = useState(0);
  const [isolatedFloor, setIsolatedFloor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [aadhaarMode, setAadhaarMode] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [showBuildingDirectory, setShowBuildingDirectory] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState(null);
  const [language, setLanguage] = useState('en');

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || {id:"empty",location:datasetError || "No saved GIS geometry",buildings:[],coordinates:{lng:78.9,lat:20.6}};
  const activeBuilding = currentDataset.buildings.find((b) => b.id === activeBuildingId);
  const activeFloor = activeBuilding && activeFloorIndex !== null ? activeBuilding.floors[activeFloorIndex] : null;

  const handleSelectBuildingFloor = (bldgId, floorIndex = 0) => {
    setActiveBuildingId(bldgId);
    setActiveFloorIndex(floorIndex);
    setFlyToTarget(bldgId);
  };

  const handleSelectBuildingOnly = (bldgId) => {
    setActiveBuildingId(bldgId);
    setActiveFloorIndex(0);
    setFlyToTarget(bldgId);
  };

  const handleFlyCamera = (bldgId) => {
    setFlyToTarget(bldgId);
  };

  return (
    <div className="relative w-full h-screen bg-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Platform Navigation Sidebar Drawer */}
      {navSidebarOpen && (
        <Sidebar
          mobileOpen={true}
          onClose={() => setNavSidebarOpen(false)}
        />
      )}

      {/* Top Header Navbar */}
      <header className="w-full bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Left Title & Location Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setNavSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95 cursor-pointer transition-all border border-transparent hover:border-blue-200"
            title="Open Platform Navigation Sidebar"
          >
            <PanelLeft size={18} />
          </button>

          <h1 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            3D Studio
          </h1>

          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-full text-xs font-semibold">
            <MapPin size={12} className="text-blue-500 shrink-0" />
            <span>{currentDataset.location}</span>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          {/* Dataset Switcher Dropdown */}
          <select
            value={selectedDatasetId}
            onChange={(e) => {
              setSelectedDatasetId(e.target.value);
              setActiveBuildingId(null);
              setActiveFloorIndex(null);
            }}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 rounded-lg px-2.5 py-1 outline-none cursor-pointer transition-colors hidden md:block"
          >
            {datasets.filter(ds => `${ds.name} ${ds.parcel.currentRecordedOwner || ""}`.toLowerCase().includes(searchQuery.toLowerCase())).map((ds) => (
              <option key={ds.id} value={ds.id}>
                {ds.name}
              </option>
            ))}
          </select>
        </div>

        {/* Center Search Input Bar */}
        <div className="flex items-center space-x-2 bg-slate-100/90 hover:bg-slate-100 border border-slate-200 rounded-full px-3.5 py-1 flex-1 max-w-md mx-4 shadow-inner transition-all">
          <Search size={15} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter parcels by ID, survey or recorded owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none px-1"
          />

        </div>

        {/* Right Language, Building Directory & Control Tools */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowBuildingDirectory(!showBuildingDirectory)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all border ${
              showBuildingDirectory
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700'
            }`}
            title="Toggle Building Directory Side Panel"
          >
            <Building size={13} />
            <span>Building Directory</span>
          </button>

          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Globe size={13} className="text-slate-500" />
            <span>{language === 'en' ? 'English' : 'हिंदी'}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </button>

          <button
            onClick={() => {
              setExplodedView(0);
              setIsolatedFloor('all');
              setActiveBuildingId(null);
              setActiveFloorIndex(0);
            }}
            className="bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 p-2 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            title="Reset Map State"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Container */}
      <div className="relative w-full flex-1 overflow-hidden">
        <DynamicThreeCanvas
          selectedDataset={currentDataset}
          activeBuildingId={activeBuildingId}
          activeFloorIndex={activeFloorIndex}
          explodedView={explodedView}
          isolatedFloor={isolatedFloor}
          onSelectBuildingFloor={handleSelectBuildingFloor}
          flyToTarget={flyToTarget}
        />

        {currentDataset.parcel && (
          <section className="absolute top-4 left-4 z-20 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            <h2 className="font-bold text-slate-900">Parcel details</h2>
            <dl className="mt-3 space-y-2 text-sm text-slate-700">
              <dt>Parcel / survey</dt><dd>{currentDataset.name}</dd>
              <dt>Recorded owner</dt><dd>{currentDataset.parcel.currentRecordedOwner || "Not recorded"}</dd>
              <dt>Recorded area</dt><dd>{currentDataset.parcel.recordedArea ?? "Not recorded"} ha</dd>
            </dl>
            <p className="mt-3 text-xs text-slate-500">{currentDataset.location}. Building and floor ownership data has not been supplied. Map imagery does not contain ownership records.</p>
            <button className="mt-3 text-sm text-blue-600 underline" onClick={() => router.push(`/records/${currentDataset.id}`)}>Open parcel evidence</button>
          </section>
        )}
        {/* Floating Classification Legend - Left (Top Left) */}
        {showLegend && currentDataset.buildings.length > 0 && !activeFloor && (
          <ClassificationLegend language={language} />
        )}

        {/* Selected Floor Inspection Drawer - Left */}
        {activeFloor && (
          <UnitDetailsDrawer
            floorData={activeFloor}
            bldgData={activeBuilding}
            onClose={() => {
              setActiveBuildingId(null);
              setActiveFloorIndex(null);
            }}
            onNavigateToDatabase={() => router.push('/records')}
            onOpenReachCitizenModal={(floor) => {
              router.push('/records');
            }}
          />
        )}

        {/* Floating Building Directory Drawer - Right (Top Right) */}
        <BuildingDirectoryPanel
          currentDataset={currentDataset}
          activeBuildingId={activeBuildingId}
          onSelectBuilding={handleSelectBuildingOnly}
          onFlyCamera={handleFlyCamera}
          language={language}
          isOpen={showBuildingDirectory}
          onOpen={() => setShowBuildingDirectory(true)}
          onClose={() => setShowBuildingDirectory(false)}
        />

        {/* Floating Bottom 3D Floor Controls Bar (Bottom Center) */}
        {currentDataset.buildings.length > 0 && <FloorControlsBar
          explodedView={explodedView}
          setExplodedView={setExplodedView}
          isolatedFloor={isolatedFloor}
          setIsolatedFloor={setIsolatedFloor}
          language={language}
        />}
      </div>
    </div>
  );
}
