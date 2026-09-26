import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProductPromoCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-slate-900 text-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col justify-between min-h-[140px] group">
      {/* Background Himalayan Mountain Image */}
      <img
        src="https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1000&q=80"
        alt="Majestic Himalayas"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-60 group-hover:scale-105 transition-transform duration-700"
        referrerPolicy="no-referrer"
      />

      {/* Shilajit luxury jars and packaging overlay asset on the right */}
      <div className="absolute right-4 bottom-2 top-2 w-44 pointer-events-none hidden sm:flex items-center justify-end z-10 opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="relative flex items-end">
          {/* Jar 1 (Box) */}
          <div className="w-16 h-20 rounded-md bg-stone-900 border border-amber-600/40 shadow-2xl flex flex-col items-center justify-center p-1 text-center -mr-3 z-0">
            <span className="text-[7px] tracking-widest text-amber-400 font-serif font-bold uppercase">SALAJIT</span>
            <span className="text-[5px] text-stone-400 uppercase tracking-tight">Himalayan Resin</span>
          </div>
          {/* Jar 2 (Glass Jar) */}
          <div className="w-18 h-18 rounded-full bg-gradient-to-b from-stone-800 to-black border-2 border-amber-500/50 shadow-2xl flex flex-col items-center justify-center p-1 text-center z-10">
            <div className="w-14 h-14 rounded-full border border-amber-400/30 flex flex-col items-center justify-center bg-black/60">
              <span className="text-[8px] font-black tracking-widest text-amber-400 font-serif">SALAJIT</span>
              <span className="text-[5px] text-amber-200/80">PURE 100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dark gradient shadow so text is always 100% crisp and readable */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent z-0" />

      {/* Content */}
      <div className="relative z-10 space-y-1 max-w-[65%]">
        <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight font-['Cinzel',serif]">
          Premium Himalayan Shilajit
        </h3>
        <p className="text-xs text-amber-200/90 font-medium tracking-wide">
          Pure. Natural. Powerful.
        </p>
      </div>

      <div className="relative z-10 mt-4">
        <button
          type="button"
          onClick={() => navigate('/products')}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-white/95 text-slate-900 rounded-xl hover:bg-white active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <span>Manage Products</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
        </button>
      </div>
    </div>
  );
};
