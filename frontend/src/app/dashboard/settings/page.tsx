'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Pencil, X, DatabaseBackup } from 'lucide-react';
import api from '@/lib/api';

const serviceSchema = z.object({
  name:         z.string().min(2, 'Min 2 characters'),
  description:  z.string().min(10, 'Min 10 characters'),
  pricePerHour: z.coerce.number().min(0, 'Enter valid price'),
  minDuration:  z.coerce.number().min(1, 'Min 1 hour'),
});
type ServiceForm = z.infer<typeof serviceSchema>;

const SERVICE_TYPE_LABELS: Record<string, string> = {
  PODCAST:       'Podcast',
  VFX_PODCAST:   'VFX Podcast',
  MONOLOGUE:     'Monologue',
  NEWS_SHOOT:    'News Shoot',
  ONLINE_CLASS:  'Online Class',
  PRODUCT_SHOOT: 'Product Shoot',
};

export default function SettingsPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  const runBackup = async () => {
    setBackingUp(true);
    try {
      const res = await api.post('/backup/run');
      toast.success(`Backup complete (${res.data.sizeKB} KB) — saved to Cloudinary and emailed to admin`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Backup failed');
    } finally {
      setBackingUp(false);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  const load = () => {
    setLoading(true);
    api.get('/services')
      .then(r => setServices(r.data))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (svc: any) => {
    setEditing(svc);
    reset({
      name:         svc.name,
      description:  svc.description,
      pricePerHour: svc.pricePerHour,
      minDuration:  svc.minDuration,
    });
  };

  const onSave = async (data: ServiceForm) => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/services/${editing.id}`, data);
      toast.success(`${data.name} updated`);
      load();
      setEditing(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Studio Configuration</p>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* ── Data Backup ── */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a]">
        <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#888] dark:text-[#999]">Data Backup</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-[#6b6b6b] dark:text-[#b0b0b0] max-w-md">
            An automatic backup of all bookings, customers, payments and invoices runs every night at 3 AM and is emailed to the admin. You can also run one manually right now.
          </p>
          <button
            type="button"
            onClick={runBackup}
            disabled={backingUp}
            className="btn-primary !w-auto flex items-center gap-2 disabled:opacity-50"
          >
            <DatabaseBackup size={15} /> {backingUp ? 'Backing up…' : 'Run Backup Now'}
          </button>
        </div>
      </div>

      {/* ── Service Pricing ── */}
      <div className="border border-[#e5e5e5] dark:border-[#2a2a2a]">

        <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
          <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#888] dark:text-[#999]">Service Pricing</p>
        </div>

        {loading ? (
          <div className="p-5 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#888] dark:text-[#999] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Description</th>
                  <th className="px-5 py-3 text-right">Price / Hr</th>
                  <th className="px-5 py-3 text-right">Min Hrs</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
                {services.map(svc => (
                  <tr key={svc.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-black text-gray-900 dark:text-white">{svc.name}</p>
                      <p className="text-[10px] font-black tracking-[0.08em] uppercase text-[#888] dark:text-[#999] mt-0.5">
                        {SERVICE_TYPE_LABELS[svc.type] ?? svc.type}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell max-w-xs">
                      <p className="line-clamp-2 text-xs text-[#6b6b6b] dark:text-[#b0b0b0]">{svc.description}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gray-900 dark:text-white whitespace-nowrap">
                      ₹{Number(svc.pricePerHour).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right text-[#6b6b6b] dark:text-[#b0b0b0]">
                      {svc.minDuration}h
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-[10px] font-black tracking-[0.06em] uppercase px-2 py-1 ${
                        svc.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-[#f5f5f5] dark:bg-[#2a2a2a] text-[#888] dark:text-[#999]'
                      }`}>
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openEdit(svc)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#6b6b6b] dark:text-[#b0b0b0] hover:text-[#E5312A] dark:hover:text-[#E5312A] transition-colors ml-auto"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-white dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#2a2a2a]">

            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-[#f9f9f9] dark:bg-[#161616]">
              <div>
                <p className="text-[10px] font-black tracking-[0.15em] uppercase text-[#888] dark:text-[#999]">
                  {SERVICE_TYPE_LABELS[editing.type] ?? editing.type}
                </p>
                <h2 className="font-black text-gray-900 dark:text-white mt-0.5">Edit Service</h2>
              </div>
              <button onClick={() => setEditing(null)} className="text-[#888] hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">

              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#888] dark:text-[#999] mb-1.5">Display Name</label>
                <input {...register('name')} className="input-field" />
                {errors.name && <p className="text-[#E5312A] text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#888] dark:text-[#999] mb-1.5">Description</label>
                <textarea {...register('description')} rows={3} className="input-field resize-none" />
                {errors.description && <p className="text-[#E5312A] text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#888] dark:text-[#999] mb-1.5">Price / Hour (₹)</label>
                  <input {...register('pricePerHour')} type="number" className="input-field" />
                  {errors.pricePerHour && <p className="text-[#E5312A] text-xs mt-1">{errors.pricePerHour.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#888] dark:text-[#999] mb-1.5">Min Duration (hrs)</label>
                  <input {...register('minDuration')} type="number" className="input-field" />
                  {errors.minDuration && <p className="text-[#E5312A] text-xs mt-1">{errors.minDuration.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-3 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#b0b0b0] hover:border-gray-400 transition-colors"
                >
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
