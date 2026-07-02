'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Calendar, Clock, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';

type BookingStatus =
  | 'REQUEST' | 'CHECKING' | 'QUOTED' | 'APPROVED'
  | 'ADVANCE_PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface BookingListItem {
  id:           string;
  bookingCode:  string;
  customerName: string;
  customerPhone:string;
  shootDate:    string;
  startTime:    string;
  endTime:      string;
  totalAmount:  number | null;
  status:       BookingStatus;
  service:      { name: string; type: string } | null;
}

const STATUS_META: Record<BookingStatus, { label: string; cls: string }> = {
  REQUEST:      { label: 'Request',      cls: 'bg-[#f5f5f5] dark:bg-[#1a1a1a] text-[#6b6b6b] dark:text-[#8a8a8a]' },
  CHECKING:     { label: 'Checking',     cls: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' },
  QUOTED:       { label: 'Quoted',       cls: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  APPROVED:     { label: 'Approved',     cls: 'bg-[#E5312A]/10 text-[#E5312A]' },
  ADVANCE_PAID: { label: 'Advance Paid', cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
  IN_PROGRESS:  { label: 'In Progress',  cls: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' },
  COMPLETED:    { label: 'Completed',    cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' },
  CANCELLED:    { label: 'Cancelled',    cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
};


function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.REQUEST;
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-black tracking-[0.12em] uppercase ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export default function BookingsPage() {
  const [bookings,      setBookings]      = useState<BookingListItem[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<BookingStatus | ''>('');
  const user = getStoredUser();
  const isAdmin      = user?.role === 'SUPER_ADMIN' || user?.role === 'STUDIO_MANAGER';
  const approvedPending = !isAdmin ? bookings.filter(b => b.status === 'APPROVED') : [];

  const statusFilterRef = useRef(statusFilter);
  statusFilterRef.current = statusFilter;

  const load = (status: BookingStatus | '') => {
    setLoading(true);
    setError(false);
    api.get<BookingListItem[]>('/bookings', { params: { status: status || undefined } })
      .then(r => setBookings(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  useEffect(() => {
    const handler = () => load(statusFilterRef.current);
    window.addEventListener('podversal:live', handler);
    return () => window.removeEventListener('podversal:live', handler);
  }, []);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (
      (b.customerName   ?? '').toLowerCase().includes(q) ||
      (b.customerPhone  ?? '').includes(search)          ||
      (b.bookingCode    ?? '').toLowerCase().includes(q) ||
      (b.service?.name  ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Studio Management</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Bookings</h1>
          <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm mt-1">
            {loading ? 'Loading…' : `${filtered.length} booking${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link
          href="/dashboard/bookings/new"
          className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white px-4 py-2.5 text-sm font-bold transition-colors"
        >
          <Plus size={15} /> New Booking
        </Link>
      </div>

      {/* Payment CTA — shown only for customers with APPROVED bookings */}
      {approvedPending.length > 0 && (
        <div className="mb-5 bg-[#E5312A]/8 dark:bg-[#E5312A]/10 border border-[#E5312A]/30 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-9 h-9 bg-[#E5312A] flex items-center justify-center flex-shrink-0">
              <CreditCard size={16} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {approvedPending.length === 1
                  ? 'Your booking has been approved — advance payment required'
                  : `${approvedPending.length} bookings approved — advance payment required`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Pay the advance online to lock your studio slot. Accepted: UPI, card, net banking.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
            {approvedPending.slice(0, 2).map(b => (
              <Link
                key={b.id}
                href={`/dashboard/bookings/${b.id}`}
                className="inline-flex items-center gap-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white text-xs font-semibold px-4 py-2 transition-colors"
              >
                <CreditCard size={12} />
                Pay for {b.bookingCode}
              </Link>
            ))}
            {approvedPending.length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 self-center">+{approvedPending.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa] dark:text-[#555]" />
          <input
            type="text"
            placeholder="Search by name, phone, booking code, or service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-9 py-2.5 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#aaa] dark:text-[#555] flex-shrink-0" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as BookingStatus | '')}
            className="input-field py-2.5 text-sm"
          >
            <option value="">All Status</option>
            {(Object.keys(STATUS_META) as BookingStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden bg-white dark:bg-[#111111]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f5f5f5] dark:bg-[#181818]">
              <tr>
                {[
                  { label: 'Booking',      cls: '' },
                  { label: 'Service',      cls: 'hidden sm:table-cell' },
                  { label: 'Date & Time',  cls: '' },
                  { label: 'Amount',       cls: 'hidden md:table-cell' },
                  { label: 'Status',       cls: '' },
                  { label: '',             cls: '' },
                ].map(h => (
                  <th key={h.label} className={`text-left px-5 py-3.5 text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] whitespace-nowrap ${h.cls}`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5f5f5] dark:divide-[#1a1a1a]">
              {loading && (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <tr key={i}>
                      {[
                        '', 'hidden sm:table-cell', '', 'hidden md:table-cell', '', '',
                      ].map((cls, j) => (
                        <td key={j} className={`px-5 py-4 ${cls}`}>
                          <div className="h-3.5 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">Failed to load bookings.</p>
                    <button onClick={() => load(statusFilter)} className="text-[#E5312A] text-xs mt-2 hover:underline">
                      Try again
                    </button>
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <p className="font-bold text-gray-900 dark:text-white mb-1">No bookings found</p>
                    <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                      {search || statusFilter ? 'Try adjusting your filters.' : 'Submit a new booking to get started.'}
                    </p>
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map(b => (
                <tr key={b.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-bold text-gray-900 dark:text-white text-xs tracking-wide">{b.bookingCode}</p>
                    <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-xs mt-0.5">{b.customerName}</p>
                    <p className="text-[#aaa] dark:text-[#555] text-xs">{b.customerPhone}</p>
                  </td>
                  <td className="hidden sm:table-cell px-5 py-4 text-gray-700 dark:text-[#a0a0a0] text-sm">{b.service?.name ?? '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-gray-900 dark:text-white text-sm">
                      <Calendar size={12} className="text-[#aaa] dark:text-[#555]" />
                      {new Date(b.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[#6b6b6b] dark:text-[#8a8a8a] text-xs mt-0.5">
                      <Clock size={10} className="text-[#aaa] dark:text-[#555]" />
                      {b.startTime} – {b.endTime}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-5 py-4 font-medium text-gray-900 dark:text-white text-sm">
                    {b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : <span className="text-[#aaa] dark:text-[#555]">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-4">
                    {b.status === 'APPROVED' && !isAdmin ? (
                      <Link href={`/dashboard/bookings/${b.id}`} className="inline-flex items-center gap-1.5 bg-[#E5312A] hover:bg-[#CC2A24] text-white text-xs font-semibold px-3 py-1.5 transition-colors">
                        <CreditCard size={11} /> Pay Now
                      </Link>
                    ) : (
                      <Link href={`/dashboard/bookings/${b.id}`} className="text-[#E5312A] hover:underline text-xs font-semibold">
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
