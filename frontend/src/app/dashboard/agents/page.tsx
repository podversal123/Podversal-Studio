'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Agent {
  id: string;
  agencyName: string;
  commissionRate: number;
  isActive: boolean;
  user: { name: string; email: string; phone?: string };
}

interface CommissionSummary {
  total:    number;
  pending:  number;
  released: number;
}

export default function AgentsPage() {
  const [agents,    setAgents]    = useState<Agent[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CommissionSummary>>({});
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get<Agent[]>('/agents')
      .then(async r => {
        setAgents(r.data);
        // Fetch commission summary for each agent in parallel
        const results = await Promise.allSettled(
          r.data.map(a =>
            api.get<CommissionSummary>(`/agents/${a.id}/commission-summary`)
              .then(s => ({ id: a.id, summary: s.data }))
          )
        );
        const map: Record<string, CommissionSummary> = {};
        results.forEach(r => {
          if (r.status === 'fulfilled') map[r.value.id] = r.value.summary;
        });
        setSummaries(map);
      })
      .catch(() => toast.error('Failed to load agents'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => `₹${Number(n ?? 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Referral Network</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Referral Agents</h1>
        <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
          {agents.length} agent{agents.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="font-bold text-gray-900 dark:text-white mb-1">No agents yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">Add referral agents via Settings → Team.</p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <th className="px-4 py-3">Agent</th>
                <th className="px-4 py-3 hidden sm:table-cell">Contact</th>
                <th className="px-4 py-3">Rate</th>
                <th className="px-4 py-3">Total Earned</th>
                <th className="px-4 py-3 hidden md:table-cell">Pending</th>
                <th className="px-4 py-3 hidden md:table-cell">Released</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {agents.map(a => {
                const s = summaries[a.id];
                return (
                  <tr key={a.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 dark:text-white">{a.user?.name ?? '—'}</p>
                      {a.agencyName && <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">{a.agencyName}</p>}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <p className="text-[#6b6b6b] dark:text-[#8a8a8a]">{a.user?.email ?? '—'}</p>
                      {a.user?.phone && <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">{a.user.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black text-[#E5312A]">{a.commissionRate}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {s ? fmt(s.total) : <span className="text-[#aaa] dark:text-[#555]">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {s ? fmt(s.pending) : <span className="text-[#aaa] dark:text-[#555]">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {s ? fmt(s.released) : <span className="text-[#aaa] dark:text-[#555]">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-black tracking-[0.08em] uppercase px-2 py-1 ${
                        a.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
