'use client';

import React from 'react';

interface ShopToolbarProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
}

export default function ShopToolbar({
  viewMode,
  onViewModeChange,
  itemsPerPage,
  onItemsPerPageChange,
  sortBy,
  onSortByChange,
}: ShopToolbarProps) {
  return (
    <div className="shop-toolbar">
      <div className="shop-toolbar__view-modes">
        <button
          type="button"
          className={`shop-toolbar__icon-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => onViewModeChange('grid')}
          aria-label="Grid view"
          title="Grid view"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
          </svg>
        </button>

        <button
          type="button"
          className={`shop-toolbar__icon-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => onViewModeChange('list')}
          aria-label="List view"
          title="List view"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
          </svg>
        </button>
      </div>

      <div className="shop-toolbar__controls">
        <div className="shop-toolbar__field">
          <label htmlFor="shop-view-count">View</label>
          <select
            id="shop-view-count"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="shop-toolbar__select"
          >
            <option value={6}>6</option>
            <option value={10}>10</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="shop-toolbar__field">
          <label htmlFor="shop-sort-by">Sort By</label>
          <select
            id="shop-sort-by"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="shop-toolbar__select"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="default">Default</option>
            <option value="low-to-high">Price: Low to High</option>
            <option value="high-to-low">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
}
