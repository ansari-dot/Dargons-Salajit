'use client';

import { useEffect, useState } from 'react';
import './trademark.css';

export interface Trademark {
  id: number | string;
  title: string;
  subtitle?: string | null;
  image_url?: string | null;
  document_url?: string | null;
  display_order?: number;
  is_active?: boolean | number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const DEFAULT_TRADEMARKS: Trademark[] = [
  {
    id: 'default-1',
    title: 'Trademark Certificate',
    subtitle: 'Dragon Shilajit™ Registered Trademark',
    image_url: 'https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Trademark.jpg',
    document_url: 'https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Trademark.jpg',
  },
  {
    id: 'default-2',
    title: 'Trademark Registration',
    subtitle: 'Official Registration Document',
    image_url: 'https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Trademark_1.jpg',
    document_url: 'https://cdn.shopify.com/s/files/1/0720/3409/1309/files/Trademark_1.jpg',
  },
];

const FACTS = [
  { label: 'Origin', value: 'Gilgit-Baltistan, above 17,000ft' },
  { label: 'Independently tested', value: 'Eurofins USA' },
  { label: 'Fulvic acid', value: '79.6% verified, published by batch' },
];

const resolveImageUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function TrademarkPage({ initialTrademarks = [] }: { initialTrademarks?: Trademark[] }) {
  const [trademarks, setTrademarks] = useState<Trademark[]>(initialTrademarks);
  const [loading, setLoading] = useState(initialTrademarks.length === 0);

  useEffect(() => {
    const controller = new AbortController();
    const loadTrademarks = async () => {
      try {
        // Try same-origin proxy first, then fallback to full API URL
        const endpoint = `${API_BASE_URL}/trademarks`;
        const response = await fetch(endpoint, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const result = await response.json();
        if (Array.isArray(result.data) && result.data.length > 0) {
          setTrademarks(result.data);
        } else if (initialTrademarks.length === 0) {
          setTrademarks(DEFAULT_TRADEMARKS);
        }
      } catch (err: any) {
        if (!controller.signal.aborted) {
          if (initialTrademarks.length === 0 && trademarks.length === 0) {
            setTrademarks(DEFAULT_TRADEMARKS);
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadTrademarks();
    return () => controller.abort();
  }, [initialTrademarks]);

  const items = trademarks.length > 0 ? trademarks : (initialTrademarks.length > 0 ? initialTrademarks : DEFAULT_TRADEMARKS);

  return (
    <div className="tm-page">
      {/* Hero */}
      <section className="tm-hero">
        <div className="tm-hero-text">
          <div className="tm-eyebrow">● Brand Protection</div>
          <h1 className="tm-title">Trademark Dragon Shilajit™</h1>
          <p className="tm-sub">Official registration documents for the Dragon Shilajit™ brand and its marks.</p>
          <div className="tm-rule" />
        </div>
        <div className="tm-hero-logo-wrap">
          <img src="/dragon-logo.png" alt="Dragon Shilajit Official Logo" />
        </div>
      </section>

      {/* Certificates Section */}
      <section className="tm-section">
        <div className="tm-step">
          <div className="tm-step-num">1</div>
          <div>
            <h2>Registration Certificates</h2>
            <p>Trademark documents issued for Dragon Shilajit™.</p>
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="tm-state">
            <p>Loading trademark certificates…</p>
          </div>
        ) : (
          <div className="tm-grid">
            {items.map((c) => {
              const imgSrc = resolveImageUrl(c.image_url);
              return (
                <figure className="tm-card" key={c.id} style={{ margin: 0 }}>
                  {imgSrc && <img src={imgSrc} alt={c.title} loading="lazy" />}
                  <h3>{c.title}</h3>
                  {c.subtitle && <p>{c.subtitle}</p>}
                  {c.document_url && (
                    <a
                      className="tm-card-link"
                      href={c.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View document ↗
                    </a>
                  )}
                </figure>
              );
            })}
          </div>
        )}
      </section>

      {/* Facts */}
      <section className="tm-facts">
        {FACTS.map((f) => (
          <div className="tm-fact" key={f.label}>
            <h4>{f.label}</h4>
            <p>{f.value}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
