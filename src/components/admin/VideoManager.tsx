import { useState, useEffect } from 'react';
import { apiRequest } from '../../lib/api';
import { Play, Plus, Trash2, Edit, UploadCloud, Loader2 } from 'lucide-react';

export default function VideoManager({ tokenRequired }: { tokenRequired: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', thumbnail_url: '', is_active: 1 });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<any>('/admin/videos', { token: tokenRequired });
      setVideos(res.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [tokenRequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await apiRequest(`/admin/videos/${editId}`, { method: 'PUT', body: formData, token: tokenRequired });
      } else {
        await apiRequest('/admin/videos', { method: 'POST', body: formData, token: tokenRequired });
      }
      setIsEditing(false);
      fetchVideos();
    } catch (err) {
      alert('Error saving video');
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const body = new FormData();
      body.append('video', file);
      const res = await fetch('/api/admin/videos/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenRequired}` },
        body,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData((prev) => ({ ...prev, url: data.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const body = new FormData();
      body.append('thumbnail', file);
      const res = await fetch('/api/admin/videos/upload-thumbnail', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenRequired}` },
        body,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData((prev) => ({ ...prev, thumbnail_url: data.url }));
    } catch (err) {
      console.error(err);
      alert('Failed to upload thumbnail');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await apiRequest(`/admin/videos/${id}`, { method: 'DELETE', token: tokenRequired });
      fetchVideos();
    } catch (err) {
      alert('Error deleting video');
    }
  };

  if (loading) return <div className="text-white/50 animate-pulse p-8">Loading videos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bebas tracking-wide uppercase text-white">Testimonial Videos</h2>
        <button
          onClick={() => {
            setFormData({ title: '', url: '', thumbnail_url: '', is_active: 1 });
            setEditId(null);
            setIsEditing(true);
          }}
          className="flex items-center gap-2 bg-[#d62b2b] text-white px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-[1px] hover:bg-[#bf2323] transition-colors"
        >
          <Plus size={16} /> Add Video
        </button>
      </div>

      {isEditing && (
        <form onSubmit={handleSubmit} className="bg-[#181818] border border-white/10 p-6 rounded-2xl space-y-4">
          <input
            type="text"
            placeholder="Video Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#d62b2b]"
            required
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Video URL, or upload a file"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="flex-1 bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#d62b2b]"
                required
              />
              <label className="shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#d62b2b] px-3 py-3 rounded-xl text-xs uppercase tracking-wide text-white/70 hover:text-white cursor-pointer transition-colors">
                {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} disabled={uploadingVideo} />
              </label>
            </div>
            {formData.url && (
              <video src={formData.url} className="w-32 h-20 rounded-lg object-cover border border-white/10" muted />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Thumbnail URL, or upload an image"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                className="flex-1 bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-[#d62b2b]"
              />
              <label className="shrink-0 flex items-center gap-2 bg-white/5 border border-white/10 hover:border-[#d62b2b] px-3 py-3 rounded-xl text-xs uppercase tracking-wide text-white/70 hover:text-white cursor-pointer transition-colors">
                {uploadingThumb ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                {uploadingThumb ? 'Uploading...' : 'Upload Cover'}
                <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailFileUpload} disabled={uploadingThumb} />
              </label>
            </div>
            {formData.thumbnail_url && (
              <img src={formData.thumbnail_url} alt="Thumbnail preview" className="w-32 h-20 rounded-lg object-cover border border-white/10" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={formData.is_active === 1}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked ? 1 : 0 })}
            />
            Active
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-white/50 hover:text-white"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-white text-black rounded-xl font-bold uppercase tracking-wide">
              Save Video
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((vid) => (
          <div key={vid.id} className="bg-[#181818] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 group">
            {vid.thumbnail_url ? (
              <div
                className="w-full h-40 rounded-xl bg-cover bg-center"
                style={{ backgroundImage: `url(${vid.thumbnail_url})` }}
              />
            ) : (
              <div className="w-full h-40 bg-black/50 rounded-xl flex items-center justify-center border border-white/5">
                <Play size={32} className="text-white/20" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-white text-lg truncate">{vid.title}</h3>
              <a href={vid.url} target="_blank" rel="noreferrer" className="text-xs text-[#d62b2b] hover:underline truncate block">
                {vid.url}
              </a>
            </div>
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
              <span className={`text-[10px] uppercase tracking-[1px] px-2 py-1 rounded-full ${vid.is_active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                {vid.is_active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setFormData({ title: vid.title, url: vid.url, thumbnail_url: vid.thumbnail_url || '', is_active: vid.is_active });
                    setEditId(vid.id);
                    setIsEditing(true);
                  }}
                  className="p-1.5 bg-white/10 text-white rounded hover:bg-white/20"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(vid.id)}
                  className="p-1.5 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && !isEditing && (
          <div className="col-span-full py-10 text-center text-white/40 border border-dashed border-white/10 rounded-2xl">
            No testimonial videos found. Add one to show on the website.
          </div>
        )}
      </div>
    </div>
  );
}
