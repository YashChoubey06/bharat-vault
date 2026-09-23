import React, { useState } from 'react';
import { Search, Building, Navigation, AlertTriangle, CheckCircle, X, Layers, User } from 'lucide-react';
import { TRANSLATIONS } from './mockStudioData';

export default function BuildingDirectoryPanel({
  currentDataset,
  activeBuildingId,
  onSelectBuilding,
  onFlyCamera,
  language,
  isOpen: controlledIsOpen,
  onClose,
  onOpen
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const buildings = currentDataset?.buildings || [];

  const filteredBuildings = buildings.filter(
    (b) =>
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.osmId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owners.some((o) => o.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleOpen = (openState) => {
    setInternalIsOpen(openState);
    if (openState && onOpen) onOpen();
    if (!openState && onClose) onClose();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => handleToggleOpen(true)}
        className="absolute top-4 right-4 z-20 glass-panel bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl hover:bg-white text-slate-800 font-semibold text-xs flex items-center space-x-2 border border-slate-200 cursor-pointer transition-all active:scale-95"
      >
        <Building className="w-4 h-4 text-blue-600" />
        <span>Open Building Directory</span>
      </button>
    );
  }

  return (
    <div className="absolute top-4 right-4 z-20 w-80 max-h-[calc(100vh-7rem)] glass-panel rounded-2xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>{t.buildingDirectory}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {buildings.length} buildings extracted & plotted
          </div>
        </div>
        <button
          onClick={() => handleToggleOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-slate-200/60 bg-white/60">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlotPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Building Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredBuildings.map((bldg) => {
          const isSelected = activeBuildingId === bldg.id;
          return (
            <div
              key={bldg.id}
              onClick={() => onSelectBuilding(bldg.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'bg-white/80 border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Top Row: Building ID + Fly Camera button */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900 font-mono tracking-tight">
                    {bldg.id}
                  </div>
                  <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-blue-100/70 text-blue-700 rounded text-[10px] font-semibold mt-1">
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                    <span>{bldg.osmId}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlyCamera(bldg.id);
                  }}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-sm"
                  title="Fly Camera to Building"
                >
                  <Navigation className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Details & Footprint */}
              <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center space-x-1">
                  <span>📍 {bldg.address} • </span>
                  <span className="font-semibold text-slate-800">{bldg.footprint} m²</span>
                </div>

                <div className="flex items-center space-x-3 font-semibold text-slate-800">
                  <span className="flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    <span>{bldg.floorsCount} {t.floors}</span>
                  </span>
                  <span>• {bldg.unitsCount} {t.units}</span>
                </div>
              </div>

              {/* Status Flag & Owner names */}
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1 text-[11px] text-slate-700 truncate max-w-[180px]">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">Owner: <strong className="text-slate-900">{bldg.owners.join(', ')}</strong></span>
                </div>

                {bldg.isDisputed && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded flex items-center space-x-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Disputed</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
