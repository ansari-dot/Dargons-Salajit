'use client';

import { useEffect, useRef, useState } from 'react';
import './certifications.css';

interface Certification {
  id: number | string;
  title: string;
  issuer?: string | null;
  certificate_number?: string | null;
  description?: string | null;
  image_url?: string | null;
  document_url?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxCertification, setLightboxCertification] = useState<Certification | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const lightboxViewportRef = useRef<HTMLDivElement>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{
    pointerId: number;
    pointerX: number;
    pointerY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog) return;

    if (lightboxCertification && !dialog.open) {
      dialog.showModal();
    } else if (!lightboxCertification && dialog.open) {
      dialog.close();
    }
  }, [lightboxCertification]);

  useEffect(() => {
    if (!lightboxCertification) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setLightboxCertification(null);
        setImageScale(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxCertification]);

  useEffect(() => {
    const viewport = lightboxViewportRef.current;
    if (!lightboxCertification || !viewport) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setImageScale((scale) => Math.min(3, Math.max(1, scale - event.deltaY * 0.001)));
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [lightboxCertification]);

  useEffect(() => {
    const activeThumbnail = thumbnailsRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    activeThumbnail?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [activeIndex]);

  useEffect(() => {
    const controller = new AbortController();
    const loadCertifications = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/certifications`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Unable to load certifications.');
        const result = await response.json();
        if (!Array.isArray(result.data)) throw new Error('The certifications response was invalid.');
        setCertifications(result.data);
        setActiveIndex(0);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          console.error('Failed to load certifications:', requestError);
          setError('Certifications are temporarily unavailable. Please try again later.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadCertifications();
    return () => controller.abort();
  }, [retryCount]);

  const activeCertification = certifications[activeIndex];
  const issued = activeCertification ? formatDate(activeCertification.issued_at) : null;
  const expires = activeCertification ? formatDate(activeCertification.expires_at) : null;

  return (
    <div className="pc-page pc-reference-page">
      <div className="pc-reference-content">
        <nav className="pc-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a><span aria-hidden="true">›</span><span>Certifications</span>
        </nav>

        <header className="pc-reference-intro">
          <span className="pc-reference-eyebrow">QUALITY &amp; COMPLIANCE</span>
          <h1>Certifications</h1>
          <p className="pc-reference-tagline">Independently documented. Transparently shared.</p>
          <div className="pc-reference-copy">
            <p>
              We believe quality should be easy to verify. Explore the certifications and supporting records
              shared by our team, all in one place.
            </p>
            <p>
              Browse each document below for details from its issuing organization. For more information,
              use the contact details available on our site.
            </p>
          </div>
        </header>

        <section className="pc-certifications" aria-labelledby="certifications-heading">
          <div className="pc-reference-section-heading">
            <span className="pc-reference-eyebrow">OUR DOCUMENTS</span>
            <h2 id="certifications-heading">Certificates &amp; standards</h2>
            <p>Browse the documents currently published by our team.</p>
          </div>

          {loading ? (
            <div className="pc-certifications-state" role="status">
              <span className="pc-loading-mark" aria-hidden="true" />
              <span>Loading certifications</span>
            </div>
          ) : error ? (
            <div className="pc-certifications-state pc-certifications-error" role="alert">
              <p>{error}</p>
              <button type="button" className="pc-certifications-retry" onClick={() => setRetryCount((count) => count + 1)}>
                Try again
              </button>
            </div>
          ) : certifications.length === 0 ? (
            <div className="pc-certifications-state pc-certifications-empty">
              <span className="pc-certifications-empty-icon" aria-hidden="true">✓</span>
              <h3>Our certifications are being updated</h3>
              <p>Please check back soon for the latest documents.</p>
            </div>
          ) : activeCertification ? (
            <div
              className="pc-reference-carousel"
              role="region"
              aria-label="Certificate documents"
              aria-roledescription="carousel"
            >
              <div
                className="pc-reference-slide"
                role="group"
                aria-roledescription="slide"
                aria-label={`${activeIndex + 1} of ${certifications.length}`}
              >
                <div className="pc-reference-image-frame">
                  {activeCertification.image_url ? (
                    <button
                      type="button"
                      className="pc-reference-image-button"
                      aria-label={`Open ${activeCertification.title} certificate image`}
                      onClick={() => {
                        setImageScale(1);
                        setLightboxCertification(activeCertification);
                      }}
                    >
                      <img
                        className="pc-reference-image"
                        src={activeCertification.image_url}
                        alt={`${activeCertification.title} certificate`}
                      />
                      <span className="pc-reference-image-hint" aria-hidden="true">Click to enlarge</span>
                    </button>
                  ) : (
                    <div className="pc-certification-image-placeholder" aria-hidden="true">
                      <span>✓</span>
                      <small>CERTIFICATION</small>
                    </div>
                  )}
                  {certifications.length > 1 && (
                    <>
                      <button
                        type="button"
                        className="pc-reference-arrow pc-reference-arrow--previous"
                        aria-label="Previous certificate"
                        onClick={() => setActiveIndex((index) => (index - 1 + certifications.length) % certifications.length)}
                      >
                        <span aria-hidden="true">←</span>
                      </button>
                      <button
                        type="button"
                        className="pc-reference-arrow pc-reference-arrow--next"
                        aria-label="Next certificate"
                        onClick={() => setActiveIndex((index) => (index + 1) % certifications.length)}
                      >
                        <span aria-hidden="true">→</span>
                      </button>
                    </>
                  )}
                </div>

                <div className="pc-reference-thumbnails" ref={thumbnailsRef} role="group" aria-label="All certificates">
                  {certifications.map((certification, index) => (
                    <button
                      type="button"
                      key={certification.id}
                      className={`pc-reference-thumbnail${index === activeIndex ? ' is-active' : ''}`}
                      aria-label={`View ${certification.title}`}
                      aria-pressed={index === activeIndex}
                      onClick={() => setActiveIndex(index)}
                    >
                      {certification.image_url ? (
                        <img src={certification.image_url} alt="" loading="lazy" />
                      ) : (
                        <span className="pc-reference-thumbnail-placeholder" aria-hidden="true">✓</span>
                      )}
                      <span className="pc-reference-thumbnail-title">{certification.title}</span>
                    </button>
                  ))}
                </div>

                <div className="pc-reference-caption" aria-live="polite" aria-atomic="true">
                  <div>
                    <h3>{activeCertification.title}</h3>
                    {activeCertification.issuer && <p className="pc-certification-issuer">{activeCertification.issuer}</p>}
                  </div>
                  {activeCertification.description && (
                    <p className="pc-certification-description">{activeCertification.description}</p>
                  )}
                  {activeCertification.certificate_number && (
                    <p className="pc-certification-number">Certificate No. {activeCertification.certificate_number}</p>
                  )}
                  <div className="pc-reference-caption-footer">
                    {(issued || expires) && (
                      <p className="pc-certification-dates">
                        {issued && <>Issued {issued}</>}
                        {issued && expires && <span aria-hidden="true"> · </span>}
                        {expires && <>Expires {expires}</>}
                      </p>
                    )}
                    {activeCertification.document_url && (
                      <a
                        className="pc-certification-link"
                        href={activeCertification.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View document <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </section>
      </div>

      {lightboxCertification?.image_url && (
        <dialog
          ref={lightboxRef}
          className="pc-lightbox"
          aria-label={`${lightboxCertification.title} certificate image`}
          onClose={() => {
            setLightboxCertification(null);
            setImageScale(1);
          }}
          onCancel={(event) => {
            event.preventDefault();
            setLightboxCertification(null);
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxCertification(null);
          }}
        >
          <div className="pc-lightbox-panel">
            <div className="pc-lightbox-toolbar">
              <div className="pc-lightbox-title">
                <strong>{lightboxCertification.title}</strong>
                {lightboxCertification.issuer && <span>{lightboxCertification.issuer}</span>}
              </div>
              <div className="pc-lightbox-controls" aria-label="Image controls">
                <button
                  type="button"
                  aria-label="Zoom out"
                  disabled={imageScale <= 1}
                  onClick={() => setImageScale((scale) => Math.max(1, Math.round((scale - 0.1) * 10) / 10))}
                >
                  −
                </button>
                <span className="pc-lightbox-zoom" aria-live="polite">{Math.round(imageScale * 100)}%</span>
                <button
                  type="button"
                  aria-label="Zoom in"
                  disabled={imageScale >= 3}
                  onClick={() => setImageScale((scale) => Math.min(3, Math.round((scale + 0.1) * 10) / 10))}
                >
                  +
                </button>
                <button
                  type="button"
                  className="pc-lightbox-close"
                  aria-label="Close certificate image"
                  onClick={() => setLightboxCertification(null)}
                >
                  ×
                </button>
              </div>
            </div>
            <div
              className={`pc-lightbox-image-viewport${imageScale > 1 ? ' is-pannable' : ''}${isPanning ? ' is-panning' : ''}`}
              ref={lightboxViewportRef}
              onPointerDown={(event) => {
                if (imageScale <= 1 || (event.pointerType === 'mouse' && event.button !== 0)) return;
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                panStartRef.current = {
                  pointerId: event.pointerId,
                  pointerX: event.clientX,
                  pointerY: event.clientY,
                  scrollLeft: event.currentTarget.scrollLeft,
                  scrollTop: event.currentTarget.scrollTop,
                };
                setIsPanning(true);
              }}
              onPointerMove={(event) => {
                const start = panStartRef.current;
                if (!start || start.pointerId !== event.pointerId) return;
                event.currentTarget.scrollLeft = start.scrollLeft - (event.clientX - start.pointerX);
                event.currentTarget.scrollTop = start.scrollTop - (event.clientY - start.pointerY);
              }}
              onPointerUp={(event) => {
                if (panStartRef.current?.pointerId !== event.pointerId) return;
                panStartRef.current = null;
                setIsPanning(false);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              onPointerCancel={() => {
                panStartRef.current = null;
                setIsPanning(false);
              }}
            >
              <img
                className="pc-lightbox-image"
                src={lightboxCertification.image_url}
                alt={`${lightboxCertification.title} certificate, enlarged`}
                style={imageScale > 1 ? { width: `${imageScale * 100}%`, maxWidth: 'none', maxHeight: 'none' } : undefined}
              />
            </div>
            <p className="pc-lightbox-help">Scroll over the image or use + / − to zoom. Hold and drag, or use the scroll bars, to inspect enlarged areas.</p>
          </div>
        </dialog>
      )}
    </div>
  );
}
