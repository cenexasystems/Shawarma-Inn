import { useEffect, useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const emptyCategory = {
  name: '',
  display_order: '0',
  is_active: true,
};

export default function CategoriesPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const catRes = await apiRequest<any[]>('/admin/categories', { token: tokenRequired });
      setCategories(catRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const handleCategorySubmit = async () => {
    try {
      if (editingCategoryId) {
        await apiRequest(`/admin/categories/${editingCategoryId}`, {
          method: 'PUT',
          token: tokenRequired,
          body: categoryForm,
        });
      } else {
        await apiRequest('/admin/categories', {
          method: 'POST',
          token: tokenRequired,
          body: categoryForm,
        });
      }
      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category? Menu items using this category will not be deleted but may not display properly.')) return;
    try {
      await apiRequest(`/admin/categories/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Categories</h2>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}
      {loading && <div className="text-xs text-white/30 animate-pulse">Loading categories…</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input type="text" placeholder="Category Name" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <input type="number" placeholder="Display Order (e.g. 1)" value={categoryForm.display_order} onChange={e => setCategoryForm({...categoryForm, display_order: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
        </div>
        <div className="flex items-center gap-6 mb-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
            <input type="checkbox" checked={categoryForm.is_active} onChange={e => setCategoryForm({...categoryForm, is_active: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
            Active
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCategorySubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
            {editingCategoryId ? 'Update Category' : 'Add Category'}
          </button>
          {editingCategoryId && (
            <button onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className={`bg-[#181818] border p-5 rounded-2xl transition-all ${cat.is_active ? 'border-white/10 hover:border-white/30' : 'border-red-500/20 opacity-70'}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg leading-tight">{cat.name}</h4>
            </div>
            <p className="text-xs text-white/50 mb-3">Order: {cat.display_order}</p>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className={`text-xs font-semibold uppercase tracking-wider ${cat.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {cat.is_active ? 'Active' : 'Hidden'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setEditingCategoryId(cat.id); setCategoryForm({ name: cat.name, display_order: String(cat.display_order), is_active: !!cat.is_active }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
