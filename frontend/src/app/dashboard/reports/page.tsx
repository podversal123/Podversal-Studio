'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type ReportType = 'bookings' | 'revenue' | 'gst';

const REPORT_LABELS: Record<ReportType, string> = {
  bookings: 'Booking Report',
  revenue:  'Revenue Report',
  gst:      'GST Report',
};

export default function ReportsPage() {
  const today    = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [type,    setType]    = useState<ReportType>('bookings');
  const [from,    setFrom]    = useState(monthAgo);
  const [to,      setTo]      = useState(today);
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/reports/${type}?from=${from}&to=${to}`);
      setData(r.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportPdf = async () => {
    try {
      const res = await api.get(`/reports/${type}/export`, {
        params: { from, to },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${type}-report-${from}-to-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF export failed');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reports</h1>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Report Type</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(REPORT_LABELS) as ReportType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setType(t); setData(null); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${type === t ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-200 dark:hover:bg-[#3a3a3a]'}`}
                >
                  {REPORT_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-field" />
          </div>
          <button onClick={fetchReport} disabled={loading} className="btn-primary px-6">
            {loading ? 'Loading...' : 'Generate'}
          </button>
          {data && (
            <button onClick={exportPdf} className="px-4 py-2 border border-gray-300 dark:border-[#3a3a3a] rounded-lg text-sm text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Booking Report */}
      {data && type === 'bookings' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', value: data.summary.total, color: 'text-gray-900 dark:text-white' },
              { label: 'Completed', value: data.summary.completed, color: 'text-green-600' },
              { label: 'In Progress', value: data.summary.inProgress, color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Cancelled', value: data.summary.cancelled, color: 'text-red-600' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Code</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Service</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b: any) => (
                    <tr key={b.id} className="border-b border-gray-50 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-2 px-4 font-mono text-xs text-gray-900 dark:text-white">{b.bookingCode}</td>
                      <td className="py-2 px-4 text-gray-700 dark:text-[#a0a0a0]">{b.service?.name}</td>
                      <td className="py-2 px-4 hidden sm:table-cell text-gray-700 dark:text-[#a0a0a0]">{b.customer?.user?.name ?? b.customerName ?? '—'}</td>
                      <td className="py-2 px-4 text-gray-500 dark:text-[#666]">{new Date(b.shootDate).toLocaleDateString('en-IN')}</td>
                      <td className="py-2 px-4">
                        <span className="text-xs font-medium text-gray-600 dark:text-[#a0a0a0]">{b.status}</span>
                      </td>
                      <td className="py-2 px-4 hidden md:table-cell text-gray-900 dark:text-white">₹{Number(b.totalAmount ?? 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Report */}
      {data && type === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">₹{Number(data.totalRevenue).toLocaleString('en-IN')}</div>
              <div className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">Total Revenue Collected</div>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-700 dark:text-[#a0a0a0] mb-3 text-sm">By Payment Mode</h3>
              {Object.entries(data.byMode).map(([mode, amt]) => (
                <div key={mode} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600 dark:text-[#a0a0a0]">{mode}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{Number(amt).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Booking</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Mode</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-2 px-4 font-mono text-xs text-gray-900 dark:text-white">{p.booking.bookingCode}</td>
                      <td className="py-2 px-4 hidden sm:table-cell text-gray-700 dark:text-[#a0a0a0]">{p.booking.customer?.user?.name ?? '—'}</td>
                      <td className="py-2 px-4 text-gray-700 dark:text-[#a0a0a0]">{p.type}</td>
                      <td className="py-2 px-4 text-gray-700 dark:text-[#a0a0a0]">{p.mode}</td>
                      <td className="py-2 px-4 font-semibold text-gray-900 dark:text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-gray-500 dark:text-[#666] hidden md:table-cell">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GST Report */}
      {data && type === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Taxable Amount', value: data.totalTaxable, color: 'text-gray-900 dark:text-white' },
              { label: 'GST Collected (18%)', value: data.totalGst, color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Total with GST', value: data.totalAmount, color: 'text-green-600' },
            ].map(s => (
              <div key={s.label} className="card">
                <div className={`text-2xl font-bold ${s.color}`}>₹{Number(s.value).toLocaleString('en-IN')}</div>
                <div className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Customer</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Service</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Subtotal</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">GST</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-gray-50 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-2 px-4 font-mono text-xs text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-2 px-4 hidden sm:table-cell text-gray-700 dark:text-[#a0a0a0]">{inv.booking.customer?.user?.name ?? '—'}</td>
                      <td className="py-2 px-4 hidden md:table-cell text-gray-700 dark:text-[#a0a0a0]">{inv.booking.service?.name}</td>
                      <td className="py-2 px-4 text-gray-700 dark:text-[#a0a0a0]">₹{Number(inv.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 text-orange-600 dark:text-orange-400">₹{Number(inv.gstAmount ?? 0).toLocaleString('en-IN')}</td>
                      <td className="py-2 px-4 font-semibold text-gray-900 dark:text-white">₹{Number(inv.totalAmount).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center text-gray-400 dark:text-[#555] py-12">
          Select a report type and date range, then click Generate
        </div>
      )}
    </div>
  );
}
