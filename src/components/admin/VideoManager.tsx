import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Play, Plus, Trash2, Edit, UploadCloud, Loader2, Video, Image as ImageIcon } from 'lucide-react';
import { PageHeader } from './../ui/PageHeader';
import { Button } from './../ui/Button';
import { Input } from './../ui/Input';
import { Card } from './../ui/Card';
import { resolveTestimonialMediaUrl } from '../../lib/testimonialMedia';

const STORAGE_BUCKET = 'testimonial-videos';

interface TestimonialVideo {
  id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
  is_active: boolean;
}

function publicUrl(path: string): string {
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function VideoManager() {
  const [videos, setVideos] = useState<TestimonialVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', thumbnail_url: '', is_active: true });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [error, setError] = useState('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonial_videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchVideos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        const { error } = await supabase
          .from('testimonial_videos')
          .update({
            title: formData.title,
            url: formData.url,
            thumbnail_url: formData.thumbnail_url || null,
            is_active: formData.is_active,
          })
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('testimonial_videos').insert({
          title: formData.title,
          url: formData.url,
          thumbnail_url: formData.thumbnail_url || null,
          is_active: formData.is_active,
        });
        if (error) throw error;
      }
      setIsEditing(false);
      fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving video');
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setError('');
    try {
      const path = `videos/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      setFormData((prev) => ({ ...prev, url: publicUrl(path) }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleThumbnailFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    setError('');
    try {
      const path = `thumbnails/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      setFormData((prev) => ({ ...prev, thumbnail_url: publicUrl(path) }));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to upload thumbnail');
    } finally {
      setUploadingThumb(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      const { error } = await supabase.from('testimonial_videos').delete().eq('id', id);
      if (error) throw error;
      fetchVideos();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting video');
    }
  };

  if (loading) return <div className="text-erp-muted animate-pulse p-8 font-inter">Loading videos...</div>;

  return (
    <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
      <PageHeader 
        title="Media Library"
        subtitle="Manage testimonial videos and media assets."
        action={
          <Button 
            onClick={() => {
              setFormData({ title: '', url: '', thumbnail_url: '', is_active: true });
              setEditId(null);
              setError('');
              setIsEditing(true);
            }}
            icon={Plus}
          >
            Add Video
          </Button>
        }
      />

      {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[14px] text-sm border border-erp-danger/20 mb-8 font-inter font-medium">{error}</div>}

      {isEditing && (
        <Card className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-bebas text-2xl text-erp-text uppercase tracking-wide border-b border-erp-border pb-4 mb-6">
              {editId ? 'Edit Media' : 'Upload Media'}
            </h3>
            
            <div className="space-y-4 max-w-3xl">
              <div>
                <label className="block text-[11px] font-bold text-erp-muted uppercase tracking-[1px] mb-2">Video Title</label>
                <Input
                  type="text"
                  placeholder="Enter a descriptive title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-erp-muted uppercase tracking-[1px] mb-2">Video File</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="url"
                      icon={Video}
                      placeholder="Video URL, or upload a file"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      required
                    />
                  </div>
                  <label className="shrink-0 flex items-center justify-center gap-2 bg-erp-bg border border-erp-border hover:border-erp-primary h-[42px] px-6 rounded-[14px] text-[13px] font-semibold text-erp-text cursor-pointer transition-colors whitespace-nowrap">
                    {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoFileUpload} disabled={uploadingVideo} />
                  </label>
                </div>
                {formData.url && (
                  <div className="mt-4 p-2 bg-erp-bg rounded-[14px] inline-block border border-erp-border">
                    <video src={resolveTestimonialMediaUrl(formData.url)} className="h-[120px] rounded-[8px] object-cover" muted controls />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-erp-muted uppercase tracking-[1px] mb-2">Thumbnail Cover</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="url"
                      icon={ImageIcon}
                      placeholder="Thumbnail URL, or upload an image"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    />
                  </div>
                  <label className="shrink-0 flex items-center justify-center gap-2 bg-erp-bg border border-erp-border hover:border-erp-primary h-[42px] px-6 rounded-[14px] text-[13px] font-semibold text-erp-text cursor-pointer transition-colors whitespace-nowrap">
                    {uploadingThumb ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                    {uploadingThumb ? 'Uploading...' : 'Upload Cover'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailFileUpload} disabled={uploadingThumb} />
                  </label>
                </div>
                {formData.thumbnail_url && (
                  <div className="mt-4 p-2 bg-erp-bg rounded-[14px] inline-block border border-erp-border">
                    <img src={resolveTestimonialMediaUrl(formData.thumbnail_url)} alt="Thumbnail preview" className="h-[120px] rounded-[8px] object-cover" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="w-4 h-4 rounded text-erp-primary border-gray-300 focus:ring-erp-primary"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-erp-text cursor-pointer">
                  Publish to website immediately
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-6 border-t border-erp-border mt-8">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Media
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videos.map((vid) => (
          <Card key={vid.id} className="p-4 flex flex-col gap-4 group hover:border-erp-primary transition-colors">
            {vid.thumbnail_url ? (
              <div
                className="w-full h-[180px] rounded-[10px] bg-cover bg-center border border-erp-border"
                style={{ backgroundImage: `url(${resolveTestimonialMediaUrl(vid.thumbnail_url)})` }}
              />
            ) : (
              <div className="w-full h-[180px] bg-gray-100 rounded-[10px] flex items-center justify-center border border-erp-border">
                <Play size={48} className="text-gray-300" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="font-bold text-erp-text text-[15px] truncate">{vid.title}</h3>
              <a href={resolveTestimonialMediaUrl(vid.url)} target="_blank" rel="noreferrer" className="text-[12px] text-erp-muted hover:text-erp-primary hover:underline truncate block mt-1">
                {resolveTestimonialMediaUrl(vid.url)}
              </a>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-erp-border">
              <span className={`text-[10px] font-bold uppercase tracking-[1px] px-2.5 py-1 rounded-full ${vid.is_active ? 'bg-erp-success/10 text-erp-success' : 'bg-gray-100 text-erp-muted'}`}>
                {vid.is_active ? 'Published' : 'Hidden'}
              </span>
              
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setFormData({ title: vid.title, url: vid.url, thumbnail_url: vid.thumbnail_url || '', is_active: vid.is_active });
                    setEditId(vid.id);
                    setError('');
                    setIsEditing(true);
                  }}
                  className="w-[32px] h-[32px] flex items-center justify-center bg-gray-100 text-erp-muted hover:text-erp-text hover:bg-gray-200 rounded-[8px] transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(vid.id)}
                  className="w-[32px] h-[32px] flex items-center justify-center bg-erp-danger/5 text-erp-danger hover:bg-erp-danger/10 rounded-[8px] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {videos.length === 0 && !isEditing && (
          <div className="col-span-full py-16 text-center text-erp-muted font-medium bg-white border border-dashed border-erp-border rounded-erp">
            No media assets found. Click 'Add Video' to upload a testimonial.
          </div>
        )}
      </div>
    </div>
  );
}
