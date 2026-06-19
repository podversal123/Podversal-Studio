'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<any>(null);
  const [stats,     setStats]     = useState<any>(null);
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    api.get('/customers').then(r => setCustomers(r.data))
      .catch(() => toast.error('Failed to load customers'))
      .finally(() => setLoading(false));
  }, []);

  const openCustomer = async (c: any) => {
    setSelected(c);
    setStats(null);
    setNotes(c.internalNotes ?? '');
    try {
      const r = await api.get(`/customers/${c.id}/stats`);
      setStats(r.data);
    } catch {}
  };

  const saveNotes = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/customers/${selected.id}`, { internalNotes: notes });
      setSelected((prev: any) => ({ ...prev, internalNotes: notes }));
      toast.success('Notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const filtered = customers.filter(c =>
    [c.user?.name, c.user?.email, c.user?.phone, c.companyName]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field sm:w-72"
        />
      </div>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-[#a0a0a0] py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Contact</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Company</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-gray-400 dark:text-[#555] py-8">No customers found</td></tr>
                  ) : filtered.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => openCustomer(c)}
                      className={`border-b border-gray-50 dark:border-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${selected?.id === c.id ? 'bg-[#E5312A]/5 dark:bg-[#E5312A]/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{c.user?.name}</div>
                        <div className="text-gray-500 dark:text-[#666] text-xs sm:hidden">{c.user?.email}</div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-gray-600 dark:text-[#a0a0a0]">
                        <div>{c.user?.email}</div>
                        <div className="text-gray-500 dark:text-[#666]">{c.user?.phone}</div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell text-gray-600 dark:text-[#a0a0a0]">{c.companyName ?? '—'}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 dark:bg-[#2a2a2a] text-gray-700 dark:text-[#a0a0a0] font-semibold text-xs">
                          {c._count?.bookings ?? '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Detail Panel */}
          <div>
            {selected ? (
              <div className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{selected.user?.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">{selected.companyName ?? `${selected.category ?? 'Individual'}`}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#a0a0a0] text-xl leading-none">×</button>
                </div>

                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Email</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{selected.user?.email}</dd>
                  </div>
                  {selected.user?.phone && (
                    <div>
                      <dt className="text-gray-500 dark:text-[#666]">Phone</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{selected.user.phone}</dd>
                    </div>
                  )}
                  {selected.gstNumber && (
                    <div>
                      <dt className="text-gray-500 dark:text-[#666]">GST Number</dt>
                      <dd className="font-medium font-mono text-xs text-gray-900 dark:text-white">{selected.gstNumber}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Category</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{selected.category ?? 'INDIVIDUAL'}</dd>
                  </div>
                </dl>

                {stats ? (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-[#3a3a3a]">
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</div>
                      <div className="text-xs text-gray-500 dark:text-[#666]">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.completedBookings}</div>
                      <div className="text-xs text-gray-500 dark:text-[#666]">Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#E5312A]">₹{Number(stats.totalSpent).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-500 dark:text-[#666]">Spent</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-[#555] text-sm pt-2">Loading stats...</div>
                )}

                {selected.bookings?.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-[#3a3a3a]">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-[#a0a0a0] mb-2">Recent Bookings</h3>
                    <div className="space-y-1">
                      {selected.bookings.slice(0, 5).map((b: any) => (
                        <div key={b.id} className="text-xs text-gray-600 dark:text-[#a0a0a0] flex justify-between">
                          <span>{b.bookingCode}</span>
                          <span className="text-gray-400 dark:text-[#555]">{new Date(b.shootDate).toLocaleDateString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 dark:border-[#3a3a3a]">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-[#a0a0a0] mb-2">Internal Notes</h3>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add private notes about this customer..."
                    className="input-field resize-none text-sm"
                  />
                  <button
                    onClick={saveNotes}
                    disabled={saving}
                    className="mt-2 w-full py-2 bg-[#E5312A] text-white text-sm font-medium rounded-lg hover:bg-[#b51d1d] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card text-center text-gray-400 dark:text-[#555] py-8">
                <p className="text-sm">Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
