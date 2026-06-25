'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Trash2, Upload, Link as LinkIcon, ImageIcon, Plus, X } from 'lucide-react';
import { cldUpload } from '@/lib/cloudinary-widget';

interface GalleryImage {
  id: string; title: string | null; imageUrl: string;
  category: string; isPublished: boolean; source: string;
  uploadedBy: string; createdAt: string;
}

const CATEGORIES = [
  'General', 'Podcast', 'VFX', 'News Shoot', 'Monologue',
  'Online Class', 'Product Shoot', 'Behind the Scenes',
];

export default function DashboardGalleryPage() {
  const [images,    setImages]    = useState<GalleryImage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [tab,       setTab]       = useState<'url' | 'cloudinary'>('cloudinary');
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: '', imageUrl: '', category: 'General', isPublished: true,
  });

  const fetchImages = () => {
    setLoading(true);
    api.get<GalleryImage[]>('/gallery')
      .then(r => setImages(r.data))
      .catch(() => toast.error('Failed to load gallery'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchImages(); }, []);

  const openModal = () => {
    setForm({ title: '', imageUrl: '', category: 'General', isPublished: true });
    setTab('cloudinary');
    setModal(true);
  };

  // --- URL submit ---
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) { toast.error('Image URL is required'); return; }
    setSaving(true);
    try {
      await api.post('/gallery', { ...form, source: 'URL' });
      toast.success('Image added');
      setModal(false);
      fetchImages();
    } catch { toast.error('Failed to add image'); }
    finally { setSaving(false); }
  };

  // --- Cloudinary upload ---
  const handleCloudinaryUpload = () => {
    setUploading(true);
    cldUpload(
      { folder: 'gallery', resourceType: 'image', multiple: true, sources: ['local', 'url', 'camera'] },
      async (info) => {
        const optimistic: GalleryImage = {
          id:          `optimistic-${Date.now()}`,
          title:       info.original_filename || null,
          imageUrl:    info.secure_url,
          category:    form.category,
          isPublished: true,
          source:      'CLOUDINARY',
          uploadedBy:  '',
          createdAt:   new Date().toISOString(),
        };
        setImages(prev => [optimistic, ...prev]);
        try {
          await api.post('/gallery', {
            title:       info.original_filename || null,
            imageUrl:    info.secure_url,
            category:    form.category,
            isPublished: true,
            source:      'CLOUDINARY',
          });
          fetchImages();
        } catch (err: any) {
          setImages(prev => prev.filter(i => i.id !== optimistic.id));
          toast.error(err?.response?.data?.message || 'Save failed — please try again');
        }
      },
      () => { setUploading(false); toast.error('Upload failed'); },
    );
    setTimeout(() => setUploading(false), 400);
  };

  // --- Toggle / Delete ---
  const togglePublish = async (img: GalleryImage) => {
    setImages(prev => prev.map(i => i.id === img.id ? { ...i, isPublished: !i.isPublished } : i));
    try {
      await api.patch(`/gallery/${img.id}`, { isPublished: !img.isPublished });
      toast.success(img.isPublished ? 'Hidden' : 'Published');
    } catch { toast.error('Failed to update'); fetchImages(); }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    setImages(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/gallery/${id}`);
      toast.success('Image deleted');
    } catch { toast.error('Failed to delete'); fetchImages(); }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Content</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Studio Gallery</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {images.length} photo{images.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={openModal} className="btn-primary !w-auto flex items-center gap-2">
          <Plus size={16} /> Add Photo
        </button>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-[#f5f5f5] dark:bg-[#181818] animate-pulse" />)}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 border border-[#e5e5e5] dark:border-[#2a2a2a]">
          <ImageIcon size={32} className="mx-auto mb-3 text-[#e5e5e5] dark:text-[#3a3a3a]" />
          <p className="font-bold text-gray-900 dark:text-white mb-1">No photos yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">Click Add Photo to upload your first studio photo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map(img => (
            <div key={img.id} className={`border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] overflow-hidden ${!img.isPublished ? 'opacity-60' : ''}`}>
              <div className="aspect-square overflow-hidden bg-[#f5f5f5] dark:bg-[#181818]">
                <img
                  src={img.imageUrl}
                  alt={img.title ?? 'Gallery'}
                  className="w-full h-full object-cover"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div className="px-2.5 pt-2 pb-1">
                {img.title && <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{img.title}</p>}
                <p className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide">{img.category}</p>
              </div>
              <div className="flex items-center gap-1 px-2 pb-2">
                <button
                  onClick={() => togglePublish(img)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold uppercase tracking-wide border border-[#e5e5e5] dark:border-[#2a2a2a] text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#E5312A] hover:text-[#E5312A] transition-colors"
                >
                  {img.isPublished ? <><EyeOff size={11} /> Hide</> : <><Eye size={11} /> Show</>}
                </button>
                <button
                  onClick={() => deleteImage(img.id)}
                  className="p-1.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-[#E5312A] hover:bg-[#E5312A] hover:text-white hover:border-[#E5312A] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-lg bg-white dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#2a2a2a]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
              <h2 className="font-black text-gray-900 dark:text-white">Add Photo</h2>
              <button onClick={() => setModal(false)} className="text-[#aaa] hover:text-gray-900 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
              <button
                onClick={() => setTab('cloudinary')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                  tab === 'cloudinary' ? 'border-[#E5312A] text-[#E5312A]' : 'border-transparent text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Upload size={14} /> Upload
              </button>
              <button
                onClick={() => setTab('url')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors ${
                  tab === 'url' ? 'border-[#E5312A] text-[#E5312A]' : 'border-transparent text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon size={14} /> Add via URL
              </button>
            </div>

            <div className="p-5">
              {tab === 'cloudinary' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={handleCloudinaryUpload}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-[#e5e5e5] dark:border-[#2a2a2a] hover:border-[#E5312A] hover:bg-[#E5312A]/5 transition-colors py-10 flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-[#E5312A]/10 flex items-center justify-center">
                      <Upload size={22} className="text-[#E5312A]" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{uploading ? 'Opening…' : 'Click to Upload Photos'}</p>
                      <p className="text-xs text-[#aaa] dark:text-[#555] mt-1">JPG, PNG, WebP · Multiple files supported</p>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Title <span className="font-normal normal-case">(optional)</span></label>
                      <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Podcast setup" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Image URL *</label>
                    <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." required className="input-field" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 dark:bg-[#2a2a2a] peer-checked:bg-[#E5312A] rounded-full peer transition-colors" />
                      <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4" />
                    </label>
                    <span className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">{form.isPublished ? 'Published' : 'Hidden'}</span>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                      {saving ? 'Adding…' : 'Add Image'}
                    </button>
                    <button type="button" onClick={() => setModal(false)} className="px-4 py-2.5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-gray-400 transition-colors">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
