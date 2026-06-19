'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<any>(null);
  const [schedule,  setSchedule]  = useState<any[]>([]);
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  const openEmployee = async (emp: any) => {
    setSelected(emp);
    setSchedule([]);
    try {
      const r = await api.get(`/employees/${emp.id}/schedule?date=${date}`);
      setSchedule(r.data);
    } catch {}
  };

  const loadSchedule = async () => {
    if (!selected) return;
    try {
      const r = await api.get(`/employees/${selected.id}/schedule?date=${date}`);
      setSchedule(r.data);
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Employees</h1>

      {loading ? (
        <div className="text-center text-gray-500 dark:text-[#a0a0a0] py-12">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee List */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-[#3a3a3a]">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Name</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden sm:table-cell">Email</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium">Role</th>
                    <th className="text-left py-3 px-4 text-gray-600 dark:text-[#a0a0a0] font-medium hidden md:table-cell">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 ? (
                    <tr><td colSpan={4} className="text-center text-gray-400 dark:text-[#555] py-8">No employees found</td></tr>
                  ) : employees.map(emp => (
                    <tr
                      key={emp.id}
                      onClick={() => openEmployee(emp)}
                      className={`border-b border-gray-50 dark:border-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${selected?.id === emp.id ? 'bg-[#E5312A]/5 dark:bg-[#E5312A]/10' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-white">{emp.user?.name ?? '—'}</div>
                      </td>
                      <td className="py-3 px-4 hidden sm:table-cell text-gray-600 dark:text-[#a0a0a0]">{emp.user?.email}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-[#a0a0a0]">{emp.jobTitle ?? '—'}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                          {emp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Employee Detail */}
          <div>
            {selected ? (
              <div className="card space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-lg">{selected.user?.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-[#a0a0a0]">{selected.jobTitle ?? 'Staff'}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#a0a0a0] text-xl">×</button>
                </div>

                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Email</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{selected.user?.email}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 dark:text-[#666]">Phone</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{selected.user?.phone ?? '—'}</dd>
                  </div>
                </dl>

                <div className="pt-2 border-t border-gray-100 dark:border-[#3a3a3a]">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-[#a0a0a0] mb-2">Schedule</h3>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="input-field flex-1 text-sm"
                    />
                    <button onClick={loadSchedule} className="btn-primary text-sm px-3">View</button>
                  </div>
                  {schedule.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-[#555] mt-3 text-center">No bookings on this date</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {schedule.map((b: any) => (
                        <div key={b.id} className="text-xs p-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-lg border border-gray-100 dark:border-[#3a3a3a]">
                          <div className="font-medium text-gray-900 dark:text-white">{b.bookingCode}</div>
                          <div className="text-gray-500 dark:text-[#666]">{b.startTime} – {b.endTime}</div>
                          <div className="text-gray-500 dark:text-[#666]">{b.service?.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card text-center text-gray-400 dark:text-[#555] py-8">
                <p className="text-sm">Select an employee to view schedule</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
