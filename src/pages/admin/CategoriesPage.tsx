import { useEffect, useState } from 'react';
import { Search, Plus, FolderTree, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

interface Category {
  id: number;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const { isAdmin } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', display_order: 0, is_active: true });

  const [searchTerm, setSearchTerm] = useState('');

  const loadCategories = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, [isAdmin]);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ 
        name: category.name, 
        display_order: category.display_order || 0, 
        is_active: category.is_active 
      });
    } else {
      setEditingCategory(null);
      setFormData({ 
        name: '', 
        display_order: (categories.length > 0 ? Math.max(...categories.map(c => c.display_order || 0)) + 1 : 1), 
        is_active: true 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(formData);
        if (error) throw error;
      }
      closeModal();
      loadCategories();
    } catch (err) {
      alert('Failed to save category');
      console.error(err);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? This might break menu items associated with it.`)) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      loadCategories();
    } catch (err) {
      alert('Failed to delete category');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Menu Categories</h2>
          <p className="text-white/50 text-sm mt-1">Manage database-driven categories for your menu.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all uppercase tracking-[1px] text-sm shadow-[0_0_20px_rgba(239,143,47,0.3)] hover:shadow-[0_0_30px_rgba(239,143,47,0.5)]"
        >
          <Plus className="w-5 h-5" /> Add Category
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
           [...Array(4)].map((_, i) => (
             <div key={i} className="bg-[#181818] border border-white/5 rounded-2xl p-6 h-32 animate-pulse flex flex-col justify-between">
               <div className="w-10 h-10 bg-white/10 rounded-xl" />
               <div className="w-24 h-4 bg-white/10 rounded" />
             </div>
           ))
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full p-12 flex flex-col items-center justify-center text-center bg-[#181818] border border-white/5 rounded-2xl">
            <FolderTree size={48} className="text-white/10 mb-4" />
            <p className="text-white/40 text-lg font-bebas tracking-[2px]">No categories found.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="group bg-[#181818] border border-white/5 hover:border-white/20 hover:bg-white/[0.02] rounded-2xl p-6 transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#ef8f2f]/5 rounded-full blur-2xl group-hover:bg-[#ef8f2f]/10 transition-colors pointer-events-none" />
              
              <div className="flex justify-between items-start z-10">
                <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-[#ef8f2f] shadow-inner">
                  <FolderTree size={20} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="p-2 bg-black/40 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 bg-black/40 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="z-10 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-wide">{cat.name}</h3>
                  <span className={`text-[9px] uppercase font-bold tracking-[1px] px-2 py-0.5 rounded-full border ${cat.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-white/5 text-white/40 border-white/10'}`}>
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1 uppercase tracking-[1px]">Order: {cat.display_order}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-[#121212] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bebas text-3xl tracking-[2px] uppercase text-white mb-6">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all" 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[1px] font-bold text-white/50">Display Order</label>
                <input 
                  type="number" 
                  value={formData.display_order} 
                  onChange={e => setFormData({...formData, display_order: Number(e.target.value)})} 
                  required 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all" 
                />
              </div>

              <label className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors mt-4">
                <div>
                  <span className="text-white text-sm font-bold block">Available</span>
                  <span className="text-[10px] uppercase tracking-[1px] text-white/40 block mt-1">Show on customer menu</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 accent-green-500 cursor-pointer" 
                />
              </label>

              <div className="flex gap-3 pt-4 border-t border-white/5">
                <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-[1px] text-xs text-white/60 hover:bg-white/5 hover:text-white transition-colors border border-transparent hover:border-white/10">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black py-3 px-4 rounded-xl font-bold uppercase tracking-[1px] text-xs transition-all shadow-lg shadow-[#ef8f2f]/20">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
