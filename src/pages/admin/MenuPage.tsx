import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, CheckSquare, Square, PowerOff, Edit3, Star } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { resolveMenuImage } from '../../utils/menuImages';

import { PageLayout } from '../../design-system/PageLayout';
import { TableSystem, type Column } from '../../design-system/TableSystem';
import { Button } from '../../design-system/ButtonSystem';
import { StatCard } from '../../design-system/CardSystem';

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
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  
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

  // Client-side filtering
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = categoryFilter ? item.category === categoryFilter : true;
      const matchAvail = availabilityFilter ? (availabilityFilter === 'available' ? item.is_active : !item.is_active) : true;
      return matchSearch && matchCat && matchAvail;
    });
  }, [items, searchTerm, categoryFilter, availabilityFilter]);

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

  const handleBulkAvailability = async (is_active: boolean) => {
    if (!window.confirm(`Mark ${selectedIds.size} items as ${is_active ? 'Available' : 'Hidden'}?`)) return;
    try {
      setItems(prev => prev.map(item => {
        if (selectedIds.has(item.id)) return { ...item, is_active };
        return item;
      }));
      const updates = Array.from(selectedIds).map(id => supabase.from('menu_items').update({ is_active }).eq('id', id));
      await Promise.all(updates);
      setSelectedIds(new Set());
    } catch (e) {
      alert('Failed to update availability');
      loadData();
    }
  };

  const columns = useMemo<Column<any>[]>(() => [
    {
      header: '',
      width: '60px',
      accessor: (row) => (
        <button onClick={(e) => { e.stopPropagation(); toggleSelect(row.id); }} className="text-erp-muted hover:text-erp-text transition-colors mt-1">
          {selectedIds.has(row.id) ? <CheckSquare className="w-5 h-5 text-erp-primary" /> : <Square className="w-5 h-5" />}
        </button>
      ),
    },
    {
      header: 'Product Details',
      accessor: (row) => (
        <div className="flex items-center gap-[16px]">
          <div className="relative shrink-0">
            <img 
              src={resolveMenuImage({ image_url: row.image_url, name: row.name, category: row.category })} 
              alt={row.name} 
              className="w-[48px] h-[48px] rounded-[12px] object-cover bg-erp-bg border border-erp-border" 
            />
            {row.is_veg && <span className="absolute -top-[4px] -right-[4px] w-[12px] h-[12px] rounded-full bg-erp-success border-[2px] border-white" title="Vegetarian"></span>}
          </div>
          <div>
            <div className="font-[700] text-erp-text text-[15px]">{row.name}</div>
            <div className="text-[13px] text-erp-muted max-w-[200px] truncate mt-[4px]">{row.description || 'No description'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (row) => (
        <span className="inline-block px-[12px] py-[4px] bg-erp-bg border border-erp-border rounded-[8px] text-[11px] font-[700] text-erp-muted uppercase tracking-[1px]">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Price',
      accessor: (row) => (
        <div>
          <div className="font-manrope font-[800] text-[16px] text-erp-text">₹{row.price}</div>
          {row.large_price && <div className="text-[11px] text-erp-muted uppercase tracking-[1px] font-[700] mt-[2px]">L: ₹{row.large_price}</div>}
        </div>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      accessor: (row) => (
        <div className={`inline-flex items-center justify-center w-[32px] h-[32px] rounded-full ${row.is_active ? 'bg-erp-success/10 text-erp-success' : 'bg-erp-bg text-erp-muted'}`}>
          <PowerOff className="w-[16px] h-[16px]" />
        </div>
      ),
    },
    {
      header: 'Highlight',
      align: 'center',
      accessor: (row) => (
        row.is_bestseller ? <Star className="w-[18px] h-[18px] text-erp-warning mx-auto fill-erp-warning" /> : <span className="text-erp-border">—</span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      accessor: (row) => (
        <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }} className="p-[8px] text-erp-muted hover:text-erp-text bg-erp-bg hover:bg-gray-200 rounded-[8px] transition-colors">
          <Edit3 className="w-[18px] h-[18px]" />
        </button>
      ),
    }
  ], [selectedIds]);

  return (
    <>
      <PageLayout
        title="Menu Management"
        subtitle="Manage your entire product catalog from one place."
        toolbar={
          <div className="flex flex-1 items-center justify-between gap-[24px]">
            <div className="flex items-center gap-[12px] flex-1">
              <div className="relative w-full max-w-[320px]">
                <Search className="absolute left-[12px] top-[14px] text-erp-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-erp-border rounded-[12px] pl-[40px] pr-[16px] h-[46px] text-[15px] font-inter text-erp-text focus:outline-none focus:border-erp-primary shadow-sm"
                />
              </div>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[14px] font-[600] text-erp-text focus:outline-none focus:border-erp-primary shadow-sm appearance-none">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <select value={availabilityFilter} onChange={e => setAvailabilityFilter(e.target.value)} className="bg-white border border-erp-border rounded-[12px] px-[16px] h-[46px] text-[14px] font-[600] text-erp-text focus:outline-none focus:border-erp-primary shadow-sm appearance-none">
                <option value="">Any Availability</option>
                <option value="available">Available</option>
                <option value="unavailable">Hidden</option>
              </select>
            </div>
            
            <Button onClick={() => openDrawer()}>
              <Plus size={18} className="mr-[8px]" /> Add Product
            </Button>
          </div>
        }
        statistics={
          <>
            <StatCard title="Total Products" value={items.length} />
            <StatCard title="Active" value={items.filter(i => i.is_active).length} valueColor="text-erp-success" />
            <StatCard title="Bestsellers" value={items.filter(i => i.is_bestseller).length} valueColor="text-erp-warning" />
            <StatCard title="Categories" value={categories.length} valueColor="text-erp-blue" />
          </>
        }
      >
        <div className="flex justify-between items-center text-[12px] font-[700] text-erp-muted uppercase tracking-[1px] px-[8px]">
          <span>Showing {filteredItems.length} Products</span>
          {selectedIds.size > 0 && <span className="text-erp-primary">{selectedIds.size} Selected</span>}
        </div>
        
        {/* Bulk Action Strip */}
        {selectedIds.size > 0 && (
          <div className="bg-erp-bg border border-erp-border rounded-[16px] px-[24px] py-[16px] flex items-center justify-between mb-[24px]">
            <div className="flex items-center gap-[12px]">
              <span className="bg-erp-primary text-white w-[28px] h-[28px] flex items-center justify-center rounded-[8px] text-[14px] font-[700]">{selectedIds.size}</span>
              <span className="text-erp-text text-[14px] font-[700] uppercase tracking-[1px]">Selected</span>
            </div>
            <div className="flex items-center gap-[12px]">
              <Button variant="ghost" onClick={toggleSelectAll}>Clear</Button>
              <Button variant="secondary" onClick={() => handleBulkAvailability(true)}>Make Available</Button>
              <Button variant="danger" onClick={() => handleBulkAvailability(false)}>Hide Items</Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-erp shadow-erp overflow-hidden border border-erp-border">
          {loading ? (
            <div className="animate-pulse space-y-[4px]">
              {[...Array(5)].map((_, i) => <div key={i} className="h-[72px] bg-white border-b border-erp-border" />)}
            </div>
          ) : (
            <TableSystem 
              data={filteredItems}
              columns={columns}
              keyExtractor={(row) => row.id}
              emptyMessage="No products match your filters."
              onRowClick={(row) => {
                // To avoid breaking selection when clicking row, openDrawer triggers only if we don't click the checkbox column
                // In our TableSystem, the row click happens on the tr. We'll handle it here.
                openDrawer(row);
              }}
            />
          )}
        </div>
      </PageLayout>

      <ProductDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        product={editingProduct} 
        categories={categories}
        onSave={() => { setDrawerOpen(false); loadData(); }} 
      />
    </>
  );
}
