'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const offlineSchema = z.object({
  bookingId:       z.string().min(1, 'Select a booking'),
  amount:          z.coerce.number().min(1, 'Enter amount'),
  type:            z.enum(['ADVANCE', 'FULL', 'BALANCE', 'REFUND']),
  mode:            z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'NET_BANKING']),
  referenceNumber: z.string().optional(),
  collectedBy:     z.string().optional(),
});
type OfflineForm = z.infer<typeof offlineSchema>;

const STATUS_LABEL: Record<string, string> = {
  APPROVED:     'Approved',
  ADVANCE_PAID: 'Advance Paid',
  IN_PROGRESS:  'In Progress',
  COMPLETED:    'Completed',
};

export default function PaymentsPage() {
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [recording,   setRecording]   = useState(false);
  const [tab,         setTab]         = useState<'record' | 'search'>('record');
  const [searchId,    setSearchId]    = useState('');
  const [payments,    setPayments]    = useState<any[]>([]);
  const [searching,   setSearching]   = useState(false);
  const [searched,    setSearched]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfflineForm>({
    resolver: zodResolver(offlineSchema),
    defaultValues: { type: 'ADVANCE', mode: 'CASH' },
  });

  useEffect(() => {
    Promise.all([
      api.get('/bookings', { params: { status: 'APPROVED'     } }),
      api.get('/bookings', { params: { status: 'ADVANCE_PAID' } }),
      api.get('/bookings', { params: { status: 'IN_PROGRESS'  } }),
    ]).then(([a, b, c]) => {
      const all = [...a.data, ...b.data, ...c.data];
      const seen = new Set<string>();
      setBookings(all.filter(b => { if (seen.has(b.id)) return false; seen.add(b.id); return true; }));
    }).catch(() => {});
  }, []);

  const onRecord = async (data: OfflineForm) => {
    setRecording(true);
    try {
      await api.post('/payments/offline', data);
      toast.success('Payment recorded successfully');
      reset({ type: 'ADVANCE', mode: 'CASH' });
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  const searchPayments = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setSearched(false);
    try {
      const r = await api.get(`/payments/booking/${searchId}`);
      setPayments(r.data);
      setSearched(true);
    } catch {
      toast.error('Booking not found');
      setPayments([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-5">

      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Financial Operations</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Payments</h1>
      </div>

      {/* Tabs */}
      <div className="flex border border-[#e5e5e5] dark:border-[#2a2a2a] w-fit">
        <button
          onClick={() => setTab('record')}
          className={`px-5 py-2.5 text-sm font-bold transition-colors ${tab === 'record' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'}`}
        >
          Record Offline Payment
        </button>
        <button
          onClick={() => setTab('search')}
          className={`px-5 py-2.5 text-sm font-bold transition-colors ${tab === 'search' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'}`}
        >
          Search by Booking
        </button>
      </div>

      {/* ── Record Offline Payment ── */}
      {tab === 'record' && (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a]">
          <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
            <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#aaa] dark:text-[#555]">Record Cash / Bank Transfer</p>
          </div>

          <form onSubmit={handleSubmit(onRecord)} className="p-5 space-y-4">

            {/* Booking */}
            <div>
              <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Booking</label>
              <select {...register('bookingId')} className="input-field">
                <option value="">— Select a booking —</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} · {b.service?.name ?? 'Studio'} · {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} [{STATUS_LABEL[b.status] ?? b.status}]
                  </option>
                ))}
              </select>
              {errors.bookingId && <p className="text-[#E5312A] text-xs mt-1">{errors.bookingId.message}</p>}
            </div>

            {/* Type + Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Payment Type</label>
                <select {...register('type')} className="input-field">
                  <option value="ADVANCE">Advance</option>
                  <option value="FULL">Full</option>
                  <option value="BALANCE">Balance</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Mode</label>
                <select {...register('mode')} className="input-field">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            {/* Amount + Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Amount (₹)</label>
                <input {...register('amount')} type="number" className="input-field" placeholder="25000" />
                {errors.amount && <p className="text-[#E5312A] text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Reference No. <span className="font-normal normal-case">(optional)</span></label>
                <input {...register('referenceNumber')} className="input-field" placeholder="UTR / Cheque no." />
              </div>
            </div>

            {/* Collected By */}
            <div>
              <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Collected By <span className="font-normal normal-case">(optional)</span></label>
              <input {...register('collectedBy')} className="input-field" placeholder="Staff name" />
            </div>

            <button type="submit" disabled={recording} className="btn-primary disabled:opacity-50">
              {recording ? 'Recording…' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}

      {/* ── Search by Booking ── */}
      {tab === 'search' && (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Booking Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. PV-2026-001"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchPayments()}
                className="input-field flex-1"
              />
              <button
                onClick={searchPayments}
                disabled={searching || !searchId.trim()}
                className="btn-primary !w-auto px-5 whitespace-nowrap disabled:opacity-50"
              >
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>

          {searched && payments.length === 0 && (
            <p className="text-sm text-[#aaa] dark:text-[#555]">No payments found for this booking.</p>
          )}

          {payments.length > 0 && (
            <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Mode</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 hidden md:table-cell">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-black tracking-[0.06em] uppercase bg-[#f5f5f5] dark:bg-[#2a2a2a] text-gray-600 dark:text-[#8a8a8a] px-2 py-1">{p.type}</span>
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">{p.mode}</td>
                        <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black tracking-[0.06em] uppercase px-2 py-1 ${p.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a] hidden md:table-cell">{p.referenceNumber ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
