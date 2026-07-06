import { useEffect, useState } from 'react';
import { Search, Plus, FolderTree, Edit3, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

interface Category {
  id: string;
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

  const handleDelete = async (id: string, name: string) => {
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

  const syncDefaultCategories = async () => {
    if (!window.confirm("This will wipe existing categories and insert the 13 exact default categories. Proceed?")) return;
    
    try {
      // Delete existing
      for (const cat of categories) {
        const { error: delErr } = await supabase.from('categories').delete().eq('id', cat.id);
        if (delErr) console.error("Error deleting", cat.id, delErr);
      }
      
      const defaults = [
        'Shawarma', 'Burgers', 'Toasts', 'Starters', 'Mojitos',
        'Waffles', 'Milkshakes', 'Pizza', 'Momos', 'Combo Deals',
        'Loaded Fries', 'Bring Your Own Chips', 'Desserts'
      ];
      
      let errorCount = 0;
      let lastErr = '';

      for (let i = 0; i < defaults.length; i++) {
        const { error: insErr } = await supabase.from('categories').insert({
          name: defaults[i],
          display_order: i + 1,
          is_active: true
        });
        if (insErr) {
          console.error("Insert error for", defaults[i], insErr);
          errorCount++;
          lastErr = insErr.message;
        }
      }
      
      if (errorCount > 0) {
        alert(`Failed to insert ${errorCount} categories. Last error: ${lastErr}`);
      } else {
        alert("Categories synced successfully!");
      }
      
      loadCategories();
    } catch (e: any) {
      console.error(e);
      alert("An unexpected error occurred: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
      <PageHeader 
        title="Menu Categories"
        subtitle="Manage database-driven categories for your menu."
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline"
              icon={RefreshCw}
              onClick={syncDefaultCategories}
            >
              Sync Defaults
            </Button>
            <Button 
              icon={Plus}
              onClick={() => openModal()}
            >
              Add Category
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      <Card className="p-4 mb-8">
        <div className="relative w-full md:w-96">
          <Input 
            type="text" 
            placeholder="Search categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
           [...Array(4)].map((_, i) => (
             <Card key={i} className="p-6 h-[140px] animate-pulse flex flex-col justify-between">
               <div className="w-10 h-10 bg-gray-200 rounded-[10px]" />
               <div className="w-24 h-4 bg-gray-200 rounded" />
             </Card>
           ))
        ) : filteredCategories.length === 0 ? (
          <div className="col-span-full p-16 flex flex-col items-center justify-center text-center bg-white border border-dashed border-erp-border rounded-erp">
            <FolderTree size={48} className="text-gray-300 mb-4" />
            <p className="text-erp-muted text-lg font-bebas tracking-[2px]">No categories found.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <Card key={cat.id} className="group hover:border-erp-primary p-6 transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-erp-primary/5 rounded-full blur-2xl group-hover:bg-erp-primary/10 transition-colors pointer-events-none" />
              
              <div className="flex justify-between items-start z-10">
                <div className="w-12 h-12 rounded-[12px] bg-gray-50 border border-erp-border flex items-center justify-center text-erp-primary shadow-sm">
                  <FolderTree size={20} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(cat)} className="w-[32px] h-[32px] flex items-center justify-center bg-gray-100 text-erp-muted hover:text-erp-text hover:bg-gray-200 rounded-[8px] transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="w-[32px] h-[32px] flex items-center justify-center bg-erp-danger/5 text-erp-danger hover:bg-erp-danger/10 rounded-[8px] transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="z-10 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-erp-text tracking-wide">{cat.name}</h3>
                  <span className={`text-[9px] uppercase font-bold tracking-[1px] px-2 py-0.5 rounded-full border ${cat.is_active ? 'bg-erp-success/10 text-erp-success border-erp-success/20' : 'bg-gray-100 text-erp-muted border-gray-200'}`}>
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <p className="text-[11px] text-erp-muted mt-1 uppercase tracking-[1px] font-bold">Order: {cat.display_order}</p>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white border border-erp-border rounded-[24px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bebas text-3xl tracking-[2px] uppercase text-erp-text mb-6">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[1px] font-bold text-erp-muted">Category Name</label>
                <Input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-[1px] font-bold text-erp-muted">Display Order</label>
                <Input 
                  type="number" 
                  value={formData.display_order} 
                  onChange={e => setFormData({...formData, display_order: Number(e.target.value)})} 
                  required 
                />
              </div>

              <label className="flex items-center justify-between p-4 rounded-[14px] bg-white border border-erp-border cursor-pointer hover:bg-gray-50 transition-colors mt-4 shadow-sm group">
                <div>
                  <span className="text-erp-text text-[13px] font-bold block">Available</span>
                  <span className="text-[11px] uppercase tracking-[1px] text-erp-muted block mt-1">Show on customer menu</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={formData.is_active} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                  className="w-5 h-5 accent-erp-primary cursor-pointer" 
                />
              </label>

              <div className="flex gap-3 pt-6 mt-6 border-t border-erp-border">
                <Button variant="outline" type="button" onClick={closeModal} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Save
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
