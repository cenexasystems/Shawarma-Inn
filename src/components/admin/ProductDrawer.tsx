import React, { useState, useEffect } from 'react';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { RightDrawer } from '../../design-system/DrawerSystem';
import { Button } from '../../design-system/ButtonSystem';

const STORAGE_BUCKET = 'menu-images';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  categories: any[];
  onSave: () => void;
}

export function ProductDrawer({ isOpen, onClose, product, categories, onSave }: ProductDrawerProps) {
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
      const path = `products/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      setFormData({ ...formData, image_url: data.publicUrl });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? `Failed to upload image: ${err.message}` : 'Failed to upload image.');
    } finally {
      setUploading(false);
      e.target.value = '';
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
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={product?.id ? 'Edit Product' : 'Add Product'}
      subtitle="Manage product details and settings"
      width="600px"
      footer={
        <Button fullWidth onClick={handleSubmit}>
          <Save size={18} className="mr-[8px]" /> {product?.id ? 'Save Changes' : 'Create Product'}
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-[32px]">
        {/* Image Upload */}
        <div className="space-y-[12px]">
          <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Product Image</label>
          <div className="relative aspect-video rounded-[16px] border-[2px] border-dashed border-erp-border hover:border-erp-primary/30 transition-colors overflow-hidden bg-erp-bg group">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <label className="cursor-pointer bg-white border border-erp-border text-erp-text px-[20px] py-[12px] rounded-[12px] text-[14px] font-[700] uppercase tracking-[1px] flex items-center gap-[8px] hover:bg-erp-bg shadow-sm">
                    <Upload className="w-[16px] h-[16px]" /> Replace Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                </div>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <ImageIcon className="w-[40px] h-[40px] text-gray-300 mb-[12px] group-hover:text-gray-400 transition-colors" />
                <span className="text-[12px] text-erp-muted uppercase tracking-[1px] font-[700]">Click to upload image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-md z-20">
                <div className="w-[32px] h-[32px] border-[2px] border-erp-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-[24px]">
          <div className="space-y-[12px] col-span-2">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Product Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>
          
          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Category</label>
            <select name="category" value={formData.category || ''} onChange={handleChange} required className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all appearance-none">
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">SEO Name (Slug)</label>
            <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="Auto-generated" className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400" />
          </div>

          <div className="space-y-[12px] col-span-2">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={3} className="w-full bg-erp-bg border border-erp-border rounded-[12px] p-[16px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all resize-none" />
          </div>

          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Regular Price (₹)</label>
            <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required min="0" step="1" className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] font-manrope font-[700] text-[18px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>
          
          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Large Price (₹)</label>
            <input type="number" name="large_price" value={formData.large_price || ''} onChange={handleChange} min="0" step="1" placeholder="Optional" className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] font-manrope font-[700] text-[18px] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400 placeholder:font-inter placeholder:text-[15px] placeholder:font-[500]" />
          </div>
          
          <div className="space-y-[12px] col-span-2">
            <label className="text-[12px] uppercase tracking-[1px] font-[700] text-erp-muted">Display Order</label>
            <input type="number" name="display_order" value={formData.display_order || 0} onChange={handleChange} className="w-full bg-erp-bg border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-[12px] pt-[24px] border-t border-erp-border">
          {[
            { name: 'is_active', label: 'Available', desc: 'Show on customer website', color: 'accent-erp-success' },
            { name: 'is_veg', label: 'Vegetarian', desc: 'Mark as 100% vegetarian', color: 'accent-erp-success' },
            { name: 'is_bestseller', label: 'Bestseller', desc: 'Highlight in menu', color: 'accent-erp-warning' },
            { name: 'is_trending', label: 'Trending', desc: 'Show in trending section', color: 'accent-erp-blue' },
          ].map((toggle) => (
            <label key={toggle.name} className="flex items-center justify-between p-[16px] rounded-[16px] bg-erp-bg border border-erp-border cursor-pointer hover:bg-white transition-colors group shadow-sm">
              <div>
                <span className="text-erp-text text-[15px] font-[700] block">{toggle.label}</span>
                <span className="text-[11px] uppercase tracking-[1px] text-erp-muted font-[600] block mt-[4px]">{toggle.desc}</span>
              </div>
              <input type="checkbox" name={toggle.name} checked={formData[toggle.name] || false} onChange={handleChange} className={`w-[20px] h-[20px] ${toggle.color} cursor-pointer`} />
            </label>
          ))}
        </div>
      </form>
    </RightDrawer>
  );
}
