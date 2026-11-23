import React, { useState, useEffect } from 'react';
import { useToast } from '../../components/common/Toast';
import {
  quotationsApi,
  QuotationRequest,
  QuotationStatus,
} from '../../services/quotations.api';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatCurrency';
import {
  ScrollText,
  Search,
  RefreshCw,
  Eye,
  X,
  Clock3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

/** 'pending' → 'Pending' (labels used by tabs, table and status badges). */
const statusLabel = (status: QuotationStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatDate = (value: string): string =>
  value
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const QuotationsPage: React.FC = () => {
  const [quotations, setQuotations] = useState<QuotationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuotation, setActiveQuotation] =
    useState<QuotationRequest | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  const loadQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await quotationsApi.getQuotations();
      setQuotations(data);
    } catch (err) {
      console.error('Failed to load quotation requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const counts = {
    total: quotations.length,
    pending: quotations.filter((q) => q.status === 'pending').length,
    approved: quotations.filter((q) => q.status === 'approved').length,
    rejected: quotations.filter((q) => q.status === 'rejected').length,
  };

  const filteredQuotations = quotations.filter((q) => {
    const matchesStatus =
      selectedStatus === 'All' || statusLabel(q.status) === selectedStatus;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      String(q.id).includes(term) ||
      q.productName.toLowerCase().includes(term) ||
      q.packagingName.toLowerCase().includes(term) ||
      q.customerName.toLowerCase().includes(term) ||
      q.email.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const openDetails = (quotation: QuotationRequest) => {
    setActiveQuotation(quotation);
    setNoteDraft(quotation.adminNote || '');
  };

  const handleUpdateStatus = async (status: QuotationStatus) => {
    if (!activeQuotation || isSaving) return;

    setIsSaving(true);

    const updated = await quotationsApi.updateStatus(
      activeQuotation.id,
      status,
      noteDraft.trim() || null
    );

    if (updated) {
      const next = { status: updated.status, adminNote: updated.adminNote };

      setQuotations((prev) =>
        prev.map((q) => (q.id === activeQuotation.id ? { ...q, ...next } : q))
      );
      setActiveQuotation((prev) => (prev ? { ...prev, ...next } : prev));
      toast.success(`Quotation #${activeQuotation.id} marked ${statusLabel(
          updated.status
        )}.`);
    } else {
      toast.error('Failed to update the quotation status.');
    }

    setIsSaving(false);
  };

  /** One "Label … Value" row used inside the details modal. */
  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between py-1 border-b border-slate-50">
      <span className="text-slate-500">{label}:</span>
      <span className="font-semibold text-slate-800 text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Private-label quotation requests submitted from the Cost Calculator.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadQuotations}
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
            }
          >
            Refresh
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ScrollText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Requests</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {counts.total}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pending</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {counts.pending}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Approved</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {counts.approved}
            </h3>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Rejected</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {counts.rejected}
            </h3>
          </div>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, customer, id..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
      </Card>

      {/* Requests Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Request</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4 text-right">Est. Cost</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Loading quotation requests...
                  </td>
                </tr>
              ) : filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <ScrollText className="w-7 h-7 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-semibold text-slate-700">
                      No quotation requests found
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Requests submitted on the Cost Calculator will appear
                      here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((quotation) => (
                  <tr
                    key={quotation.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-slate-900">
                      QT-{quotation.id}
                      {quotation.isGuest && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          GUEST
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {quotation.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {quotation.email || 'No account attached'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {quotation.productName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {quotation.packagingName ||
                          (quotation.packageType
                            ? `Package #${quotation.packageType}`
                            : 'No packaging')}
                        {quotation.strength ? ` · ${quotation.strength}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {quotation.finishedQuantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(quotation.estimatedProjectCost)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(quotation.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge
                        status={statusLabel(quotation.status)}
                        type="quotation"
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(quotation)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold p-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quotation Details Modal */}
      {activeQuotation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          onClick={() => setActiveQuotation(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Quotation QT-{activeQuotation.id}
                </h3>
                <p className="text-xs text-slate-400">
                  {formatDate(activeQuotation.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={statusLabel(activeQuotation.status)}
                  type="quotation"
                />
                <button
                  type="button"
                  onClick={() => setActiveQuotation(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Close quotation details"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Request details */}
            <div className="space-y-2 text-xs">
              {infoRow(
                'Customer',
                activeQuotation.isGuest
                  ? `${activeQuotation.customerName} (guest)`
                  : activeQuotation.customerName
              )}
              {infoRow('Email', activeQuotation.email || '—')}
              {infoRow('Phone', activeQuotation.phone || '—')}
              {infoRow('Product', activeQuotation.productName)}
              {infoRow(
                'Package type',
                activeQuotation.packageType
                  ? `#${activeQuotation.packageType}`
                  : '—'
              )}
              {infoRow('Packaging', activeQuotation.packagingName || '—')}
              {infoRow('Strength', activeQuotation.strength || '—')}
              {infoRow('Fill size', String(activeQuotation.fillSize || '—'))}
              {infoRow(
                'Finished quantity',
                activeQuotation.finishedQuantity.toLocaleString()
              )}
              {infoRow(
                'Packaging purchase qty.',
                activeQuotation.packagingPurchaseQuantity.toLocaleString()
              )}
            </div>

            {/* Cost breakdown */}
            <div className="text-xs">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Cost Breakdown
              </p>
              {(
                [
                  ['Product cost', activeQuotation.productCost],
                  ['Packaging cost', activeQuotation.packagingCost],
                  ['Printing cost', activeQuotation.printingCost],
                  ['Setup cost', activeQuotation.setupCost],
                  ['Other costs', activeQuotation.otherCosts],
                  ['Shipping', activeQuotation.shipping],
                  ['Discount', -activeQuotation.discount],
                ] as [string, number][]
              ).map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-1 border-b border-slate-50"
                >
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-700">
                    {formatCurrency(value)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between pt-1.5">
                <span className="font-bold text-slate-900">
                  Estimated Project Cost
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(activeQuotation.estimatedProjectCost)}
                </span>
              </div>
            </div>

            {/* Admin note */}
            <div>
              <label
                htmlFor="quotationAdminNote"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Admin note
              </label>
              <textarea
                id="quotationAdminNote"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={3}
                placeholder="Quote reference, follow-up notes, customer contact…"
                className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Status updater */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                Update status (saves the note with it):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(['pending', 'approved', 'rejected'] as QuotationStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleUpdateStatus(st)}
                      className={`py-1.5 px-2 text-[11px] font-semibold rounded-lg border cursor-pointer disabled:opacity-60 ${
                        activeQuotation.status === st
                          ? st === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'rejected'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {statusLabel(st)}
                    </button>
                  )
                )}
              </div>
              {activeQuotation.adminNote && (
                <p className="mt-2 text-[11px] text-slate-400 break-words">
                  Saved note: {activeQuotation.adminNote}
                </p>
              )}
            </div>


            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveQuotation(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationsPage;
