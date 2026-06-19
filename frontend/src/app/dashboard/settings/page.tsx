'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const serviceSchema = z.object({
  name:         z.string().min(2),
  description:  z.string().min(10),
  pricePerHour: z.coerce.number().min(0),
  minDuration:  z.coerce.number().min(1),
});
type ServiceForm = z.infer<typeof serviceSchema>;

export default function SettingsPage() {
  const [services,  setServices]  = useState<any[]>([]);
  const [editing,   setEditing]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    api.get('/services').then(r => setServices(r.data))
      .catch(() => toast.error('Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (service: any) => {
    setEditing(service);
    reset({
      name:         service.name,
      description:  service.description,
      pricePerHour: service.pricePerHour,
      minDuration:  service.minDuration,
    });
  };

  const onSave = async (data: ServiceForm) => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/services/${editing.id}`, data);
      toast.success(`${data.name} updated`);
      const r = await api.get('/services');
      setServices(r.data);
      setEditing(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const SERVICE_TYPES: Record<string, string> = {
    PODCAST:       'Podcast',
    VFX_PODCAST:   'VFX Podcast',
    MONOLOGUE:     'Monologue',
    NEWS_SHOOT:    'News Shoot',
    ONLINE_CLASS:  'Online Class',
    PRODUCT_SHOOT: 'Product Shoot',
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Pricing</h2>
        <p className="text-sm text-gray-500 dark:text-[#a0a0a0] mb-4">Manage pricing and details for each studio service.</p>

        {loading ? (
          <div className="text-center text-gray-400 dark:text-[#555] py-8">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(svc => (
              <div key={svc.id} className={`card transition-all ${editing?.id === svc.id ? 'ring-2 ring-[#E5312A]' : ''}`}>
                {editing?.id === svc.id ? (
                  <form onSubmit={handleSubmit(onSave)} className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-gray-400 dark:text-[#555] uppercase">{svc.type}</span>
                      <button type="button" onClick={() => setEditing(null)} className="text-gray-400 dark:text-[#555] hover:text-gray-600 dark:hover:text-[#a0a0a0] text-lg">×</button>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-[#a0a0a0]">Display Name</label>
                      <input {...register('name')} className="input-field" />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-[#a0a0a0]">Description</label>
                      <textarea {...register('description')} rows={2} className="input-field resize-none" />
                      {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-[#a0a0a0]">Price/Hour (₹)</label>
                        <input {...register('pricePerHour')} type="number" className="input-field" />
                        {errors.pricePerHour && <p className="text-xs text-red-500 mt-1">{errors.pricePerHour.message}</p>}
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-[#a0a0a0]">Min Duration (hrs)</label>
                        <input {...register('minDuration')} type="number" className="input-field" />
                        {errors.minDuration && <p className="text-xs text-red-500 mt-1">{errors.minDuration.message}</p>}
                      </div>
                    </div>
                    <button type="submit" disabled={saving} className="btn-primary w-full text-sm">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono text-gray-400 dark:text-[#555] uppercase">{svc.type}</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{svc.name}</h3>
                      </div>
                      <button onClick={() => startEdit(svc)} className="text-sm text-[#E5312A] hover:text-[#b51d1d] font-medium">
                        Edit
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1 line-clamp-2">{svc.description}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-gray-400 dark:text-[#555]">Price: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{Number(svc.pricePerHour).toLocaleString('en-IN')}/hr</span>
                      </div>
                      <div>
                        <span className="text-gray-400 dark:text-[#555]">Min: </span>
                        <span className="font-semibold text-gray-900 dark:text-white">{svc.minDuration}h</span>
                      </div>
                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${svc.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-[#2a2a2a] text-gray-500 dark:text-[#666]'}`}>
                          {svc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
