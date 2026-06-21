'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Trash2, Upload, Link as LinkIcon } from 'lucide-react';

interface GalleryImage {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string;
  isPublished: boolean;
  source: string;
  uploadedBy: string;
  createdAt: string;
}

const CATEGORIES = [
  'General', 'Podcast', 'VFX', 'News Shoot', 'Monologue',
  'Online Class', 'Product Shoot', 'Behind the Scenes',
];

type TabMode = 'url' | 'cloudinary';

export default function DashboardGalleryPage() {
  const [images,  setImages]  = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<TabMode>('url');
  const [saving,  setSaving]  = useState(false);

  const [form, setForm] = useState({
    title: '',
    imageUrl: '',
    category: 'General',
    isPublished: true,
    source: 'URL',
  });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const fetchImages = () => {
    setLoading(true);
    api.get<GalleryImage[]>('/gallery')
      .then(r => setImages(r.data))
      .catch(() => toast.error('Failed to load gallery'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Load Cloudinary widget script
  useEffect(() => {
    if (!cloudName) return;
    if (document.getElementById('cloudinary-widget-script')) return;
    const script = document.createElement('script');
    script.id  = 'cloudinary-widget-script';
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    document.body.appendChild(script);
  }, [cloudName]);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) {
      toast.error('Image URL is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/gallery', { ...form, source: 'URL' });
      toast.success('Image added');
      setForm({ title: '', imageUrl: '', category: 'General', isPublished: true, source: 'URL' });
      fetchImages();
    } catch {
      toast.error('Failed to add image');
    } finally {
      setSaving(false);
    }
  };

  const openCloudinaryWidget = () => {
    if (!(window as any).cloudinary) {
      toast.error('Cloudinary widget not loaded yet. Please try again.');
      return;
    }
    (window as any).cloudinary.openUploadWidget(
      {
        cloud_name:    cloudName,
        upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'podversal_gallery',
        sources:       ['local', 'url', 'camera'],
        multiple:      true,
        folder:        'gallery',
        cropping:      false,
        styles: {
          palette: {
            action: '#E5312A',
            link:   '#E5312A',
          },
        },
      },
      async (error: any, result: any) => {
        if (error) {
          toast.error('Upload failed');
          return;
        }
        if (result.event === 'success') {
          const info = result.info;
          try {
            await api.post('/gallery', {
              title:       info.original_filename || null,
              imageUrl:    info.secure_url,
              category:    'General',
              isPublished: true,
              source:      'CLOUDINARY',
            });
            toast.success('Image uploaded and saved');
            fetchImages();
          } catch {
            toast.error('Upload succeeded but failed to save');
          }
        }
      },
    );
  };

  const togglePublish = async (img: GalleryImage) => {
    try {
      await api.patch(`/gallery/${img.id}`, { isPublished: !img.isPublished });
      toast.success(img.isPublished ? 'Hidden from gallery' : 'Published to gallery');
      setImages(prev => prev.map(i => i.id === img.id ? { ...i, isPublished: !i.isPublished } : i));
    } catch {
      toast.error('Failed to update');
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm('Delete this image? This cannot be undone.')) return;
    try {
      await api.delete(`/gallery/${id}`);
      toast.success('Image deleted');
      setImages(prev => prev.filter(i => i.id !== id));
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Studio Gallery</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {images.length} image{images.length !== 1 ? 's' : ''} total
          </p>
        </div>
      </div>

      {/* Add Image Section */}
      <div className="bg-white dark:bg-[#0f0f0f] border border-[#e5e5e5] dark:border-[#2a2a2a]">
        {/* Tabs */}
        <div className="flex border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
          <button
            onClick={() => setTab('url')}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-colors border-b-2 ${
              tab === 'url'
                ? 'border-[#E5312A] text-[#E5312A]'
                : 'border-transparent text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LinkIcon size={15} />
            Add via URL
          </button>
          {cloudName && (
            <button
              onClick={() => setTab('cloudinary')}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold transition-colors border-b-2 ${
                tab === 'cloudinary'
                  ? 'border-[#E5312A] text-[#E5312A]'
                  : 'border-transparent text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Upload size={15} />
              Upload to Cloudinary
            </button>
          )}
        </div>

        <div className="p-6">
          {tab === 'url' ? (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] uppercase tracking-wide mb-1.5">
                    Title <span className="font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Podcast setup — Studio A"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-field"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6b6b6b] dark:text-[#8a8a8a] uppercase tracking-wide mb-1.5">
                  Image URL <span className="text-[#E5312A]">*</span>
                </label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  required
                  className="input-field"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-[#2a2a2a] peer-focus:outline-none peer-checked:bg-[#E5312A] rounded-full peer transition-colors" />
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                  {form.isPublished ? 'Published' : 'Hidden'}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Image'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-[#f5f5f5] dark:bg-[#181818] rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload size={28} className="text-[#6b6b6b] dark:text-[#8a8a8a]" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Upload from your computer</h3>
              <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mb-6 max-w-xs mx-auto">
                Images will be stored on Cloudinary and automatically saved to the gallery.
              </p>
              <button
                onClick={openCloudinaryWidget}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Upload size={15} />
                Upload from Computer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="aspect-square bg-[#f5f5f5] dark:bg-[#181818] animate-pulse" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 border border-[#e5e5e5] dark:border-[#2a2a2a]">
          <p className="text-gray-900 dark:text-white font-bold mb-2">No images yet</p>
          <p className="text-[#6b6b6b] dark:text-[#8a8a8a] text-sm">Add your first studio photo above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {images.map(img => (
            <div
              key={img.id}
              className={`relative group border ${
                img.isPublished
                  ? 'border-[#e5e5e5] dark:border-[#2a2a2a]'
                  : 'border-[#e5e5e5] dark:border-[#2a2a2a] opacity-50'
              }`}
            >
              <div className="aspect-square overflow-hidden bg-[#f5f5f5] dark:bg-[#181818]">
                <img
                  src={img.imageUrl}
                  alt={img.title ?? 'Gallery image'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3C/svg%3E';
                  }}
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => togglePublish(img)}
                  title={img.isPublished ? 'Hide' : 'Publish'}
                  className="p-2 bg-white/90 hover:bg-white text-gray-900 transition-colors"
                >
                  {img.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => deleteImage(img.id)}
                  title="Delete"
                  className="p-2 bg-[#E5312A] hover:bg-[#CC2A24] text-white transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Info */}
              {img.title && (
                <div className="p-2 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{img.title}</p>
                  <p className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide">{img.category}</p>
                </div>
              )}
              {!img.title && (
                <div className="p-2 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
                  <p className="text-[10px] text-[#aaa] dark:text-[#555] uppercase tracking-wide">{img.category}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
