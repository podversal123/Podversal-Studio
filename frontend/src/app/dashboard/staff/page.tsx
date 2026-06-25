'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, X, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone:    z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit number').optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

export default function StaffPage() {
  const [staff,     setStaff]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [showPass,  setShowPass]  = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const load = () => {
    api.get('/auth/managers')
      .then(r => setStaff(r.data))
      .catch(() => toast.error('Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onSubmit = async (values: Form) => {
    setSaving(true);
    try {
      await api.post('/auth/create-staff', {
        name:     values.name,
        email:    values.email,
        password: values.password,
        phone:    values.phone || undefined,
      });
      toast.success('Studio Manager added successfully');
      reset();
      setShowModal(false);
      setLoading(true);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Team Management</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Studio Managers</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {staff.length} manager{staff.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 w-auto shrink-0">
          <Plus size={15} /> Add Manager
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="font-bold text-gray-900 dark:text-white mb-1">No studio managers yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">Click "Add Manager" to create a studio manager account.</p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 hidden md:table-cell">Phone</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {staff.map(s => (
                <tr key={s.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">{s.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-[#6b6b6b] dark:text-[#8a8a8a]">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black tracking-[0.08em] uppercase px-2 py-1 ${
                      s.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Manager Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#111] border border-[#e5e5e5] dark:border-[#2a2a2a] w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
              <h2 className="text-base font-black text-gray-900 dark:text-white">Add Studio Manager</h2>
              <button onClick={() => { setShowModal(false); reset(); }} className="text-[#aaa] hover:text-gray-700 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Full Name *</label>
                <input {...register('name')} className="input-field" placeholder="Full name" />
                {errors.name && <p className="text-[#E5312A] text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Email *</label>
                <input {...register('email')} type="email" className="input-field" placeholder="Email address" />
                {errors.email && <p className="text-[#E5312A] text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Password *</label>
                <div className="relative">
                  <input {...register('password')} type={showPass ? 'text' : 'password'} className="input-field pr-10" placeholder="Set initial password" />
                  <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p className="text-[#E5312A] text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.15em] uppercase text-[#6b6b6b] dark:text-[#888] mb-2">Mobile Number</label>
                <input {...register('phone')} type="tel" className="input-field" placeholder="98xxxxxxxx (optional)" />
                {errors.phone && <p className="text-[#E5312A] text-xs mt-1">{errors.phone.message}</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary px-6 w-auto">
                  {saving ? 'Adding…' : 'Add Manager'}
                </button>
                <button type="button" onClick={() => { setShowModal(false); reset(); }}
                  className="px-5 py-2.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-semibold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
