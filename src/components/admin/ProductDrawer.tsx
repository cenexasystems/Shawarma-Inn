import React, { useState, useEffect } from 'react';
import { X, Upload, Save, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  categories: any[];
  onSave: () => void;
}

export function ProductDrawer({ isOpen, onClose, product, categories, onSave }: ProductDrawerProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '',
        large_price: '',
        category: categories[0]?.name || '',
        image_url: '',
        is_veg: false,
        is_bestseller: false,
        is_trending: false,
        is_active: true,
        display_order: 0,
      });
    }
  }, [product, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      // Keep using the local backend for image upload since it saves to public folder
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData({ ...formData, image_url: data.imageUrl });
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Make sure Express server is running for uploads.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: formData.description,
        price: Number(formData.price),
        large_price: formData.large_price ? Number(formData.large_price) : null,
        category: formData.category,
        image_url: formData.image_url,
        is_veg: Boolean(formData.is_veg),
        is_bestseller: Boolean(formData.is_bestseller),
        is_trending: Boolean(formData.is_trending),
        is_active: Boolean(formData.is_active),
        display_order: Number(formData.display_order),
      };

      if (formData.id) {
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert(payload);
        if (error) throw error;
      }
      onSave();
    } catch (err) {
      console.error(err);
      alert('Failed to save product');
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
            className="fixed inset-0 bg-black z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-[#121212] border-l border-white/10 shadow-2xl z-[110] overflow-y-auto flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5 sticky top-0 bg-[#121212]/90 backdrop-blur-xl z-10">
              <div>
                <h2 className="font-bebas text-3xl tracking-[2px] uppercase text-white leading-none">
                  {product?.id ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-[10px] text-white/40 uppercase tracking-[1px] mt-1">Product Details</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex-1 flex flex-col gap-8">
              {/* Image Upload */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Product Image</label>
                <div className="relative aspect-video rounded-2xl border-2 border-dashed border-white/10 hover:border-[#ef8f2f]/50 transition-colors overflow-hidden bg-black/40 group">
                  {formData.image_url ? (
                    <>
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <label className="cursor-pointer bg-[#ef8f2f] text-black px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-[1px] flex items-center gap-2 hover:bg-[#ef8f2f]/90 transition-colors shadow-lg">
                          <Upload className="w-4 h-4" /> Replace Image
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                      <ImageIcon className="w-10 h-10 text-white/20 mb-3" />
                      <span className="text-[11px] text-white/40 uppercase tracking-[1px] font-bold">Click to upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-md z-20">
                      <div className="w-8 h-8 border-2 border-[#ef8f2f] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Product Name</label>
                  <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all" />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Category</label>
                  <select name="category" value={formData.category || ''} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all appearance-none">
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">SEO Name (Slug)</label>
                  <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="Leave blank to auto-generate" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all placeholder:text-white/20" />
                </div>

                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Description</label>
                  <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all resize-none" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Regular Price (₹)</label>
                  <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required min="0" step="1" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bebas text-lg focus:outline-none focus:border-[#ef8f2f] transition-all" />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Large Price (₹)</label>
                  <input type="number" name="large_price" value={formData.large_price || ''} onChange={handleChange} min="0" step="1" placeholder="Optional" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bebas text-lg focus:outline-none focus:border-[#ef8f2f] transition-all placeholder:text-white/20 placeholder:font-sans" />
                </div>
                
                <div className="space-y-3 col-span-2">
                  <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Display Order</label>
                  <input type="number" name="display_order" value={formData.display_order || 0} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all" />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-6 border-t border-white/5">
                {[
                  { name: 'is_active', label: 'Available', desc: 'Show on customer website', color: 'accent-green-500' },
                  { name: 'is_veg', label: 'Vegetarian', desc: 'Mark as 100% vegetarian', color: 'accent-green-500' },
                  { name: 'is_bestseller', label: 'Bestseller', desc: 'Highlight in menu', color: 'accent-yellow-500' },
                  { name: 'is_trending', label: 'Trending', desc: 'Show in trending section', color: 'accent-blue-500' },
                ].map((toggle) => (
                  <label key={toggle.name} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors group">
                    <div>
                      <span className="text-white text-sm font-bold block">{toggle.label}</span>
                      <span className="text-[10px] uppercase tracking-[1px] text-white/40 block mt-1">{toggle.desc}</span>
                    </div>
                    <input type="checkbox" name={toggle.name} checked={formData[toggle.name] || false} onChange={handleChange} className={`w-5 h-5 ${toggle.color} cursor-pointer`} />
                  </label>
                ))}
              </div>

              <div className="pt-8 sticky bottom-0 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pb-6 mt-auto z-10">
                <button type="submit" className="w-full bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(239,143,47,0.3)] text-sm font-bold uppercase tracking-[1px]">
                  <Save className="w-5 h-5" /> Save Product
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
