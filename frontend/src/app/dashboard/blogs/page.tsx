'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Upload } from 'lucide-react';
import { cldUpload } from '@/lib/cloudinary-widget';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  isPublished: boolean;
  publishedAt: string | null;
  author: { name: string };
}

const EMPTY: Omit<Blog, 'id' | 'author' | 'publishedAt'> = {
  title: '', slug: '', excerpt: '', content: '',
  coverImage: '', category: 'General', tags: [], isPublished: false,
};

export default function BlogsAdminPage() {
  const [posts,          setPosts]          = useState<Blog[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState<'create' | 'edit' | null>(null);
  const [form,           setForm]           = useState({ ...EMPTY });
  const [editId,         setEditId]         = useState<string | null>(null);
  const [saving,         setSaving]         = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Blog[]>('/blogs').then(r => setPosts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCoverUpload = () => {
    setUploadingCover(true);
    cldUpload(
      { folder: 'blog-covers', resourceType: 'image', multiple: false, sources: ['local', 'url', 'camera'] },
      (info) => {
        setUploadingCover(false);
        setForm(f => ({ ...f, coverImage: info.secure_url }));
        toast.success('Cover image uploaded');
      },
      () => { setUploadingCover(false); toast.error('Upload failed'); },
    );
  };

  const openCreate = () => {
    setForm({ ...EMPTY });
    setEditId(null);
    setModal('create');
  };

  const openEdit = (post: Blog) => {
    setForm({
      title:       post.title,
      slug:        post.slug,
      excerpt:     post.excerpt,
      content:     post.content,
      coverImage:  post.coverImage ?? '',
      category:    post.category,
      tags:        post.tags,
      isPublished: post.isPublished,
    });
    setEditId(post.id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.excerpt || !form.content) {
      toast.error('Title, slug, excerpt and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, coverImage: form.coverImage || undefined };
      if (modal === 'create') {
        await api.post('/blogs', payload);
        toast.success('Blog post created');
      } else {
        await api.patch(`/blogs/${editId}`, payload);
        toast.success('Blog post updated');
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
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setPosts(prev => prev.filter(p => p.id !== id));
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Post deleted');
    } catch {
      toast.error('Delete failed');
      load();
    }
  };

  const handleTogglePublish = async (post: Blog) => {
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, isPublished: !p.isPublished } : p));
    try {
      await api.patch(`/blogs/${post.id}`, { isPublished: !post.isPublished });
      toast.success(post.isPublished ? 'Post unpublished' : 'Post published');
    } catch {
      toast.error('Update failed');
      load();
    }
  };

  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, title, slug }));
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">Content</p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Blog Posts</h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {posts.filter(p => p.isPublished).length} published · {posts.filter(p => !p.isPublished).length} drafts
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary !w-auto flex items-center gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {/* Posts table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <p className="font-bold text-gray-900 dark:text-white mb-1">No blog posts yet</p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">Click &quot;New Post&quot; to create your first article</p>
        </div>
      ) : (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-black tracking-[0.1em] uppercase text-[#aaa] dark:text-[#555] bg-[#f9f9f9] dark:bg-[#161616] border-b border-[#e5e5e5] dark:border-[#2a2a2a]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 hidden md:table-cell">Author</th>
                <th className="px-4 py-3 hidden lg:table-cell">Published</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1e1e1e]">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-[#fafafa] dark:hover:bg-[#161616] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-bold text-gray-900 dark:text-white line-clamp-1">{post.title}</p>
                    <p className="text-[10px] text-[#aaa] dark:text-[#555] font-mono mt-0.5">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[10px] font-black tracking-[0.1em] uppercase text-[#E5312A]">{post.category}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">{post.author?.name}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#6b6b6b] dark:text-[#8a8a8a]">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-black tracking-[0.08em] uppercase px-2 py-1 ${
                      post.isPublished
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}>
                      {post.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleTogglePublish(post)} title={post.isPublished ? 'Unpublish' : 'Publish'} className="p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#6b6b6b] dark:text-[#8a8a8a] transition-colors">
                        {post.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" title="View live post" className="p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#6b6b6b] dark:text-[#8a8a8a] transition-colors">
                        <ExternalLink size={14} />
                      </a>
                      <button onClick={() => openEdit(post)} title="Edit" className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(post.id, post.title)} title="Delete" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-[#E5312A] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4">
          <div className="bg-white dark:bg-[#111111] border border-[#e5e5e5] dark:border-[#2a2a2a] w-full max-w-2xl">

            {/* Modal header */}
            <div className="px-6 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between">
              <h2 className="font-black text-gray-900 dark:text-white">
                {modal === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
              </h2>
              <button onClick={() => setModal(null)} className="text-[#aaa] hover:text-gray-900 dark:hover:text-white text-lg leading-none transition-colors">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => handleTitleChange(e.target.value)} className="input-field" placeholder="Your post title" />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Slug *</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="input-field font-mono text-sm" placeholder="url-friendly-slug" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Category</label>
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field" placeholder="e.g. Tips, Behind the Scenes" />
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Cover Image</label>
                  <div className="flex gap-2">
                    <input
                      value={form.coverImage ?? ''}
                      onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                      className="input-field flex-1"
                      placeholder="https://... or upload →"
                    />
                    <button
                      type="button"
                      onClick={openCoverUpload}
                      disabled={uploadingCover}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 bg-[#E5312A] hover:bg-[#CC2A24] text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <Upload size={13} />
                      {uploadingCover ? '…' : 'Upload'}
                    </button>
                  </div>
                  {form.coverImage && (
                    <img src={form.coverImage} alt="Cover preview" className="mt-2 h-20 w-full object-cover border border-[#e5e5e5] dark:border-[#2a2a2a]" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Tags <span className="font-normal normal-case">(comma separated)</span></label>
                <input
                  value={form.tags.join(', ')}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  className="input-field"
                  placeholder="podcast, studio, tips"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Excerpt * <span className="font-normal normal-case">(shown in listing)</span></label>
                <textarea rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} className="input-field resize-none" placeholder="1-2 sentence summary" />
              </div>

              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">Content * <span className="font-normal normal-case">(full article)</span></label>
                <textarea rows={10} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="input-field resize-y font-mono text-sm" placeholder="Write your full blog post here. Use line breaks for paragraphs." />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-[#2a2a2a] peer-checked:bg-[#E5312A] rounded-full peer transition-colors" />
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                  {form.isPublished ? 'Publish immediately (visible on site)' : 'Save as draft (hidden)'}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#e5e5e5] dark:border-[#2a2a2a] flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-[#E5312A] hover:bg-[#CC2A24] text-white font-bold py-2.5 transition-colors disabled:opacity-50 text-sm">
                {saving ? 'Saving…' : modal === 'create' ? 'Create Post' : 'Save Changes'}
              </button>
              <button onClick={() => setModal(null)} className="px-5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
