'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Play } from 'lucide-react';

interface StudioVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeId: string | null;
  thumbnailUrl: string | null;
  category: string;
  isPublished: boolean;
  sortOrder: number;
}

const EMPTY = {
  title: '', description: '', youtubeId: '',
  thumbnailUrl: '', category: 'General',
  isPublished: false, sortOrder: 0,
};

export default function VideosAdminPage() {
  const [videos,  setVideos]  = useState<StudioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    api.get<StudioVideo[]>('/studio-videos').then(r => setVideos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ ...EMPTY, sortOrder: videos.length });
    setEditId(null);
    setModal('create');
  };

  const openEdit = (v: StudioVideo) => {
    setForm({
      title:        v.title,
      description:  v.description ?? '',
      youtubeId:    v.youtubeId ?? '',
      thumbnailUrl: v.thumbnailUrl ?? '',
      category:     v.category,
      isPublished:  v.isPublished,
      sortOrder:    v.sortOrder,
    });
    setEditId(v.id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    if (!form.youtubeId) { toast.error('YouTube video ID is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        description:  form.description  || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
      };
      if (modal === 'create') {
        await api.post('/studio-videos', payload);
        toast.success('Video added');
      } else {
        await api.patch(`/studio-videos/${editId}`, payload);
        toast.success('Video updated');
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}" from the showcase?`)) return;
    try {
      await api.delete(`/studio-videos/${id}`);
      toast.success('Video removed');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleToggle = async (v: StudioVideo) => {
    try {
      await api.patch(`/studio-videos/${v.id}`, { isPublished: !v.isPublished });
      toast.success(v.isPublished ? 'Video hidden' : 'Video published');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Studio Videos</h1>
          <p className="text-sm text-gray-500 dark:text-[#a0a0a0] mt-1">
            {videos.filter(v => v.isPublished).length} visible on homepage · {videos.filter(v => !v.isPublished).length} hidden
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary !w-auto flex items-center gap-2">
          <Plus size={16} /> Add Video
        </button>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>How to add a YouTube video:</strong> Go to the video on YouTube, copy the ID from the URL
        (e.g. youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>) and paste only the ID part here.
        The thumbnail is fetched automatically from YouTube if you don&apos;t provide one.
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl animate-pulse" />)}
        </div>
      ) : videos.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Play size={40} className="mx-auto mb-3 text-gray-200 dark:text-[#3a3a3a]" />
          <p className="text-lg font-medium text-gray-500 dark:text-[#a0a0a0] mb-1">No videos yet</p>
          <p className="text-sm text-gray-400 dark:text-[#555]">Add YouTube video IDs to display them on the homepage</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(v => (
            <div key={v.id} className="card p-0 overflow-hidden">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100 dark:bg-[#1a1a1a]">
                {v.youtubeId ? (
                  <img
                    src={v.thumbnailUrl ?? `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`}
                    alt={v.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={28} className="text-gray-300" />
                  </div>
                )}
                {/* Published badge */}
                <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${v.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {v.isPublished ? 'Live' : 'Hidden'}
                </span>
                <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded-full">
                  {v.category}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">{v.title}</h3>
                {v.youtubeId && (
                  <p className="text-xs text-gray-400 dark:text-[#555] font-mono mt-0.5">ID: {v.youtubeId}</p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => handleToggle(v)} title={v.isPublished ? 'Hide' : 'Show'} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-[#a0a0a0] transition-colors">
                    {v.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  {v.youtubeId && (
                    <a href={`https://www.youtube.com/watch?v=${v.youtubeId}`} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Watch on YouTube">
                      <Play size={15} />
                    </a>
                  )}
                  <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                    <Edit size={15} />
                  </button>
                  <button onClick={() => handleDelete(v.id, v.title)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Remove">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 px-4">
          <div className="bg-white dark:bg-[#131313] rounded-2xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-[#3a3a3a]">
            <div className="p-6 border-b border-gray-100 dark:border-[#3a3a3a] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modal === 'create' ? 'Add Video' : 'Edit Video'}
              </h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-gray-500 dark:text-[#a0a0a0]">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" placeholder="e.g. Podcast Session — Episode 5" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">YouTube Video ID *</label>
                <input value={form.youtubeId} onChange={e => setForm(f => ({ ...f, youtubeId: e.target.value.trim() }))} className="input-field font-mono" placeholder="dQw4w9WgXcQ" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                    {['Podcast', 'VFX', 'News Shoot', 'Monologue', 'Online Class', 'Product Shoot', 'General'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="input-field" min={0} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">Description (optional)</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-field resize-none" placeholder="Short description of this video" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-[#a0a0a0] mb-1">Custom Thumbnail URL (optional)</label>
                <input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))} className="input-field" placeholder="Leave empty to use YouTube's auto thumbnail" />
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="vPublished" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="vPublished" className="text-sm font-medium text-gray-700">Show on homepage immediately</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-[#3a3a3a] flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-[#3a3a3a] text-sm font-medium text-gray-700 dark:text-[#a0a0a0] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary !w-auto px-6">
                {saving ? 'Saving...' : modal === 'create' ? 'Add Video' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
