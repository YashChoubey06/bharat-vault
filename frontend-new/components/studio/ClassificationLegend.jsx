import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Info } from 'lucide-react';
import { TRANSLATIONS } from './mockStudioData';

export default function ClassificationLegend({ language }) {
  const [collapsed, setCollapsed] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const legendItems = [
    { label: t.agricultural, color: '#22c55e' },
    { label: t.residential, color: '#f97316' },
    { label: t.commercial, color: '#3b82f6' },
    { label: t.industrial, color: '#a855f7' },
    { label: t.vacant, color: '#64748b' }
  ];

  return (
    <div className="absolute top-4 left-4 z-20 w-72 glass-panel rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden transition-all">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="p-3.5 bg-slate-100/80 flex items-center justify-between cursor-pointer hover:bg-slate-200/60 transition-colors border-b border-slate-200/60"
      >
        <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs tracking-tight">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>{t.legendTitle}</span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-slate-500" />
        ) : (
          <ChevronUp className="w-4 h-4 text-slate-500" />
        )}
      </div>

      {!collapsed && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Legend Items Grid */}
          <div className="grid grid-cols-2 gap-2">
            {legendItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0 shadow-sm"
                  style={{ backgroundColor: item.color }}
                ></span>
                <span className="text-slate-700 font-medium text-[11px]">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Data Simulation Tag Card */}
          <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200/60 space-y-1">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center space-x-1">
              <span>DATA SIMULATION TAG</span>
            </div>
            <div className="font-mono text-[11px] text-blue-900 font-semibold">
              is_synthetic: true
            </div>
            <div className="text-[10px] text-blue-600">
              Semi-translucent floor (0 units)
            </div>
          </div>

          {/* Stacking Formula Note */}
          <div className="flex items-start space-x-1.5 text-[10px] text-slate-500 pt-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>Vertical stacking = floor_number × floor_height_m</span>
          </div>
        </div>
      )}
    </div>
  );
}
