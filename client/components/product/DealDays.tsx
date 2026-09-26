'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import DealTimer from './DealTimer';
import { useAppSelector } from '@/lib/redux/hooks';
import { Product } from '@/lib/redux/slices/productSlice';

interface Deal {
  id: number;
  title: string;
  subtitle?: string;
  product_id?: number | null;
  product_name?: string;
  product_image?: string;
  original_price: number;
  deal_price: number;
  discount_percentage?: number;
  banner_image?: string;
  end_time?: string;
  is_active: number;
}

export default function DealDays() {
  const storeProducts = useAppSelector((state) => state.products.products);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const fetchActiveDeals = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/deals/active');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setDeals(data.data);
          }
        }
      } catch (err) {
        console.warn('Could not load live deals from backend:', err);
      }
    };

    fetchActiveDeals();
  }, []);

  // Map active deals or fallback store products
  const displayItems = deals.length > 0
    ? deals.map((deal) => {
        const origPrice = Number(deal.original_price || 0);
        const dealPrice = Number(deal.deal_price || 0);
        const image = deal.banner_image || deal.product_image || '/shilajit-surp.png';

        const product: Product = {
          id: String(deal.product_id || deal.id),
          name: deal.title,
          price: dealPrice,
          oldPrice: origPrice > dealPrice ? origPrice : undefined,
          image: image,
          category: 'Flash Deal'
        };

        return {
          id: deal.id,
          product,
          endTime: deal.end_time
        };
      })
    : storeProducts.slice(0, 3).map((prod, index) => ({
        id: prod.id,
        product: prod,
        endTime: undefined
      }));

  return (
    <section className="deal-days-section">
      <div className="deal-days__container">
        <h2 className="featured__title">Deal of the days</h2>

        <div className="deal-days__grid">
          {displayItems.map((item, index) => (
            <article className="deal-card" key={item.id}>
              <ProductCard product={item.product} />
              <DealTimer endTime={item.endTime} initialDays={14 + index} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
