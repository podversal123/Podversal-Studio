"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Play,
  Upload,
  Youtube,
} from "lucide-react";
import { cldUpload } from "@/lib/cloudinary-widget";
import CldVideoThumb from "@/components/CldVideoThumb";

interface StudioVideo {
  id: string;
  title: string;
  description: string | null;
  youtubeId: string | null;
  cloudinaryUrl: string | null;
  thumbnailUrl: string | null;
  category: string;
  isPublished: boolean;
  sortOrder: number;
}

const EMPTY = {
  title: "",
  description: "",
  youtubeId: "",
  cloudinaryUrl: "",
  thumbnailUrl: "",
  category: "General",
  isPublished: false,
  sortOrder: 0,
};

type VideoSource = "youtube" | "cloudinary";

// so_1 = frame at 1s  synchronous (so_auto is async and returns blurry placeholder on first load)
function cloudinaryThumb(url: string): string {
  const transformed = url.replace(
    "/video/upload/",
    "/video/upload/so_1,w_1280,h_720,c_fill,q_100/",
  );
  return /\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i.test(transformed)
    ? transformed.replace(/\.(mp4|mov|avi|webm|mkv|flv|wmv)$/i, ".jpg")
    : transformed + ".jpg";
}

export default function VideosAdminPage() {
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [videoSource, setVideoSource] = useState<VideoSource>("youtube");
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get<StudioVideo[]>("/studio-videos")
      .then((r) => setVideos(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY, sortOrder: videos.length });
    setEditId(null);
    setVideoSource("youtube");
    setModal("create");
  };

  const openEdit = (v: StudioVideo) => {
    setForm({
      title: v.title,
      description: v.description ?? "",
      youtubeId: v.youtubeId ?? "",
      cloudinaryUrl: v.cloudinaryUrl ?? "",
      thumbnailUrl: v.thumbnailUrl ?? "",
      category: v.category,
      isPublished: v.isPublished,
      sortOrder: v.sortOrder,
    });
    setVideoSource(v.cloudinaryUrl ? "cloudinary" : "youtube");
    setEditId(v.id);
    setModal("edit");
  };

  const openVideoUpload = () => {
    setUploadingVideo(true);
    cldUpload(
      {
        folder: "studio-videos",
        resourceType: "video",
        multiple: false,
        sources: ["local", "url"],
      },
      (info) => {
        setUploadingVideo(false);
        setForm((f) => ({
          ...f,
          cloudinaryUrl: info.secure_url,
          // Don't use widget's low-res thumbnail_url  cloudinaryThumb() derives a sharp one at display time
          thumbnailUrl: f.thumbnailUrl,
          title: f.title || info.original_filename || "",
        }));
        toast.success("Video uploaded");
      },
      () => {
        setUploadingVideo(false);
        toast.error("Upload failed");
      },
    );
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    if (videoSource === "youtube" && !form.youtubeId) {
      toast.error("YouTube video ID is required");
      return;
    }
    if (videoSource === "cloudinary" && !form.cloudinaryUrl) {
      toast.error("Upload a video first");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        youtubeId:
          videoSource === "youtube" ? form.youtubeId || undefined : undefined,
        cloudinaryUrl:
          videoSource === "cloudinary"
            ? form.cloudinaryUrl || undefined
            : undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        category: form.category,
        isPublished: form.isPublished,
        sortOrder: form.sortOrder,
      };
      if (modal === "create") {
        await api.post("/studio-videos", payload);
        toast.success("Video added");
      } else {
        await api.patch(`/studio-videos/${editId}`, payload);
        toast.success("Video updated");
      }
      setModal(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Remove "${title}" from the showcase?`)) return;
    setVideos((prev) => prev.filter((v) => v.id !== id));
    try {
      await api.delete(`/studio-videos/${id}`);
      toast.success("Video removed");
    } catch {
      toast.error("Delete failed");
      load();
    }
  };

  const handleToggle = async (v: StudioVideo) => {
    setVideos((prev) =>
      prev.map((x) =>
        x.id === v.id ? { ...x, isPublished: !x.isPublished } : x,
      ),
    );
    try {
      await api.patch(`/studio-videos/${v.id}`, {
        isPublished: !v.isPublished,
      });
      toast.success(v.isPublished ? "Video hidden" : "Video published");
    } catch {
      toast.error("Update failed");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-[#E5312A] mb-1">
            Content
          </p>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            Studio Videos
          </h1>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a] mt-1">
            {videos.filter((v) => v.isPublished).length} visible ·{" "}
            {videos.filter((v) => !v.isPublished).length} hidden
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary !w-auto flex items-center gap-2"
        >
          <Plus size={16} /> Add Video
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-[#f5f5f5] dark:bg-[#1a1a1a] animate-pulse"
            />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="border border-[#e5e5e5] dark:border-[#2a2a2a] text-center py-16">
          <Play
            size={40}
            className="mx-auto mb-3 text-[#e5e5e5] dark:text-[#3a3a3a]"
          />
          <p className="font-bold text-gray-900 dark:text-white mb-1">
            No videos yet
          </p>
          <p className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
            Add YouTube IDs or upload videos from Cloudinary
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div
              key={v.id}
              className="border border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#111111] overflow-hidden"
            >
              <div className="relative aspect-video bg-[#f5f5f5] dark:bg-[#1a1a1a]">
                {(() => {
                  if (v.cloudinaryUrl) {
                    return (
                      <CldVideoThumb
                        src={v.cloudinaryUrl}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  const thumb =
                    v.thumbnailUrl ??
                    (v.youtubeId
                      ? `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`
                      : null);
                  return thumb ? (
                    <img
                      src={thumb}
                      alt={v.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (
                          v.youtubeId &&
                          e.currentTarget.src.includes("maxresdefault")
                        ) {
                          e.currentTarget.src = `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play size={28} className="text-[#aaa]" />
                    </div>
                  );
                })()}
                <span
                  className={`absolute top-2 left-2 text-[10px] font-black tracking-[0.1em] uppercase px-2 py-0.5 ${v.isPublished ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"}`}
                >
                  {v.isPublished ? "Live" : "Hidden"}
                </span>
                <span className="absolute top-2 right-2 text-[10px] bg-black/60 text-white px-2 py-0.5 font-bold">
                  {v.cloudinaryUrl ? "Cloudinary" : "YouTube"}
                </span>
              </div>

              <div className="p-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                  {v.title}
                </h3>
                <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-0.5">
                  {v.category}
                </p>
                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => handleToggle(v)}
                    title={v.isPublished ? "Hide" : "Show"}
                    className="p-1.5 hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] text-[#6b6b6b] dark:text-[#8a8a8a] transition-colors"
                  >
                    {v.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {v.youtubeId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${v.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-[#E5312A] transition-colors"
                      title="Watch on YouTube"
                    >
                      <Play size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => openEdit(v)}
                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.title)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-[#E5312A] transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white dark:bg-[#111111] w-full max-w-lg border border-[#e5e5e5] dark:border-[#2a2a2a] max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#2a2a2a] flex items-center justify-between flex-shrink-0">
              <h2 className="font-black text-gray-900 dark:text-white">
                {modal === "create" ? "Add Video" : "Edit Video"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-[#aaa] hover:text-gray-900 dark:hover:text-white text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  className="input-field"
                  placeholder="e.g. Podcast Session: Episode 5"
                />
              </div>

              {/* Video source toggle */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                  Video Source
                </label>
                <div className="flex border border-[#e5e5e5] dark:border-[#2a2a2a]">
                  <button
                    type="button"
                    onClick={() => setVideoSource("youtube")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${videoSource === "youtube" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <Youtube size={14} /> YouTube
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoSource("cloudinary")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold transition-colors ${videoSource === "cloudinary" ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "text-[#6b6b6b] dark:text-[#8a8a8a] hover:text-gray-900 dark:hover:text-white"}`}
                  >
                    <Upload size={14} /> Cloudinary
                  </button>
                </div>
              </div>

              {/* YouTube ID */}
              {videoSource === "youtube" && (
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                    YouTube Video ID *
                  </label>
                  <input
                    value={form.youtubeId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        youtubeId: e.target.value.trim(),
                      }))
                    }
                    className="input-field font-mono"
                    placeholder="dQw4w9WgXcQ"
                  />
                  <p className="text-[10px] text-[#aaa] dark:text-[#555] mt-1">
                    youtube.com/watch?v=<strong>dQw4w9WgXcQ</strong>, copy only
                    the ID part
                  </p>
                </div>
              )}

              {/* Cloudinary upload */}
              {videoSource === "cloudinary" && (
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                    Video File *
                  </label>
                  {form.cloudinaryUrl ? (
                    <div className="space-y-2">
                      {/* Preview player */}
                      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                      <video
                        src={form.cloudinaryUrl}
                        controls
                        className="w-full aspect-video bg-black"
                      />
                      <div className="flex items-center justify-between border border-[#e5e5e5] dark:border-[#2a2a2a] px-3 py-2">
                        <p className="text-xs font-bold text-green-600 dark:text-green-400">
                          Video uploaded
                        </p>
                        <button
                          type="button"
                          onClick={openVideoUpload}
                          className="text-xs text-[#E5312A] hover:underline font-bold"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={openVideoUpload}
                      disabled={uploadingVideo}
                      className="w-full border border-dashed border-[#e5e5e5] dark:border-[#2a2a2a] py-8 flex flex-col items-center gap-2 hover:border-[#E5312A] hover:bg-[#E5312A]/5 transition-colors disabled:opacity-50"
                    >
                      <Upload size={20} className="text-[#aaa]" />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {uploadingVideo ? "Opening widget…" : "Upload Video"}
                      </span>
                      <span className="text-xs text-[#aaa]">
                        MP4, MOV, AVI supported
                      </span>
                    </button>
                  )}
                </div>
              )}

              {/* Category & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="input-field"
                  >
                    {[
                      "Podcast",
                      "VFX",
                      "News Shoot",
                      "Monologue",
                      "Online Class",
                      "Product Shoot",
                      "General",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sortOrder: Number(e.target.value),
                      }))
                    }
                    className="input-field"
                    min={0}
                  />
                </div>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                  Custom Thumbnail URL{" "}
                  <span className="font-normal normal-case">(optional)</span>
                </label>
                <input
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thumbnailUrl: e.target.value }))
                  }
                  className="input-field"
                  placeholder="Leave empty, YouTube auto-thumbnail is used for YouTube videos"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black tracking-[0.12em] uppercase text-[#aaa] dark:text-[#555] mb-1.5">
                  Description{" "}
                  <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="input-field resize-none"
                  placeholder="Short description"
                />
              </div>

              {/* Publish */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isPublished: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 dark:bg-[#2a2a2a] peer-checked:bg-[#E5312A] rounded-full peer transition-colors" />
                  <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-sm text-[#6b6b6b] dark:text-[#8a8a8a]">
                  {form.isPublished
                    ? "Published (visible on site)"
                    : "Draft (hidden)"}
                </span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-[#e5e5e5] dark:border-[#2a2a2a] flex gap-3 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#E5312A] hover:bg-[#CC2A24] text-white font-bold py-2.5 transition-colors disabled:opacity-50 text-sm"
              >
                {saving
                  ? "Saving…"
                  : modal === "create"
                    ? "Add Video"
                    : "Save Changes"}
              </button>
              <button
                onClick={() => setModal(null)}
                className="px-5 border border-[#e5e5e5] dark:border-[#2a2a2a] text-sm font-bold text-[#6b6b6b] dark:text-[#8a8a8a] hover:border-[#aaa] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
