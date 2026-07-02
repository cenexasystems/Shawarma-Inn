import React, { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Check, PowerOff, Edit3 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { CategoryDrawer } from '../../components/admin/CategoryDrawer';

export default function CategoriesPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    try {
      const catRes = await apiRequest<any[]>('/admin/categories', { token: tokenRequired });
      setCategories(catRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [categories, searchTerm]);

  const openDrawer = (category: any = null) => {
    setEditingCategory(category);
    setDrawerOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Categories</h1>
          <p className="text-zinc-400 mt-1">Manage your menu categories and their display order.</p>
        </div>
        <button 
          onClick={() => openDrawer()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-orange-900/20"
        >
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="p-4 text-sm font-semibold text-zinc-400">Category</th>
                <th className="p-4 text-sm font-semibold text-zinc-400">Display Order</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-center">Visible</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Loading categories...</td></tr>
              ) : filteredCategories.length === 0 ? (
                <tr><td colSpan={4} className="p-8 text-center text-zinc-500">No categories found.</td></tr>
              ) : (
                filteredCategories.map(cat => (
                  <tr key={cat.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group cursor-pointer" onClick={() => openDrawer(cat)}>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        {cat.banner_image ? (
                          <img src={cat.banner_image} alt={cat.name} className="w-16 h-10 rounded object-cover bg-zinc-800 border border-zinc-700 flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-10 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-600">No Img</div>
                        )}
                        <div>
                          <div className="font-bold text-white">{cat.name}</div>
                          <div className="text-xs text-zinc-500">{cat.slug || 'No slug'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300">
                      {cat.display_order}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${cat.is_active || cat.is_visible ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                        {(cat.is_active || cat.is_visible) ? <Check className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-zinc-500 hover:text-white bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CategoryDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        category={editingCategory} 
        onSave={() => { setDrawerOpen(false); loadData(); }} 
      />
    </div>
  );
}
