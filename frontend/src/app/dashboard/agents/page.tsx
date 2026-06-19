'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AgentsPage() {
  const [agents,   setAgents]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [summary,  setSummary]  = useState<any>(null);

  useEffect(() => {
    api.get('/agents').then(r => setAgents(r.data))
      .catch(() => toast.error('Failed to load agents'))
      .finally(() => setLoading(false));
  }, []);

  const openAgent = async (a: any) => {
    setSelected(a);
    setSummary(null);
    try {
      const r = await api.get(`/agents/${a.id}/commission-summary`);
      setSummary(r.data);
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Referral Agents</h1>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-[#a0a0a0] py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Agent</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Contact</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Commission Rate</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-gray-400 dark:text-[#555] py-8">No agents found</td></tr>
                  ) : agents.map(a => (
                    <tr
                      key={a.id}
                      onClick={() => openAgent(a)}
                      className={`border-b border-gray-50 dark:border-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${selected?.id === a.id ? 'bg-[#E5312A]/5 dark:bg-[#E5312A]/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{a.user?.name ?? '—'}</div>
                        <div className="text-gray-500 dark:text-[#666] text-xs">{a.agencyName}</div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-gray-600 dark:text-[#a0a0a0]">
                        <div>{a.user?.email}</div>
                        <div className="text-gray-500 dark:text-[#666]">{a.user?.phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-[#E5312A]">{a.commissionRate}%</span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Detail Panel */}
          <div>
            {selected ? (
              <div className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{selected.user?.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">{selected.agencyName}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#a0a0a0] text-xl">×</button>
                </div>

                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Email</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{selected.user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Commission Rate</dt>
                    <dd className="font-semibold text-[#E5312A] text-lg">{selected.commissionRate}%</dd>
                  </div>
                </dl>

                {summary ? (
                  <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-[#3a3a3a]">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-[#a0a0a0]">Commission Summary</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-[#666]">Total Earned</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{Number(summary.total ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-[#666]">Pending</span>
                        <span className="font-semibold text-yellow-600 dark:text-yellow-400">₹{Number(summary.pending ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-[#666]">Released</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">₹{Number(summary.released ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 dark:text-[#555] text-sm pt-2">Loading summary...</div>
                )}
              </div>
            ) : (
              <div className="card text-center text-gray-400 dark:text-[#555] py-8">
                <p className="text-sm">Select an agent to view commission details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
