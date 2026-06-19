'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getStoredUser } from '@/lib/auth';
import api from '@/lib/api';
import { IndianRupee, CheckCircle, Clock, Download } from 'lucide-react';

interface Commission {
  id: string;
  commissionAmount: number;
  status: 'PENDING' | 'RELEASED';
  createdAt: string;
  releasedAt: string | null;
  booking: {
    bookingCode: string;
    shootDate: string;
    service: { name: string };
  };
}

interface Summary {
  total: number;
  pending: number;
  released: number;
  count: number;
}

export default function CommissionsPage() {
  const [commissions,    setCommissions]    = useState<Commission[]>([]);
  const [summary,        setSummary]        = useState<Summary | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [downloading,    setDownloading]    = useState(false);
  const [agentProfileId, setAgentProfileId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user?.profileId) { setLoading(false); return; }
    setAgentProfileId(user.profileId);

    Promise.all([
      api.get<{ commissions: Commission[] }>(`/agents/${user.profileId}`),
      api.get<Summary>(`/agents/${user.profileId}/commission-summary`),
    ]).then(([agentRes, summaryRes]) => {
      setCommissions(agentRes.data.commissions ?? []);
      setSummary(summaryRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const downloadStatement = async () => {
    if (!agentProfileId) return;
    setDownloading(true);
    try {
      const res = await api.get(`/agents/${agentProfileId}/commission-statement`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `commission-statement.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to generate statement. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading commissions...</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Commissions</h1>
        {agentProfileId && (
          <button
            onClick={downloadStatement}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all disabled:opacity-50"
          >
            <Download size={15} />
            {downloading ? 'Generating...' : 'Download Statement'}
          </button>
        )}
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Earned',    value: summary.total,    icon: IndianRupee, color: 'text-green-600',  bg: 'bg-green-50'  },
            { label: 'Pending Payout',  value: summary.pending,  icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Released',        value: summary.released, icon: CheckCircle, color: 'text-blue-600',   bg: 'bg-blue-50'   },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}>
                  <Icon size={20} className={card.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{Number(card.value).toLocaleString('en-IN')}</p>
                <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Commission list */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Commission History</h2>
        </div>
        {commissions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No commissions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b">
                  <th className="px-4 py-3 font-medium">Booking</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Shoot Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Released On</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {commissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.booking?.bookingCode}</td>
                    <td className="px-4 py-3 text-gray-700">{c.booking?.service?.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.booking?.shootDate ? new Date(c.booking.shootDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">₹{Number(c.commissionAmount).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.status === 'RELEASED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.releasedAt ? new Date(c.releasedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
