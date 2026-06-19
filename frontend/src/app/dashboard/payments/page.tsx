'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const offlineSchema = z.object({
  bookingId:       z.string().min(1, 'Select a booking'),
  amount:          z.coerce.number().min(1),
  type:            z.enum(['ADVANCE', 'FULL', 'BALANCE', 'REFUND']),
  mode:            z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'NET_BANKING']),
  referenceNumber: z.string().optional(),
  collectedBy:     z.string().optional(),
});
type OfflineForm = z.infer<typeof offlineSchema>;

export default function PaymentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState<'record' | 'search'>('record');
  const [searchId, setSearchId] = useState('');
  const [payments, setPayments] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OfflineForm>({
    resolver: zodResolver(offlineSchema),
  });

  useEffect(() => {
    // Load APPROVED/ADVANCE_PAID bookings for the dropdown
    api.get('/bookings', { params: { status: 'APPROVED' } }).then(r => setBookings(r.data)).catch(() => {});
    api.get('/bookings', { params: { status: 'ADVANCE_PAID' } }).then(r => setBookings(prev => [...prev, ...r.data])).catch(() => {});
  }, []);

  const onRecord = async (data: OfflineForm) => {
    setLoading(true);
    try {
      await api.post('/payments/offline', data);
      toast.success('Payment recorded');
      reset();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const searchPayments = async () => {
    if (!searchId) return;
    try {
      const r = await api.get(`/payments/booking/${searchId}`);
      setPayments(r.data);
    } catch {
      toast.error('Booking not found');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Payments</h1>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-[#3a3a3a]">
        {(['record', 'search'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-[#E5312A] text-[#E5312A]' : 'border-transparent text-gray-500 dark:text-[#a0a0a0] hover:text-gray-700 dark:hover:text-white'}`}
          >
            {t === 'record' ? 'Record Offline Payment' : 'Search by Booking'}
          </button>
        ))}
      </div>

      {tab === 'record' && (
        <div className="max-w-lg card">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Record Cash / Bank Transfer</h2>
          <form onSubmit={handleSubmit(onRecord)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Booking</label>
              <select {...register('bookingId')} className="input-field">
                <option value="">Select booking</option>
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.bookingCode} — {b.service?.name} ({new Date(b.shootDate).toLocaleDateString('en-IN')})
                  </option>
                ))}
              </select>
              {errors.bookingId && <p className="text-xs text-red-500 mt-1">{errors.bookingId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Payment Type</label>
                <select {...register('type')} className="input-field">
                  <option value="ADVANCE">Advance</option>
                  <option value="FULL">Full</option>
                  <option value="BALANCE">Balance</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Mode</label>
                <select {...register('mode')} className="input-field">
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Amount (₹)</label>
              <input {...register('amount')} type="number" className="input-field" placeholder="25000" />
              {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Reference Number (optional)</label>
              <input {...register('referenceNumber')} className="input-field" placeholder="UTR / Cheque number" />
            </div>

            <div>
              <label className="block text-sm text-gray-600 dark:text-[#a0a0a0] mb-1">Collected By (optional)</label>
              <input {...register('collectedBy')} className="input-field" placeholder="Staff name" />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Enter Booking ID (UUID)"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              className="input-field flex-1 max-w-md"
            />
            <button onClick={searchPayments} className="btn-primary">Search</button>
          </div>

          {payments.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Mode</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 dark:border-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-3 px-4 text-gray-700 dark:text-[#a0a0a0]">{p.type}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-[#a0a0a0]">{p.mode}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-[#666]">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="py-3 px-4 text-gray-500 dark:text-[#666] hidden md:table-cell">{p.referenceNumber ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
