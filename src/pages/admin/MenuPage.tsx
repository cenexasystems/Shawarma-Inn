import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Check, CheckSquare, Square, PowerOff, Edit3, Star } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { resolveMenuImage } from '../../utils/menuImages';

export default function MenuPage() {
  const { isAdmin } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vegFilter, setVegFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [sortField, setSortField] = useState('display_order');
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        supabase.from('menu_items').select('*').order('display_order', { ascending: true }),
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
      ]);
      setItems(menuRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  // Client-side filtering & sorting
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = categoryFilter ? item.category === categoryFilter : true;
      const matchVeg = vegFilter ? (vegFilter === 'veg' ? item.is_veg : !item.is_veg) : true;
      const matchAvail = availabilityFilter ? (availabilityFilter === 'available' ? item.is_active : !item.is_active) : true;
      return matchSearch && matchCat && matchVeg && matchAvail;
    }).sort((a, b) => {
      if (sortField === 'display_order') return (a.display_order || 0) - (b.display_order || 0);
      if (sortField === 'price_asc') return a.price - b.price;
      if (sortField === 'price_desc') return b.price - a.price;
      if (sortField === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [items, searchTerm, categoryFilter, vegFilter, availabilityFilter, sortField]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openDrawer = (product: any = null) => {
    setEditingProduct(product);
    setDrawerOpen(true);
  };

  const handleBulkPrice = async () => {
    const amt = prompt('Enter amount to increase (e.g. 10) or decrease (e.g. -5):');
    if (!amt || isNaN(Number(amt))) return;
    
    try {
      const amount = Number(amt);
      
      // Update locally first for immediate feedback (optimistic)
      setItems(prev => prev.map(item => {
        if (selectedIds.has(item.id)) {
          return { ...item, price: Math.max(0, item.price + amount) };
        }
        return item;
      }));

      // In a real app we might use a stored RPC procedure for bulk updates, 
      // but since we don't have one defined in the SQL schema for this specific task, 
      // we can update them in a loop or Promise.all.
      const updates = Array.from(selectedIds).map(id => {
        const item = items.find(i => i.id === id);
        if (item) {
           return supabase.from('menu_items').update({ price: Math.max(0, item.price + amount) }).eq('id', id);
        }
        return Promise.resolve();
      });
      
      await Promise.all(updates);
      setSelectedIds(new Set());
    } catch (e) {
      alert('Failed to update prices');
      loadData(); // Revert on failure
    }
  };

  const handleBulkAvailability = async (is_active: boolean) => {
    if (!window.confirm(`Mark ${selectedIds.size} items as ${is_active ? 'Available' : 'Hidden'}?`)) return;
    
    try {
       setItems(prev => prev.map(item => {
        if (selectedIds.has(item.id)) {
          return { ...item, is_active };
        }
        return item;
      }));
      
      const updates = Array.from(selectedIds).map(id => {
         return supabase.from('menu_items').update({ is_active }).eq('id', id);
      });
      
      await Promise.all(updates);
      setSelectedIds(new Set());
    } catch (e) {
      alert('Failed to update availability');
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Menu Inventory</h2>
          <p className="text-white/50 text-sm mt-1">Manage your entire product catalog from one place.</p>
        </div>
        <button 
          onClick={() => openDrawer()}
          className="bg-[#ef8f2f] hover:bg-[#ef8f2f]/90 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all uppercase tracking-[1px] text-sm shadow-[0_0_20px_rgba(239,143,47,0.3)] hover:shadow-[0_0_30px_rgba(239,143,47,0.5)]"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#ef8f2f] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#ef8f2f] transition-all">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#ef8f2f] transition-all">
            <option value="">Any Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Hidden</option>
          </select>
          <select value={vegFilter} onChange={e => setVegFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#ef8f2f] transition-all">
            <option value="">Any Type</option>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
          </select>
          <select value={sortField} onChange={e => setSortField(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-[#ef8f2f] transition-all">
            <option value="display_order">Custom Order</option>
            <option value="name_asc">A-Z</option>
            <option value="price_desc">Highest Price</option>
            <option value="price_asc">Lowest Price</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs font-medium text-white/40 uppercase tracking-[1px] px-2">
        <span>Showing {filteredItems.length} Products</span>
        {selectedIds.size > 0 && <span className="text-[#ef8f2f]">{selectedIds.size} Selected</span>}
      </div>

      {/* Data Table */}
      <div className="bg-[#181818] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-black/40 text-white/50 text-[10px] uppercase tracking-[2px]">
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="text-white/40 hover:text-white transition-colors">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-4 h-4 text-[#ef8f2f]" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="p-4 font-medium">Product Details</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-center">Highlight</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="p-4"><div className="w-4 h-4 bg-white/10 rounded" /></td>
                    <td className="p-4 flex gap-3">
                      <div className="w-12 h-12 bg-white/10 rounded-lg" />
                      <div>
                        <div className="w-32 h-4 bg-white/10 rounded mb-2" />
                        <div className="w-48 h-3 bg-white/5 rounded" />
                      </div>
                    </td>
                    <td className="p-4"><div className="w-20 h-4 bg-white/10 rounded" /></td>
                    <td className="p-4"><div className="w-16 h-4 bg-white/10 rounded" /></td>
                    <td className="p-4"><div className="w-8 h-8 bg-white/10 rounded-full mx-auto" /></td>
                    <td className="p-4"><div className="w-4 h-4 bg-white/10 rounded mx-auto" /></td>
                    <td className="p-4"><div className="w-8 h-8 bg-white/10 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-white/40 text-sm">No products found.</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.checkbox-cell')) return;
                    openDrawer(item);
                  }}>
                    <td className="p-4 checkbox-cell">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="text-white/40 hover:text-white transition-colors">
                        {selectedIds.has(item.id) ? <CheckSquare className="w-4 h-4 text-[#ef8f2f]" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <img 
                            src={resolveMenuImage({ image_url: item.image_url, name: item.name, category: item.category })} 
                            alt={item.name} 
                            className="w-14 h-14 rounded-xl object-cover bg-black/40 border border-white/5" 
                           />
                           {item.is_veg && <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-[#181818]" title="Vegetarian"></span>}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.name}</div>
                          <div className="text-xs text-white/40 max-w-[200px] truncate mt-1">{item.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-black/40 border border-white/5 rounded-full text-[10px] font-bold text-white/60 uppercase tracking-[1px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bebas text-xl text-[#ef8f2f]">₹{item.price}</div>
                      {item.large_price && <div className="text-[10px] text-white/40 uppercase tracking-[1px]">Large: ₹{item.large_price}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/30'}`}>
                        {item.is_active ? <Check className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.is_bestseller ? <Star className="w-4 h-4 text-yellow-500 mx-auto fill-yellow-500/20" /> : <span className="text-white/10">-</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-white/40 hover:text-white bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Bulk Action Strip */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121212]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.8)] rounded-2xl px-6 py-4 flex items-center gap-6 z-30 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-3">
            <span className="bg-[#ef8f2f] text-black w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">{selectedIds.size}</span>
            <span className="text-white/80 text-sm font-medium uppercase tracking-[1px]">Selected</span>
          </div>
          <div className="h-6 w-px bg-white/10"></div>
          <div className="flex items-center gap-3">
            <button onClick={handleBulkPrice} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-[1px] transition-colors border border-white/5">
              Edit Price
            </button>
            <button onClick={() => handleBulkAvailability(true)} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl text-xs font-bold uppercase tracking-[1px] transition-colors border border-green-500/20">
              Make Available
            </button>
            <button onClick={() => handleBulkAvailability(false)} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase tracking-[1px] transition-colors border border-red-500/20">
              Hide
            </button>
          </div>
        </div>
      )}

      <ProductDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        product={editingProduct} 
        categories={categories}
        onSave={() => { setDrawerOpen(false); loadData(); }} 
      />
    </div>
  );
}
