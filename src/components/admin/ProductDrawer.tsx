import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Save, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { RightDrawer } from '../../design-system/DrawerSystem';
import { Button } from '../../design-system/ButtonSystem';
import { getRecoveryImage, resolveMenuImage } from '../../utils/menuImages';

const STORAGE_BUCKET = 'menu-images';

interface ProductDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  categories: any[];
  onSave: () => void;
}

function makeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function ProductDrawer({ isOpen, onClose, product, categories, onSave }: ProductDrawerProps) {
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      return;
    }

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
  }, [product, categories]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = event.target;
    if (type === 'checkbox') {
      setFormData((prev: any) => ({ ...prev, [name]: (event.target as HTMLInputElement).checked }));
      return;
    }

    setFormData((prev: any) => {
      const next = { ...prev, [name]: value };
      if (name === 'name' && !prev.slug) {
        next.slug = makeSlug(value);
      }
      return next;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;
    setUploading(true);

    try {
      const file = event.target.files[0];
      const path = `products/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      setFormData((prev: any) => ({ ...prev, image_url: data.publicUrl }));
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? `Failed to upload image: ${err.message}` : 'Failed to upload image.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!formData.name || !formData.category || !formData.price) {
      alert('Name, category, and price are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || makeSlug(formData.name),
        description: formData.description,
        price: Number(formData.price),
        large_price: formData.large_price ? Number(formData.large_price) : null,
        category: formData.category,
        image_url: formData.image_url,
        is_veg: Boolean(formData.is_veg),
        is_bestseller: Boolean(formData.is_bestseller),
        is_trending: Boolean(formData.is_trending),
        is_active: Boolean(formData.is_active),
        display_order: Number(formData.display_order || 0),
      };

      if (formData.id) {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('menu_items').insert(payload);
        if (error) throw error;
      }

      onSave();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const previewImage = formData.image_url
    ? resolveMenuImage({ image_url: formData.image_url, name: formData.name || 'Preview', category: formData.category || '' })
    : getRecoveryImage({ name: formData.name || 'Preview', category: formData.category || '' });

  return (
    <RightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={product?.id ? 'Edit Product' : 'Add Product'}
      subtitle="Manage product details, pricing, and storefront visibility"
      width="720px"
      footer={
        <div className="flex gap-[12px]">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={() => void handleSubmit()} disabled={saving || uploading}>
            <Save size={18} className="mr-[8px]" /> {saving ? 'Saving...' : product?.id ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-[28px]">
        <section className="grid grid-cols-1 gap-[24px] lg:grid-cols-[1.2fr_.8fr]">
          <div className="space-y-[12px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Product Image</label>
            <div className="relative aspect-[4/3] rounded-[20px] border-[2px] border-dashed border-erp-border overflow-hidden bg-erp-bg group">
              <img
                src={previewImage}
                alt={formData.name || 'Preview'}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = getRecoveryImage({ name: formData.name || 'Preview', category: formData.category || '' });
                }}
              />
              <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <label className="cursor-pointer bg-white border border-erp-border text-erp-text px-[18px] py-[12px] rounded-[16px] text-[13px] font-[700] uppercase tracking-[0.08em] flex items-center gap-[8px] shadow-sm">
                  <Upload className="h-[16px] w-[16px]" />
                  {formData.image_url ? 'Replace Image' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
              {!formData.image_url && !formData.name && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-erp-muted">
                  <ImageIcon className="mb-[12px] h-[36px] w-[36px]" />
                  <span className="text-[12px] font-[700] uppercase tracking-[0.12em]">Add product photo</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-md z-20">
                  <div className="h-[32px] w-[32px] border-[2px] border-erp-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-erp-border bg-white p-[20px] shadow-erp">
            <p className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted mb-[12px]">Preview Summary</p>
            <div className="space-y-[12px]">
              <div>
                <p className="text-[18px] font-[700] text-erp-text leading-tight">{formData.name || 'Product name'}</p>
                <p className="mt-[6px] text-[13px] text-erp-muted">{formData.description || 'Add a short description for the menu and admin views.'}</p>
              </div>
              <div className="flex items-center gap-[8px] flex-wrap">
                <span className="rounded-full border border-erp-border bg-[#F8FAFC] px-[12px] py-[6px] text-[11px] font-[700] uppercase tracking-[0.08em] text-erp-muted">
                  {formData.category || 'Category'}
                </span>
                {formData.is_veg && (
                  <span className="rounded-full border border-erp-success/20 bg-erp-success/10 px-[12px] py-[6px] text-[11px] font-[700] uppercase tracking-[0.08em] text-erp-success">
                    Veg
                  </span>
                )}
                {formData.is_bestseller && (
                  <span className="rounded-full border border-erp-warning/20 bg-erp-warning/10 px-[12px] py-[6px] text-[11px] font-[700] uppercase tracking-[0.08em] text-erp-warning">
                    Bestseller
                  </span>
                )}
                {formData.is_trending && (
                  <span className="rounded-full border border-erp-blue/20 bg-erp-blue/10 px-[12px] py-[6px] text-[11px] font-[700] uppercase tracking-[0.08em] text-erp-blue">
                    Trending
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-[12px] pt-[8px]">
                <div className="rounded-[16px] bg-erp-bg p-[14px]">
                  <p className="text-[11px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Regular</p>
                  <p className="mt-[6px] text-[24px] font-[700] text-erp-text">{formData.price ? `₹${formData.price}` : '₹0'}</p>
                </div>
                <div className="rounded-[16px] bg-erp-bg p-[14px]">
                  <p className="text-[11px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Large</p>
                  <p className="mt-[6px] text-[24px] font-[700] text-erp-text">{formData.large_price ? `₹${formData.large_price}` : '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-[20px]">
          <div className="col-span-2 space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Product Name</label>
            <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>

          <div className="space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Category</label>
            <select name="category" value={formData.category || ''} onChange={handleChange} required className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all appearance-none">
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">SEO Slug</label>
            <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="auto-generated" className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400" />
          </div>

          <div className="col-span-2 space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Description</label>
            <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4} className="w-full bg-erp-bg border border-erp-border rounded-[16px] p-[16px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all resize-none" />
          </div>

          <div className="space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Regular Price</label>
            <input type="number" name="price" value={formData.price || ''} onChange={handleChange} required min="0" step="1" className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[16px] font-[700] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>

          <div className="space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Large Price</label>
            <input type="number" name="large_price" value={formData.large_price || ''} onChange={handleChange} min="0" step="1" placeholder="optional" className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[16px] font-[700] text-erp-text focus:outline-none focus:border-erp-primary transition-all placeholder:text-gray-400 placeholder:font-[500] placeholder:text-[15px]" />
          </div>

          <div className="col-span-2 space-y-[10px]">
            <label className="text-[12px] uppercase tracking-[0.12em] font-[700] text-erp-muted">Display Order</label>
            <input type="number" name="display_order" value={formData.display_order || 0} onChange={handleChange} className="w-full bg-erp-bg border border-erp-border rounded-[16px] px-[16px] h-[46px] text-[15px] text-erp-text focus:outline-none focus:border-erp-primary transition-all" />
          </div>
        </section>

        <section className="space-y-[12px] pt-[8px] border-t border-erp-border">
          {[
            { name: 'is_active', label: 'Available', desc: 'Visible to customers on the menu.' },
            { name: 'is_veg', label: 'Vegetarian', desc: 'Marks the product as fully vegetarian.' },
            { name: 'is_bestseller', label: 'Bestseller', desc: 'Highlights this product in admin and menu views.' },
            { name: 'is_trending', label: 'Trending', desc: 'Pushes this product into trending sections.' },
          ].map((toggle) => (
            <label key={toggle.name} className="flex items-center justify-between gap-[16px] rounded-[18px] border border-erp-border bg-erp-bg p-[16px] cursor-pointer hover:bg-white transition-colors">
              <div>
                <span className="block text-[15px] font-[700] text-erp-text">{toggle.label}</span>
                <span className="mt-[4px] block text-[12px] text-erp-muted">{toggle.desc}</span>
              </div>
              <input type="checkbox" name={toggle.name} checked={Boolean(formData[toggle.name])} onChange={handleChange} className="h-[18px] w-[18px] cursor-pointer accent-[#173F2E]" />
            </label>
          ))}
        </section>
      </form>
    </RightDrawer>
  );
}
