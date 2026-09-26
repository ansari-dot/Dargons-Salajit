import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { TopLocation } from '../../types';

interface TopLocationsProps {
  locations: TopLocation[];
}

export const TopLocations: React.FC<TopLocationsProps> = ({ locations }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Locations</h3>
          <p className="text-[11px] text-slate-400 font-medium">Customer geography & order origin</p>
        </div>
        <Link
          to="/reports"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Map visualization */}
      <div className="relative flex-1 min-h-[140px] flex items-center justify-center py-2">
        <div className="relative w-full max-w-[280px] h-[120px] flex items-center justify-center">
          {/* Stylized world vector outline */}
          <svg
            viewBox="0 0 400 200"
            className="w-full h-full text-slate-200 fill-current opacity-80"
          >
            {/* North America */}
            <path d="M40,30 Q60,25 90,40 Q110,60 80,90 Q50,90 35,60 Z" />
            <path d="M70,90 Q90,100 100,120 Q80,140 60,110 Z" />
            {/* South America */}
            <path d="M100,120 Q120,130 115,165 Q95,190 90,150 Z" />
            {/* Europe */}
            <path d="M190,30 Q220,25 230,50 Q200,65 185,45 Z" />
            <path d="M170,40 Q180,35 185,45 Q175,55 170,40 Z" />
            {/* Africa */}
            <path d="M185,65 Q230,70 235,115 Q210,160 190,110 Z" />
            {/* Asia */}
            <path d="M230,30 Q310,20 340,65 Q310,110 260,85 Q240,60 230,30 Z" />
            <path d="M260,85 Q290,95 285,130 Q270,140 255,110 Z" />
            {/* Australia */}
            <path d="M320,130 Q355,125 360,155 Q330,170 315,145 Z" />
          </svg>

          {/* Pakistan Pulsing Node */}
          <div className="absolute top-[38%] left-[64%] -translate-x-1/2 -translate-y-1/2 group">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white shadow-sm"></span>
            </span>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded-md font-semibold whitespace-nowrap shadow-md z-20">
              Pakistan (18%)
            </div>
          </div>

          {/* Saudi Arabia Node */}
          <div className="absolute top-[48%] left-[54%] -translate-x-1/2 -translate-y-1/2 group">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-white shadow-sm"></span>
            </span>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded-md font-semibold whitespace-nowrap shadow-md z-20">
              Saudi Arabia (18%)
            </div>
          </div>

          {/* UAE Node */}
          <div className="absolute top-[46%] left-[58%] -translate-x-1/2 -translate-y-1/2 group">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500 ring-2 ring-white shadow-sm"></span>
            </span>
            <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] rounded-md font-semibold whitespace-nowrap shadow-md z-20">
              UAE (18%)
            </div>
          </div>
        </div>
      </div>

      {/* Legend list at bottom */}
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 pt-2 border-t border-slate-50 text-xs">
        {locations.map((loc) => (
          <div key={loc.id} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: loc.color }}
              />
              <span className="text-slate-600 text-[11px] font-medium truncate">
                {loc.country}
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-800">
              {loc.percentage}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
