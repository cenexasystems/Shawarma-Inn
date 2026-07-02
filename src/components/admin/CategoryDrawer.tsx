import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  category: any;
  onSave: () => void;
}

export function CategoryDrawer({ isOpen, onClose, category, onSave }: CategoryDrawerProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        is_visible: true,
        display_order: 0,
        banner_image: '',
        category_image: '',
      });
    }
  }, [category]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const res = await fetch('/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData({ ...formData, [fieldName]: data.imageUrl });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        display_order: Number(formData.display_order),
      };

      if (formData.id) {
        await apiRequest(`/admin/categories/${formData.id}`, {
          method: 'PUT',
          token,
          body: payload,
        });
      } else {
        await apiRequest('/admin/categories', {
          method: 'POST',
          token,
          body: payload,
        });
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert('Failed to save category');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-zinc-900 border-l border-zinc-800 shadow-2xl z-50 overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-10">
              <h2 className="text-xl font-bold text-white">{category?.id ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Category Name</label>
                  <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-zinc-400">SEO Slug</label>
                  <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Description</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-all resize-none" />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-medium text-zinc-400">Display Order</label>
                  <input type="number" name="display_order" value={formData.display_order || 0} onChange={handleChange} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-all" />
                </div>
              </div>

              {/* Banner Image Upload */}
              <div className="space-y-2 border-t border-zinc-800 pt-6">
                <label className="text-sm font-medium text-zinc-400">Banner Image (Optional)</label>
                <div className="relative aspect-[3/1] rounded-xl border-2 border-dashed border-zinc-700 hover:border-orange-500 transition-colors overflow-hidden bg-zinc-800 group">
                  {formData.banner_image ? (
                    <>
                      <img src={formData.banner_image} alt="Banner" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="cursor-pointer bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-orange-700">
                          <Upload className="w-4 h-4" /> Replace
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner_image')} disabled={uploading} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                      <span className="text-sm text-zinc-400 font-medium">Click to upload banner</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'banner_image')} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50 cursor-pointer hover:border-zinc-600 transition-colors">
                  <div>
                    <span className="text-white font-medium block">Visible</span>
                    <span className="text-sm text-zinc-400 block">Show this category on website</span>
                  </div>
                  <input type="checkbox" name="is_visible" checked={formData.is_visible || false} onChange={handleChange} className="w-5 h-5 accent-orange-600 cursor-pointer" />
                </label>
              </div>

              <div className="pt-6 sticky bottom-0 bg-zinc-900 pb-6 border-t border-zinc-800 mt-auto">
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <Save className="w-5 h-5" /> Save Category
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
