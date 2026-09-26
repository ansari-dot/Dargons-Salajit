import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { TopProduct } from '../../types';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

interface TopSellingProductsProps {
  products: TopProduct[];
}

export const TopSellingProducts: React.FC<TopSellingProductsProps> = ({ products }) => {
  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Top Selling Products
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">Ranked by overall volume sold</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 py-2.5 px-2 border-b border-slate-50">
        <div className="col-span-6">Product</div>
        <div className="col-span-3 text-right">Sold</div>
        <div className="col-span-3 text-right pr-4">Revenue</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-50 flex-1">
        {products.map((product) => (
          <div
            key={product.id}
            className="grid grid-cols-12 items-center py-2.5 px-2 hover:bg-slate-50/70 rounded-xl transition-colors group cursor-pointer"
          >
            {/* Product with thumbnail */}
            <div className="col-span-6 flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-900/90 border border-slate-200/80 p-0.5 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-md"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                {product.name}
              </span>
            </div>

            {/* Units sold */}
            <div className="col-span-3 text-right text-xs font-semibold text-slate-600">
              {formatNumber(product.sold)}
            </div>

            {/* Revenue & Arrow */}
            <div className="col-span-3 flex items-center justify-end gap-2 text-right">
              <span className="text-xs font-bold text-slate-900">
                {formatCurrency(product.revenue)}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
