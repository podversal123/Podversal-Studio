'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const INVOICE_TYPES = [
  { value: 'QUOTATION',       label: 'Quotation'          },
  { value: 'PROFORMA',        label: 'Proforma Invoice'   },
  { value: 'GST_INVOICE',     label: 'Tax Invoice (GST)'  },
  { value: 'PAYMENT_RECEIPT', label: 'Payment Receipt'    },
] as const;

const STATUS_LABEL: Record<string, string> = {
  REQUEST:      'Request',
  CHECKING:     'Checking',
  QUOTED:       'Quoted',
  APPROVED:     'Approved',
  ADVANCE_PAID: 'Advance Paid',
  IN_PROGRESS:  'In Progress',
  COMPLETED:    'Completed',
};

export default function InvoicesPage() {
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [bookingId,   setBookingId]   = useState('');
  const [invoiceType, setInvoiceType] = useState<string>('QUOTATION');
  const [invoices,    setInvoices]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [genLoading,  setGenLoading]  = useState(false);

  useEffect(() => {
    // Load all active bookings that may need an invoice
    const statuses = ['QUOTED', 'APPROVED', 'ADVANCE_PAID', 'IN_PROGRESS', 'COMPLETED'];
    Promise.all(statuses.map(s => api.get('/bookings', { params: { status: s } })))
      .then(results => {
        const all = results.flatMap(r => r.data);
        // Deduplicate by id
        const seen = new Set<string>();
        setBookings(all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; }));
      })
      .catch(() => {});
  }, []);

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
      toast.success(`${r.data.invoiceNumber} generated`);
      const updated = await api.get(`/invoices/booking/${bookingId}`);
      setInvoices(updated.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to generate invoice');
    } finally {
      setGenLoading(false);
    }
  };

  const selected = bookings.find(b => b.id === bookingId);

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Billing</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Invoices</h1>
      </div>

      {/* Generate panel */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a]">

        <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">Generate Invoice</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Booking</label>
              <select
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                className="input-field"
              >
                <option value="">— Select a booking —</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} · {b.service?.name ?? 'Studio'} · {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} [{STATUS_LABEL[b.status] ?? b.status}]
                  </option>
                ))}
              </select>
              {bookings.length === 0 && (
                <p className="text-xs text-[#aaa] dark:text-[#555] mt-1">No bookings found (Quoted and above)</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Invoice Type</label>
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
          </div>

          {/* Selected booking info */}
          {selected && (
            <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] px-4 py-3 text-sm flex flex-wrap gap-4">
              <span className="text-[#6b6b6b] dark:text-[#8a8a8a]">Customer: <span className="font-bold text-gray-900 dark:text-white">{selected.customerName ?? selected.customer?.user?.name ?? '—'}</span></span>
              <span className="text-[#6b6b6b] dark:text-[#8a8a8a]">Amount: <span className="font-bold text-gray-900 dark:text-white">₹{Number(selected.totalAmount ?? 0).toLocaleString('en-IN')}</span></span>
              <span className="text-[#6b6b6b] dark:text-[#8a8a8a]">Status: <span className="font-bold text-gray-900 dark:text-white">{STATUS_LABEL[selected.status] ?? selected.status}</span></span>
            </div>
          )}

          <button
            onClick={generateInvoice}
            disabled={genLoading || !bookingId}
            className="btn-primary disabled:opacity-50"
          >
            {genLoading ? 'Generating…' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      {/* Existing invoices for selected booking */}
      {bookingId && (
        loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />)}
          </div>
        ) : invoices.length > 0 ? (
          <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
              <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">
                Existing Invoices — {invoices.length} found
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">GST</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                        {INVOICE_TYPES.find(t => t.value === inv.type)?.label ?? inv.type}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                        ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right hidden sm:table-cell text-orange-600 dark:text-orange-400">
                        {inv.gstAmount ? `₹${Number(inv.gstAmount).toLocaleString('en-IN')}` : <span className="text-[#aaa] dark:text-[#555]">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="text-[#E5312A] hover:underline text-xs font-bold"
                          onClick={() => {
                            const token = localStorage.getItem('accessToken');
                            fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoices/${inv.id}/pdf`, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                              .then(r => r.blob())
                              .then(blob => {
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `${inv.invoiceNumber}.pdf`;
                                a.click();
                                URL.revokeObjectURL(url);
                              });
                          }}
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#aaa] dark:text-[#555]">No invoices for this booking yet.</p>
        )
      )}
    </div>
  );
}
