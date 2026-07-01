import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Edit2, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

const emptyMenuItem = {
  name: '',
  price: '',
  category: '',
  image_url: '',
  is_bestseller: false,
  is_active: true,
};

export default function MenuPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [menuForm, setMenuForm] = useState(emptyMenuItem);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const [menuRes, catRes] = await Promise.all([
        apiRequest<any>('/admin/menu-items', { token: tokenRequired }),
        apiRequest<any[]>('/admin/categories', { token: tokenRequired }),
      ]);
      setMenuItems(menuRes.items || []);
      setCategories(catRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const handleMenuSubmit = async () => {
    try {
      const payload = {
        name: menuForm.name,
        price: Number(menuForm.price),
        category: menuForm.category,
        image_url: menuForm.image_url,
        is_bestseller: menuForm.is_bestseller,
        is_active: menuForm.is_active,
      };
      if (editingMenuId) {
        await apiRequest(`/admin/menu-items/${editingMenuId}`, {
          method: 'PUT',
          token: tokenRequired,
          body: payload,
        });
      } else {
        await apiRequest('/admin/menu-items', {
          method: 'POST',
          token: tokenRequired,
          body: payload,
        });
      }
      setMenuForm(emptyMenuItem);
      setEditingMenuId(null);
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save menu item');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await apiRequest(`/admin/menu-items/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete menu item');
    }
  };

  const handleToggleMenuVisibility = async (id: number) => {
    try {
      await apiRequest(`/admin/menu-items/${id}/hide`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle visibility');
    }
  };

  const handleDuplicateMenu = async (id: number) => {
    try {
      await apiRequest(`/admin/menu-items/${id}/duplicate`, { method: 'POST', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate menu item');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Menu Management</h2>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}
      {loading && <div className="text-xs text-white/30 animate-pulse">Loading menu items…</div>}

      <div className="bg-[#181818] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4 text-[#ef8f2f]">{editingMenuId ? 'Edit Item' : 'Add New Item'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input type="text" placeholder="Item Name" value={menuForm.name} onChange={e => setMenuForm({...menuForm, name: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <input type="number" placeholder="Price (₹)" value={menuForm.price} onChange={e => setMenuForm({...menuForm, price: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
          <select value={menuForm.category} onChange={e => setMenuForm({...menuForm, category: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f] text-white">
            <option value="" disabled>Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input type="text" placeholder="Image URL (optional)" value={menuForm.image_url} onChange={e => setMenuForm({...menuForm, image_url: e.target.value})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#ef8f2f]" />
        </div>
        <div className="flex items-center gap-6 mb-6">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
            <input type="checkbox" checked={menuForm.is_active} onChange={e => setMenuForm({...menuForm, is_active: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
            Available for Order
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-white/70 hover:text-white">
            <input type="checkbox" checked={menuForm.is_bestseller} onChange={e => setMenuForm({...menuForm, is_bestseller: e.target.checked})} className="accent-[#ef8f2f] w-4 h-4" />
            Mark as Bestseller
          </label>
        </div>
        <div className="flex gap-3">
          <button onClick={handleMenuSubmit} className="bg-[#ef8f2f] text-black px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-[#ef8f2f]/90 transition-colors">
            {editingMenuId ? 'Update Item' : 'Add Item'}
          </button>
          {editingMenuId && (
            <button onClick={() => { setEditingMenuId(null); setMenuForm(emptyMenuItem); }} className="px-6 py-3 border border-white/20 rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-white/5 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {menuItems.map(item => (
          <div key={item.id} className={`bg-[#181818] border rounded-2xl overflow-hidden transition-all ${item.is_active ? 'border-white/10 hover:border-white/30' : 'border-red-500/20 opacity-70'}`}>
            {item.image_url && <div className="h-32 w-full bg-black/40"><img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80" /></div>}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                {item.is_bestseller && <Star size={16} className="text-yellow-400 fill-yellow-400 shrink-0" />}
              </div>
              <p className="text-xs text-white/50 mb-3">{item.category}</p>
              <p className="font-bebas text-3xl text-[#ef8f2f] mb-4">₹{item.price}</p>
              
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <button onClick={() => handleToggleMenuVisibility(item.id)} className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${item.is_active ? 'text-green-400' : 'text-red-400'}`}>
                  {item.is_active ? <><Eye size={14} /> Active</> : <><EyeOff size={14} /> Hidden</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingMenuId(item.id); setMenuForm({ name: item.name, price: String(item.price), category: item.category, image_url: item.image_url || '', is_bestseller: !!item.is_bestseller, is_active: !!item.is_active }); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDuplicateMenu(item.id)} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white" title="Duplicate">
                    <Copy size={16} />
                  </button>
                  <a href={`/menu`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white flex items-center justify-center" title="Preview on Website">
                    <ExternalLink size={16} />
                  </a>
                  <button onClick={() => handleDeleteMenu(item.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
