import React from 'react';
import { SlidersHorizontal, RotateCcw, Filter, Layers } from 'lucide-react';
import { TRANSLATIONS } from './mockStudioData';

export default function FloorControlsBar({
  explodedView,
  setExplodedView,
  isolatedFloor,
  setIsolatedFloor,
  language
}) {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-2xl p-3 shadow-2xl border border-slate-200/90 flex items-center space-x-6">
      {/* Title Badge */}
      <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs pl-2 border-r border-slate-200 pr-4">
        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
        <span>3D Floor Controls</span>
        <button
          onClick={() => {
            setExplodedView(0);
            setIsolatedFloor('all');
          }}
          className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors ml-1"
          title="Reset floor controls"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Exploded View Slider */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-xs text-slate-700 font-semibold">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{t.explodedView}</span>
          <span className="text-blue-600 font-bold font-mono text-[11px] ml-1">
            {explodedView}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <input
            type="range"
            min="0"
            max="100"
            value={explodedView}
            onChange={(e) => setExplodedView(parseInt(e.target.value, 10))}
            className="w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between w-full text-[9px] text-slate-400 font-bold tracking-wider uppercase mt-1">
            <span>COLLAPSED</span>
            <span>SEPARATED</span>
          </div>
        </div>
      </div>

      {/* Floor Isolator Dropdown */}
      <div className="flex items-center space-x-2 border-l border-slate-200 pl-4 pr-1">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-xs text-slate-700 font-semibold">{t.floorIsolator}</span>
        <select
          value={isolatedFloor}
          onChange={(e) => setIsolatedFloor(e.target.value)}
          className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="all">{t.allFloors} (3 levels)</option>
          <option value="0">{t.groundFloor}</option>
          <option value="1">{t.floor1}</option>
          <option value="2">{t.floor2}</option>
        </select>
      </div>
    </div>
  );
}
