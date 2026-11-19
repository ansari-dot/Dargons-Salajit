import { api } from './api';

export type BulkRequestStatus = 'pending' | 'approved' | 'rejected';

export interface BulkRequestProduct {
  productId: number | null;
  productName: string;
  quantity: number;
  unit: string;
  moq: number;
}

export interface BulkRequest {
  id: number;
  referenceNo: string;
  customerName: string;
  email: string;
  phone: string;
  createdAt: string;
  status: BulkRequestStatus;
  adminNote: string | null;
  products: BulkRequestProduct[];
  totalItems: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const numberValue = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseSnapshot = (value: unknown, requestId: number): Record<string, unknown> => {
  if (typeof value === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error(`Bulk request ${requestId} has invalid configuration data.`);
    }
    return isRecord(parsed) ? parsed : {};
  }
  return isRecord(value) ? value : {};
};

const normalizeStatus = (value: unknown): BulkRequestStatus => {
  const status = String(value || '').toLowerCase();
  if (status === 'approved' || status === 'rejected') return status;
  return 'pending';
};

const isBulkRequestStatus = (value: string): value is BulkRequestStatus =>
  value === 'pending' || value === 'approved' || value === 'rejected';

const toBulkRequest = (row: Record<string, unknown>): BulkRequest | null => {
  const id = numberValue(row.id);
  const snapshot = parseSnapshot(row.configuration_snapshot ?? row.configurationSnapshot, id);
  const bulkItems = snapshot.bulkOrderItems ?? snapshot.bulk_order_items;
  if (!Array.isArray(bulkItems) || bulkItems.length === 0) return null;

  const firstName = String(row.user_first_name || '').trim();
  const lastName = String(row.user_last_name || '').trim();
  const email = String(row.user_email || row.customer_email || '');
  const customerName =
    `${firstName} ${lastName}`.trim() ||
    String(row.customer_name || '').trim() ||
    email ||
    'Guest';
  const products = bulkItems.filter(isRecord).map((item) => ({
    productId: item.productId === undefined && item.product_id === undefined
      ? null
      : numberValue(item.productId ?? item.product_id),
    productName: String(item.productName || item.product_name || 'Product'),
    quantity: numberValue(item.quantity),
    unit: String(item.unit || 'units'),
    moq: numberValue(item.moq),
  }));

  if (products.length === 0) return null;

  return {
    id,
    referenceNo: String(row.reference_no || `BR-${id}`),
    customerName,
    email,
    phone: String(row.user_phone || row.customer_phone || ''),
    createdAt: String(row.created_at || ''),
    status: normalizeStatus(row.status),
    adminNote: row.admin_note == null ? null : String(row.admin_note),
    products,
    totalItems: products.reduce((total, product) => total + product.quantity, 0),
  };
};

export const bulkRequestsApi = {
  getBulkRequests: async (): Promise<BulkRequest[]> => {
    const response = await api.get('/calculator/requests/admin');
    const rows: unknown = response.data?.data;
    if (!Array.isArray(rows)) {
      throw new Error('The bulk requests API returned an invalid response.');
    }
    return rows.filter(isRecord)
      .map(toBulkRequest)
      .filter((request): request is BulkRequest => request !== null);
  },

  updateStatus: async (
    id: number,
    status: BulkRequestStatus,
    adminNote: string | null
  ): Promise<BulkRequestStatus> => {
    const response = await api.patch(`/calculator/requests/${id}/status`, {
      status,
      adminNote,
    });
    const returnedStatus = String(response.data?.data?.status || '').toLowerCase();
    if (!isBulkRequestStatus(returnedStatus)) {
      throw new Error('The bulk request status was not returned by the server.');
    }
    return returnedStatus;
  },
};
