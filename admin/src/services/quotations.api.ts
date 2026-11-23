import { api } from './api';

/** Status of a private-label quotation request (from /calculator). */
export type QuotationStatus = 'pending' | 'approved' | 'rejected';

/** A row of `calculator_requests` (+ the requesting user when logged in). */
export interface QuotationRequest {
  id: number;
  /** Null when a guest (not logged in) submitted the request. */
  userId: number | null;
  customerName: string;
  email: string;
  phone: string;
  isGuest: boolean;

  productId: number | null;
  productName: string;
  packageType: string;
  fillSize: number;
  strength: string | null;
  finishedQuantity: number;

  packagingId: number | null;
  packagingName: string;
  packagingPurchaseQuantity: number;

  productCost: number;
  packagingCost: number;
  printingCost: number;
  setupCost: number;
  otherCosts: number;
  shipping: number;
  discount: number;
  estimatedProjectCost: number;

  status: QuotationStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

const num = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeStatus = (status: unknown): QuotationStatus => {
  const s = String(status || '').toLowerCase();
  if (s === 'approved') return 'approved';
  if (s === 'rejected') return 'rejected';
  return 'pending';
};

const toQuotation = (row: any): QuotationRequest => {
  const firstName = row.user_first_name || '';
  const lastName = row.user_last_name || '';
  const customerName =
    `${firstName} ${lastName}`.trim() ||
    row.user_email ||
    (row.user_id ? `Customer #${row.user_id}` : 'Guest');

  return {
    id: num(row.id),
    userId: row.user_id ?? null,
    customerName,
    email: row.user_email || '',
    phone: row.user_phone || '',
    isGuest: !row.user_id,

    productId: row.product_id ?? null,
    productName: row.product_name || 'Unknown product',
    packageType: String(row.package_type ?? ''),
    fillSize: num(row.fill_size),
    strength: row.strength ?? null,
    finishedQuantity: num(row.finished_quantity),

    packagingId: row.packaging_id ?? null,
    packagingName: row.packaging_name || '',
    packagingPurchaseQuantity: num(row.packaging_purchase_quantity),

    productCost: num(row.product_cost),
    packagingCost: num(row.packaging_cost),
    printingCost: num(row.printing_cost),
    setupCost: num(row.setup_cost),
    otherCosts: num(row.other_costs),
    shipping: num(row.shipping),
    discount: num(row.discount),
    estimatedProjectCost: num(row.estimated_project_cost),

    status: normalizeStatus(row.status),
    adminNote: row.admin_note ?? null,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || '',
  };
};

export const quotationsApi = {
  /** GET /api/calculator/requests/admin — every quotation request, newest first. */
  getQuotations: async (): Promise<QuotationRequest[]> => {
    try {
      const response = await api.get('/calculator/requests/admin');
      const rows = response.data?.data;
      return Array.isArray(rows) ? rows.map(toQuotation) : [];
    } catch (err) {
      console.error('Error fetching quotation requests:', err);
      return [];
    }
  },

  /**
   * PATCH /api/calculator/requests/:id/status — approve / reject / re-open.
   * Returns the fields the server echoed back, or null on failure.
   */
  updateStatus: async (
    id: number | string,
    status: QuotationStatus,
    adminNote?: string | null
  ): Promise<{ id: number | string; status: QuotationStatus; adminNote: string | null } | null> => {
    try {
      const response = await api.patch(`/calculator/requests/${id}/status`, {
        status,
        adminNote: adminNote ?? null,
      });
      const data = response.data?.data;

      return {
        id: data?.Id ?? data?.id ?? id,
        status: normalizeStatus(data?.status ?? status),
        adminNote: data?.adminNote ?? adminNote ?? null,
      };
    } catch (err) {
      console.error('Failed to update quotation status:', err);
      return null;
    }
  },
};