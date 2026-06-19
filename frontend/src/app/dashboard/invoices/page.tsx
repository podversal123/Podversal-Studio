'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const INVOICE_TYPES = [
  { value: 'GST_INVOICE',     label: 'Tax Invoice (GST)' },
  { value: 'PROFORMA',        label: 'Proforma Invoice' },
  { value: 'QUOTATION',       label: 'Quotation' },
  { value: 'PAYMENT_RECEIPT', label: 'Payment Receipt' },
] as const;

export default function InvoicesPage() {
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [bookingId,   setBookingId]   = useState('');
  const [invoiceType, setInvoiceType] = useState<string>('GST_INVOICE');
  const [invoices,    setInvoices]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [genLoading,  setGenLoading]  = useState(false);

  // Load bookings that can have invoices (ADVANCE_PAID or COMPLETED)
  useEffect(() => {
    Promise.all([
      api.get('/bookings', { params: { status: 'ADVANCE_PAID' } }),
      api.get('/bookings', { params: { status: 'COMPLETED' } }),
    ]).then(([a, c]) => setBookings([...a.data, ...c.data])).catch(() => {});
  }, []);

  // Auto-load invoices when booking selection changes
  useEffect(() => {
    if (!bookingId) { setInvoices([]); return; }
    setLoading(true);
    api.get(`/invoices/booking/${bookingId}`)
      .then(r => setInvoices(r.data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [bookingId]);

  const generateInvoice = async () => {
    if (!bookingId) return toast.error('Select a booking first');
    setGenLoading(true);
    try {
      const r = await api.post('/invoices/generate', { bookingId, type: invoiceType });
      toast.success(`Invoice ${r.data.invoiceNumber} generated`);
      // Reload invoices for this booking
      const updated = await api.get(`/invoices/booking/${bookingId}`);
      setInvoices(updated.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to generate invoice');
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Invoices</h1>

      <div className="max-w-2xl space-y-6">
        {/* Controls */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">Generate / Lookup Invoice</h2>

          <div>
            <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Booking</label>
            <select
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a booking</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.bookingCode} — {b.service?.name} ({new Date(b.shootDate).toLocaleDateString('en-IN')}) · {b.customerName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-[#555] mt-1">Shows ADVANCE PAID and COMPLETED bookings</p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Invoice Type</label>
            <select
              value={invoiceType}
              onChange={e => setInvoiceType(e.target.value)}
              className="input-field"
            >
              {INVOICE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={generateInvoice}
            disabled={genLoading || !bookingId}
            className="btn-primary w-full"
          >
            {genLoading ? 'Generating...' : 'Generate Invoice'}
          </button>
        </div>

        {/* Invoice list for selected booking */}
        {bookingId && (
          loading ? (
            <div className="text-center text-gray-400 dark:text-[#555] py-8">Loading invoices...</div>
          ) : invoices.length > 0 ? (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#3a3a3a] bg-gray-50 dark:bg-[#1a1a1a]">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-[#a0a0a0]">Existing Invoices</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">GST</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-gray-50 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-[#a0a0a0]">{INVOICE_TYPES.find(t => t.value === inv.type)?.label ?? inv.type}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 hidden sm:table-cell text-gray-500 dark:text-[#666]">
                        {inv.gstAmount ? `₹${Number(inv.gstAmount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-[#666]">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="py-3 px-4">
                        {inv.cloudinaryUrl ? (
                          <a href={inv.cloudinaryUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[#E5312A] hover:underline text-xs font-medium">
                            Download
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-400 dark:text-[#555] py-8 card">
              No invoices for this booking yet. Click Generate to create one.
            </div>
          )
        )}
      </div>
    </div>
  );
}
