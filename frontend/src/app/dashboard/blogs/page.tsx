'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react';

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
  const [posts,   setPosts]   = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'create' | 'edit' | null>(null);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    api.get<Blog[]>('/blogs').then(r => setPosts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
    try {
      await api.delete(`/blogs/${id}`);
      toast.success('Post deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleTogglePublish = async (post: Blog) => {
    try {
      await api.patch(`/blogs/${post.id}`, { isPublished: !post.isPublished });
      toast.success(post.isPublished ? 'Post unpublished' : 'Post published');
      load();
    } catch {
      toast.error('Update failed');
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm(f => ({ ...f, title, slug }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-sm text-gray-500 mt-1">{posts.filter(p => p.isPublished).length} published · {posts.filter(p => !p.isPublished).length} drafts</p>
        </div>
        <button onClick={openCreate} className="btn-primary !w-auto flex items-center gap-2">
          <Plus size={16} /> New Post
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">No blog posts yet</p>
          <p className="text-sm">Click &quot;New Post&quot; to create your first article</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Category</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Author</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Published</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{post.title}</p>
                    <p className="text-xs text-gray-400 font-mono">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{post.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{post.author?.name}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleTogglePublish(post)} title={post.isPublished ? 'Unpublish' : 'Publish'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        {post.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" title="View post" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <ExternalLink size={15} />
                      </a>
                      <button onClick={() => openEdit(post)} title="Edit" className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                        <Edit size={15} />
                      </button>
                      <button onClick={() => handleDelete(post.id, post.title)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                        <Trash2 size={15} />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {modal === 'create' ? 'New Blog Post' : 'Edit Blog Post'}
              </h2>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="input-field"
                    placeholder="Your post title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="input-field font-mono text-sm"
                    placeholder="url-friendly-slug"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-field"
                    placeholder="e.g. Tips, Behind the Scenes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image URL</label>
                  <input
                    value={form.coverImage ?? ''}
                    onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
                    className="input-field"
                    placeholder="https://res.cloudinary.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  value={form.tags.join(', ')}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                  className="input-field"
                  placeholder="podcast, studio, tips"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt * (short summary shown in listing)</label>
                <textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                  className="input-field resize-none"
                  placeholder="A short 1-2 sentence description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content * (full article body)</label>
                <textarea
                  rows={10}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="input-field resize-y font-mono text-sm"
                  placeholder="Write your full blog post here. Use line breaks for paragraphs."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={form.isPublished}
                  onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 rounded"
                />
                <label htmlFor="published" className="text-sm font-medium text-gray-700">
                  Publish immediately (visible on public blog)
                </label>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary !w-auto px-6">
                {saving ? 'Saving...' : modal === 'create' ? 'Publish Post' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
