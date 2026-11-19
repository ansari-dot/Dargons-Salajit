import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Eye,
  Filter,
  MoreVertical,
  Package,
  PackagePlus,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';
import { BulkRequest, BulkRequestStatus, bulkRequestsApi } from '../../services/bulkRequests.api';
import { AdminProduct, calculatorAdminApi } from '../../services/calculatorAdmin.api';

type DateRange = '7' | '30' | '90' | 'all';

const PAGE_SIZE = 5;

const statusLabel = (status: BulkRequestStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatRequestDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '' };
  return {
    date: date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
};

const getInitials = (name: string): string =>
  name.trim().split(/\s+/).map((part) => part[0] || '').join('').slice(0, 2).toUpperCase() || 'G';

const avatarColors = [
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
];

const isWithinDateRange = (value: string, range: DateRange): boolean => {
  if (range === 'all') return true;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return false;
  const days = Number(range);
  return timestamp >= Date.now() - days * 24 * 60 * 60 * 1000;
};

const RequestStatus: React.FC<{ status: BulkRequestStatus }> = ({ status }) => {
  const styles: Record<BulkRequestStatus, { wrapper: string; icon: React.ReactNode }> = {
    pending: {
      wrapper: 'bg-amber-50 text-amber-700',
      icon: <Clock3 className="h-4 w-4" />,
    },
    approved: {
      wrapper: 'bg-emerald-50 text-emerald-700',
      icon: <CircleCheck className="h-4 w-4" />,
    },
    rejected: {
      wrapper: 'bg-rose-50 text-rose-700',
      icon: <CircleX className="h-4 w-4" />,
    },
  };
  const style = styles[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style.wrapper}`}>
      {style.icon}
      {statusLabel(status)}
    </span>
  );
};

const ProductThumbnail: React.FC<{
  product: BulkRequest['products'][number];
  imageUrl?: string;
}> = ({ product, imageUrl }) => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50"
      title={product.productName}
    >
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={product.productName}
          className="h-full w-full object-contain p-0.5"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Package className="h-5 w-5 text-emerald-700" aria-hidden="true" />
      )}
    </span>
  );
};

const ProductStack: React.FC<{
  request: BulkRequest;
  imageByProductId: Record<number, string>;
}> = ({ request, imageByProductId }) => {
  const visibleProducts = request.products.slice(0, 3);
  const moreCount = request.products.length - visibleProducts.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {visibleProducts.map((product, index) => (
          <ProductThumbnail
            key={`${request.id}-${product.productId ?? product.productName}-${index}`}
            product={product}
            imageUrl={product.productId === null ? undefined : imageByProductId[product.productId]}
          />
        ))}
      </div>
      {moreCount > 0 && (
        <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          +{moreCount} more
        </span>
      )}
    </div>
  );
};

export const BulkRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<BulkRequest[]>([]);
  const [imageByProductId, setImageByProductId] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [imageWarning, setImageWarning] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState('1');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [activeRequest, setActiveRequest] = useState<BulkRequest | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setLoadError('');
      setImageWarning('');
      try {
        const data = await bulkRequestsApi.getBulkRequests();
        if (!isMounted) return;
        setRequests(data);

        try {
          const products: AdminProduct[] = await calculatorAdminApi.getProducts();
          if (!Array.isArray(products)) {
            throw new Error('The calculator products API returned an invalid response.');
          }
          if (isMounted) {
            setImageByProductId(Object.fromEntries(
              products
                .filter((product): product is AdminProduct & { image_url: string } =>
                  typeof product.image_url === 'string' && product.image_url.length > 0
                )
                .map((product) => [product.id, product.image_url])
            ));
          }
        } catch (error) {
          console.error('Failed to load product thumbnails for bulk requests:', error);
          if (isMounted) setImageWarning('Some product thumbnails could not be loaded.');
        }
      } catch (error) {
        console.error('Failed to load bulk requests:', error);
        if (isMounted) {
          setLoadError(error instanceof Error ? error.message : 'Bulk requests could not be loaded.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const dateFilteredRequests = useMemo(
    () => requests.filter((request) => isWithinDateRange(request.createdAt, dateRange)),
    [requests, dateRange]
  );

  const productOptions = useMemo(() => {
    const names = new Set<string>();
    dateFilteredRequests.forEach((request) => request.products.forEach((product) => names.add(product.productName)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [dateFilteredRequests]);

  const counts = useMemo(() => ({
    total: dateFilteredRequests.length,
    pending: dateFilteredRequests.filter((request) => request.status === 'pending').length,
    approved: dateFilteredRequests.filter((request) => request.status === 'approved').length,
    rejected: dateFilteredRequests.filter((request) => request.status === 'rejected').length,
  }), [dateFilteredRequests]);

  const filteredRequests = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return dateFilteredRequests.filter((request) => {
      const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
      const matchesProduct = selectedProduct === 'all' ||
        request.products.some((product) => product.productName === selectedProduct);
      const matchesSearch = !term ||
        request.customerName.toLowerCase().includes(term) ||
        request.email.toLowerCase().includes(term) ||
        request.referenceNo.toLowerCase().includes(term);
      return matchesStatus && matchesProduct && matchesSearch;
    });
  }, [dateFilteredRequests, searchTerm, selectedProduct, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const pageRequests = filteredRequests.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from(
    { length: Math.min(3, totalPages) },
    (_, index) => Math.max(1, Math.min(currentPage - 1, totalPages - 2)) + index
  );
  const openMenuRequest = requests.find((request) => request.id === openMenuId) || null;
  const firstResult = filteredRequests.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(currentPage * PAGE_SIZE, filteredRequests.length);

  useEffect(() => {
    setCurrentPage(1);
    setGoToPage('1');
  }, [dateRange, searchTerm, selectedProduct, selectedStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      setGoToPage(String(totalPages));
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (openMenuId === null) return;

    const updateMenuPosition = () => {
      const button = actionButtonRefs.current[openMenuId];
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = 176;
      const menuHeight = 120;
      const top = rect.bottom + menuHeight + 8 > window.innerHeight
        ? Math.max(8, rect.top - menuHeight - 8)
        : rect.bottom + 8;
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
      setMenuPosition({ top, left });
    };

    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      const actionButton = actionButtonRefs.current[openMenuId];
      if (menuRef.current?.contains(target) || actionButton?.contains(target)) return;
      setOpenMenuId(null);
      setMenuPosition(null);
    };

    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [openMenuId]);

  const openDetails = (request: BulkRequest) => {
    setActiveRequest(request);
    setNoteDraft(request.adminNote || '');
    setActionError('');
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const updateStatus = async (request: BulkRequest, status: BulkRequestStatus) => {
    if (updatingId !== null) return;
    setUpdatingId(request.id);
    setActionError('');
    const adminNote = activeRequest?.id === request.id
      ? noteDraft.trim() || null
      : request.adminNote;
    try {
      const updatedStatus = await bulkRequestsApi.updateStatus(request.id, status, adminNote);
      const updated = { ...request, status: updatedStatus, adminNote };
      setRequests((current) => current.map((item) => item.id === request.id ? updated : item));
      setActiveRequest((current) => current?.id === request.id ? updated : current);
      setOpenMenuId(null);
      setMenuPosition(null);
      toast.success(`Bulk request ${request.referenceNo} marked ${statusLabel(updatedStatus)}.`);
    } catch (error) {
      console.error('Failed to update bulk request status:', error);
      const message = error instanceof Error ? error.message : 'Could not update the request status.';
      setActionError(message);
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const goToRequestedPage = () => {
    const requested = Number(goToPage);
    if (!Number.isInteger(requested) || requested < 1) {
      setGoToPage(String(currentPage));
      return;
    }
    const targetPage = Math.min(requested, totalPages);
    setCurrentPage(targetPage);
    setGoToPage(String(targetPage));
  };

  const statCards = [
    {
      label: 'Total Bulk Requests',
      value: counts.total,
      icon: <ShoppingCart className="h-6 w-6" />,
      card: 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white',
      bubble: 'bg-emerald-100 text-emerald-700',
      bars: 'bg-emerald-200',
    },
    {
      label: 'Pending Requests',
      value: counts.pending,
      icon: <Clock3 className="h-6 w-6" />,
      card: 'border-blue-100 bg-gradient-to-br from-blue-50 to-white',
      bubble: 'bg-blue-100 text-blue-700',
      bars: 'bg-blue-200',
    },
    {
      label: 'Approved Requests',
      value: counts.approved,
      icon: <Check className="h-6 w-6" />,
      card: 'border-green-100 bg-gradient-to-br from-green-50 to-white',
      bubble: 'bg-green-100 text-green-700',
      bars: 'bg-green-200',
    },
    {
      label: 'Rejected Requests',
      value: counts.rejected,
      icon: <X className="h-6 w-6" />,
      card: 'border-rose-100 bg-gradient-to-br from-rose-50 to-white',
      bubble: 'bg-rose-100 text-rose-700',
      bars: 'bg-rose-200',
    },
  ];

  return (
    <div className="min-w-0 space-y-3 pb-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 text-green-800">
            <PackagePlus className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Bulk Requests</h1>
            <p className="mt-1 text-sm text-slate-500">Manage customer bulk order requests</p>
          </div>
        </div>
        <label className="relative flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm sm:self-auto">
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <span className="sr-only">Date range</span>
          <select
            value={dateRange}
            onChange={(event) => setDateRange(event.target.value as DateRange)}
            className="cursor-pointer appearance-none bg-transparent pr-5 outline-none"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-500" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-2xl border px-4 py-2.5 shadow-sm ${card.card}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.bubble}`}>
              {card.icon}
            </span>
            <div className="relative z-10 min-w-0">
              <p className="text-2xl font-extrabold leading-none text-slate-900">{card.value}</p>
              <p className="mt-1.5 text-xs font-medium text-slate-600">{card.label}</p>
            </div>
            <div className="ml-auto flex h-10 items-end gap-1 opacity-70" aria-hidden="true">
              {[18, 28, 38].map((height) => (
                <span key={height} className={`w-2.5 rounded-full ${card.bars}`} style={{ height }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Bulk requests could not be loaded: {loadError}
        </div>
      )}
      {imageWarning && (
        <p role="status" className="text-xs text-amber-700">{imageWarning} Product names and request details are still available.</p>
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1.4fr)_minmax(155px,.65fr)_minmax(190px,.75fr)_auto]">
          <label className="relative block min-w-0">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">Search bulk requests</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by customer name, email or reference..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
          </label>
          <label className="relative block min-w-0">
            <span className="sr-only">Filter by status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
          <label className="relative block min-w-0">
            <span className="sr-only">Filter by product</span>
            <select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            >
              <option value="all">All Products</option>
              {productOptions.map((productName) => (
                <option key={productName} value={productName}>{productName}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </label>
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-800 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 focus:outline-none focus:ring-4 focus:ring-green-200"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="bg-slate-50/70 text-[11px] font-semibold text-slate-500">
              <tr>
                <th className="w-16 px-5 py-2.5">#</th>
                <th className="min-w-[210px] px-4 py-2.5">Customer</th>
                <th className="min-w-[250px] px-4 py-2.5">Products</th>
                <th className="px-4 py-2.5">Total Items</th>
                <th className="px-4 py-2.5">Request Date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-500">Loading bulk requests…</td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-500">Refresh the page to try again.</td>
                </tr>
              ) : pageRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <PackagePlus className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 font-semibold text-slate-700">No bulk requests found</p>
                    <p className="mt-1 text-xs text-slate-400">Requests submitted through the bulk order form will appear here.</p>
                  </td>
                </tr>
              ) : (
                pageRequests.map((request, rowIndex) => {
                  const date = formatRequestDate(request.createdAt);
                  const avatarColor = avatarColors[(request.customerName.charCodeAt(0) || 0) % avatarColors.length];
                  const rowNumber = (currentPage - 1) * PAGE_SIZE + rowIndex + 1;

                  return (
                    <tr key={request.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-2 font-medium text-slate-700">{rowNumber}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor}`}>
                            {getInitials(request.customerName)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold text-slate-800">{request.customerName}</span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-500">{request.email || 'No email provided'}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <ProductStack request={request} imageByProductId={imageByProductId} />
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-800">{request.totalItems.toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <span className="block whitespace-nowrap font-medium text-slate-700">{date.date}</span>
                        {date.time && <span className="mt-0.5 block text-[10px] text-slate-500">{date.time}</span>}
                      </td>
                      <td className="px-4 py-2"><RequestStatus status={request.status} /></td>
                      <td className="px-5 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openDetails(request)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-green-50 px-3 text-[11px] font-semibold text-green-800 transition hover:bg-green-100 focus:outline-none focus:ring-4 focus:ring-green-100"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            ref={(element) => { actionButtonRefs.current[request.id] = element; }}
                            type="button"
                            aria-label={`More actions for ${request.referenceNo}`}
                            aria-expanded={openMenuId === request.id}
                            onClick={(event) => {
                              if (openMenuId === request.id) {
                                setOpenMenuId(null);
                                setMenuPosition(null);
                                return;
                              }
                              const rect = event.currentTarget.getBoundingClientRect();
                              const menuWidth = 176;
                              const menuHeight = 120;
                              const top = rect.bottom + menuHeight + 8 > window.innerHeight
                                ? Math.max(8, rect.top - menuHeight - 8)
                                : rect.bottom + 8;
                              const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
                              setMenuPosition({ top, left });
                              setOpenMenuId(request.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 px-5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium text-slate-600">
            Showing {firstResult} to {lastResult} of {filteredRequests.length} results
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  type="button"
                  aria-current={currentPage === page ? 'page' : undefined}
                  onClick={() => {
                    setCurrentPage(page);
                    setGoToPage(String(page));
                  }}
                  className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-semibold transition ${
                    currentPage === page
                      ? 'bg-green-800 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const page = Math.min(totalPages, currentPage + 1);
                  setCurrentPage(page);
                  setGoToPage(String(page));
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <form
              className="flex items-center gap-2 pl-1"
              onSubmit={(event) => {
                event.preventDefault();
                goToRequestedPage();
              }}
            >
              <label htmlFor="bulk-requests-page" className="whitespace-nowrap text-xs text-slate-500">Go to:</label>
              <input
                id="bulk-requests-page"
                type="number"
                min={1}
                max={totalPages}
                value={goToPage}
                onChange={(event) => setGoToPage(event.target.value)}
                className="h-8 w-12 rounded-lg border border-slate-200 text-center text-xs outline-none focus:border-green-500"
              />
              <button type="submit" className="h-8 rounded-lg bg-green-800 px-3 text-xs font-semibold text-white hover:bg-green-900">Go</button>
            </form>
          </div>
        </div>
      </div>

      {openMenuRequest && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] w-44 rounded-xl border border-slate-200 bg-white p-1.5 text-left shadow-xl"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button
            type="button"
            onClick={() => openDetails(openMenuRequest)}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View request
          </button>
          {(['pending', 'approved', 'rejected'] as BulkRequestStatus[])
            .filter((status) => status !== openMenuRequest.status)
            .map((status) => (
              <button
                key={status}
                type="button"
                disabled={updatingId === openMenuRequest.id}
                onClick={() => void updateStatus(openMenuRequest, status)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Mark {statusLabel(status)}
              </button>
            ))}
        </div>,
        document.body
      )}

      {activeRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
          onClick={() => setActiveRequest(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-request-dialog-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">{activeRequest.referenceNo}</p>
                <h2 id="bulk-request-dialog-title" className="mt-1 text-xl font-bold text-slate-900">Bulk request details</h2>
                <p className="mt-1 text-xs text-slate-500">{formatRequestDate(activeRequest.createdAt).date} · {formatRequestDate(activeRequest.createdAt).time}</p>
              </div>
              <div className="flex items-center gap-3">
                <RequestStatus status={activeRequest.status} />
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  aria-label="Close request details"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 border-b border-slate-100 py-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Customer</p>
                <p className="mt-1 font-semibold text-slate-800">{activeRequest.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-1 break-all font-semibold text-slate-800">{activeRequest.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="mt-1 font-semibold text-slate-800">{activeRequest.phone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total items</p>
                <p className="mt-1 font-semibold text-slate-800">{activeRequest.totalItems.toLocaleString()}</p>
              </div>
            </div>

            <div className="py-4">
              <h3 className="mb-3 text-sm font-bold text-slate-800">Requested products</h3>
              <div className="space-y-2">
                {activeRequest.products.map((product, index) => (
                  <div key={`${product.productId ?? product.productName}-${index}`} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <ProductThumbnail
                      product={product}
                      imageUrl={product.productId === null ? undefined : imageByProductId[product.productId]}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{product.productName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">MOQ: {product.moq.toLocaleString()} {product.unit}</p>
                    </div>
                    <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                      {product.quantity.toLocaleString()} <span className="font-medium text-slate-500">{product.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <label htmlFor="bulk-request-admin-note" className="block text-xs font-semibold text-slate-700">
              Admin note
            </label>
            <textarea
              id="bulk-request-admin-note"
              rows={3}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Add follow-up notes for this request"
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />
            {actionError && <p role="alert" className="mt-2 text-xs text-rose-600">{actionError}</p>}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {(['pending', 'approved', 'rejected'] as BulkRequestStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={updatingId === activeRequest.id || activeRequest.status === status}
                  onClick={() => void updateStatus(activeRequest, status)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                    status === 'approved'
                      ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      : status === 'rejected'
                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  Mark {statusLabel(status)}
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default BulkRequestsPage;
