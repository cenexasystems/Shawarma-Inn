import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Check, CheckSquare, Square, PowerOff, Edit3 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { resolveMenuImage } from '../../utils/menuImages';

export default function MenuPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
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
  const [bestsellerFilter] = useState('');
  const [sortField, setSortField] = useState('display_order');
  
  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        apiRequest<any>('/admin/menu-items', { token: tokenRequired }),
        apiRequest<any[]>('/admin/categories', { token: tokenRequired }),
      ]);
      setItems(menuRes.items || []);
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

  // Client-side filtering & sorting
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = categoryFilter ? item.category === categoryFilter : true;
      const matchVeg = vegFilter ? (vegFilter === 'veg' ? item.is_veg : !item.is_veg) : true;
      const matchAvail = availabilityFilter ? (availabilityFilter === 'available' ? item.is_active : !item.is_active) : true;
      const matchBest = bestsellerFilter ? item.is_bestseller : true;
      return matchSearch && matchCat && matchVeg && matchAvail && matchBest;
    }).sort((a, b) => {
      if (sortField === 'display_order') return a.display_order - b.display_order;
      if (sortField === 'price_asc') return a.price - b.price;
      if (sortField === 'price_desc') return b.price - a.price;
      if (sortField === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [items, searchTerm, categoryFilter, vegFilter, availabilityFilter, bestsellerFilter, sortField]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
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
      await apiRequest('/admin/menu-items/bulk/price', {
        method: 'PATCH',
        token: tokenRequired,
        body: { ids: Array.from(selectedIds), amount: Number(amt) }
      });
      setSelectedIds(new Set());
      loadData();
    } catch (e) { alert('Failed'); }
  };

  const handleBulkAvailability = async (is_active: boolean) => {
    if (!window.confirm(`Mark ${selectedIds.size} items as ${is_active ? 'Available' : 'Unavailable'}?`)) return;
    try {
      await apiRequest('/admin/menu-items/bulk/availability', {
        method: 'PATCH',
        token: tokenRequired,
        body: { ids: Array.from(selectedIds), is_active }
      });
      setSelectedIds(new Set());
      loadData();
    } catch (e) { alert('Failed'); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Menu Inventory</h1>
          <p className="text-zinc-400 mt-1">Manage your entire product catalog from one place.</p>
        </div>
        <button 
          onClick={() => openDrawer()}
          className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors whitespace-nowrap shadow-lg shadow-orange-900/20"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search 167+ products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 focus:outline-none focus:border-orange-500">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 focus:outline-none focus:border-orange-500">
            <option value="">Any Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Hidden</option>
          </select>
          <select value={vegFilter} onChange={e => setVegFilter(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 focus:outline-none focus:border-orange-500">
            <option value="">Veg / Non-Veg</option>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
          </select>
          <select value={sortField} onChange={e => setSortField(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-300 focus:outline-none focus:border-orange-500">
            <option value="display_order">Custom Order</option>
            <option value="name_asc">A-Z</option>
            <option value="price_desc">Highest Price</option>
            <option value="price_asc">Lowest Price</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-medium text-zinc-400 px-1">
        <span>Showing {filteredItems.length} Products</span>
        {selectedIds.size > 0 && <span className="text-orange-500">{selectedIds.size} Selected</span>}
      </div>

      {/* Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-800/50 border-b border-zinc-800">
                <th className="p-4 w-12">
                  <button onClick={toggleSelectAll} className="text-zinc-400 hover:text-white">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="p-4 text-sm font-semibold text-zinc-400">Product</th>
                <th className="p-4 text-sm font-semibold text-zinc-400">Category</th>
                <th className="p-4 text-sm font-semibold text-zinc-400">Price</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-center">Available</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-center">Bestseller</th>
                <th className="p-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">Loading products...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-zinc-500">No products found matching filters.</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group cursor-pointer" onClick={(e) => {
                    // Prevent drawer opening if they click the checkbox
                    if ((e.target as HTMLElement).closest('.checkbox-cell')) return;
                    openDrawer(item);
                  }}>
                    <td className="p-4 checkbox-cell">
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }} className="text-zinc-500 hover:text-white">
                        {selectedIds.has(item.id) ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={resolveMenuImage({ image_url: item.image_url, name: item.name, category: item.category })} 
                          alt={item.name} 
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-800 border border-zinc-700 flex-shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-2">
                            {item.name}
                            {item.is_veg && <span className="w-2 h-2 rounded-full bg-green-500" title="Veg"></span>}
                          </div>
                          <div className="text-xs text-zinc-500 max-w-[200px] truncate">{item.description || 'No description'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-full text-xs font-medium text-zinc-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">₹{item.price}</div>
                      {item.large_price && <div className="text-xs text-zinc-500">L: ₹{item.large_price}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${item.is_active ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-500'}`}>
                        {item.is_active ? <Check className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.is_bestseller ? <span className="text-yellow-500 font-bold">★</span> : <span className="text-zinc-700">-</span>}
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

      {/* Bulk Action Strip */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-30 animate-in slide-in-from-bottom-10">
          <div className="flex items-center gap-2">
            <span className="bg-orange-500/20 text-orange-500 px-2.5 py-0.5 rounded-md font-bold">{selectedIds.size}</span>
            <span className="text-zinc-300 font-medium">Items Selected</span>
          </div>
          <div className="h-6 w-px bg-zinc-700"></div>
          <div className="flex items-center gap-2">
            <button onClick={handleBulkPrice} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors">
              Update Price
            </button>
            <button onClick={() => handleBulkAvailability(true)} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors">
              Make Available
            </button>
            <button onClick={() => handleBulkAvailability(false)} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors">
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
