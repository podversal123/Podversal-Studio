'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    api.get('/employees')
      .then(r => setEmployees(r.data))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Team Management</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Employees</h1>
        <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
          {employees.length} employee{employees.length !== 1 ? 's' : ''} total
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="font-bold text-gray-900 dark:text-white mb-1">No employees yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">Add employees via Settings → Team.</p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3">Role / Title</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900 dark:text-white">{emp.user?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">
                    {emp.user?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b] dark:text-[#8a8a8a]">
                    {emp.jobTitle ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black tracking-[0.08em] uppercase px-2 py-1 ${
                      emp.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
