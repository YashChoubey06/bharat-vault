import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Building,
  UserCheck,
  AlertTriangle,
  ExternalLink,
  MapPin,
  FileText
} from 'lucide-react';

export default function UnitDetailsDrawer({
  floorData,
  bldgData,
  onClose,
  onNavigateToDatabase,
  onOpenReachCitizenModal
}) {
  const [copied, setCopied] = useState(false);

  if (!floorData || !bldgData) return null;

  const handleCopyUlpin = () => {
    if (floorData.ulpin) {
      navigator.clipboard.writeText(floorData.ulpin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 z-30 w-96 glass-panel rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in slide-in-from-bottom duration-300">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 text-white flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-blue-400">{bldgData.id}</span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
              style={{ backgroundColor: floorData.color || '#3b82f6' }}
            >
              {floorData.classification}
            </span>
          </div>
          <h3 className="font-bold text-base text-white mt-1">{floorData.label}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Drawer Body */}
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* 14-Digit Bhu-Aadhaar ULPIN Box */}
        <div className="p-3 bg-blue-50/90 rounded-xl border border-blue-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              14-DIGIT BHU-AADHAAR ULPIN
            </div>
            <div className="font-mono font-extrabold text-slate-900 text-sm mt-0.5">
              {floorData.ulpin}
            </div>
          </div>
          <button
            onClick={handleCopyUlpin}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Disputed Warning Banner */}
        {bldgData.isDisputed && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 space-y-1">
            <div className="font-bold text-xs flex items-center space-x-1.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Boundary / Title Dispute Flagged</span>
            </div>
            <p className="text-[11px] text-amber-700">
              {bldgData.disputedReason || 'Dispute claim registered at Tehsil office.'}
            </p>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-100/80 rounded-xl">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Khasra Number</div>
            <div className="font-bold text-slate-800 font-mono mt-0.5">{floorData.khasra}</div>
          </div>

          <div className="p-2.5 bg-slate-100/80 rounded-xl">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Survey Number</div>
            <div className="font-bold text-slate-800 font-mono mt-0.5">{floorData.surveyNo}</div>
          </div>

          <div className="p-2.5 bg-slate-100/80 rounded-xl">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">Floor Footprint Area</div>
            <div className="font-bold text-slate-800 mt-0.5">{floorData.area} m²</div>
          </div>

          <div className="p-2.5 bg-slate-100/80 rounded-xl">
            <div className="text-[10px] text-slate-500 font-semibold uppercase">e-KYC Status</div>
            <div className="font-bold text-emerald-700 flex items-center space-x-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Auth OK</span>
            </div>
          </div>
        </div>

        {/* Owner & Aadhaar Card */}
        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            PRIMARY TITLE HOLDER
          </div>
          <div className="font-bold text-sm text-slate-900">{floorData.ownerName}</div>
          <div className="text-xs text-slate-500 font-mono flex items-center space-x-2 pt-0.5">
            <span>Aadhaar: {floorData.aadhaar}</span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
              UIDAI Certified
            </span>
          </div>
        </div>

        {/* DILRMP Sync Info */}
        <div className="p-3 bg-slate-100/80 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-semibold text-slate-800">DILRMP-MIS Transaction</div>
              <div className="text-[11px] font-mono text-slate-500">{floorData.transactionId}</div>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
              floorData.dilrmpSynced
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {floorData.dilrmpSynced ? 'Synced' : 'Pending'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => onOpenReachCitizenModal(floorData)}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>Reach Citizen (Field Navigation & QR)</span>
          </button>

          <button
            onClick={onNavigateToDatabase}
            className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Inspect Title Record in Database</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
