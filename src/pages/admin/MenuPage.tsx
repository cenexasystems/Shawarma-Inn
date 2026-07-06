import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, CheckSquare, Square, PowerOff, Edit3, Star, Package } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { ProductDrawer } from '../../components/admin/ProductDrawer';
import { resolveMenuImage } from '../../utils/menuImages';

import { PageHeader } from '../../components/ui/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

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
      <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
        
        <PageHeader 
          title="Menu Management"
          subtitle="Manage your entire product catalog from one place."
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard title="Total Products" value={items.length} icon={Package} iconBgColor="bg-gray-100" iconColor="text-gray-700" />
          <KPICard title="Active" value={items.filter(i => i.is_active).length} icon={CheckSquare} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" />
          <KPICard title="Bestsellers" value={items.filter(i => i.is_bestseller).length} icon={Star} iconBgColor="bg-erp-warning/10" iconColor="text-erp-warning" />
          <KPICard title="Categories" value={categories.length} icon={Square} iconBgColor="bg-erp-blue/10" iconColor="text-erp-blue" />
        </div>

        {/* Table Section */}
        <div className="bg-erp-card rounded-erp shadow-erp border border-erp-border overflow-hidden flex flex-col">
          
          {/* Toolbar */}
          <div className="px-6 py-5 border-b border-erp-border flex flex-wrap items-center justify-between gap-4 bg-erp-card">
            <div className="flex items-center gap-3">
              <Package size={20} className="text-erp-primary" />
              <h2 className="text-[18px] font-semibold text-erp-text font-inter">Product Catalog</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-erp-muted text-xs font-semibold rounded-full">
                {filteredItems.length} Products
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-[240px]">
                <Input 
                  icon={Search} 
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-[180px]">
                <Select 
                  value={categoryFilter} 
                  onChange={e => setCategoryFilter(e.target.value)}
                  options={[
                    { label: 'All Categories', value: '' },
                    ...categories.map(c => ({ label: c.name, value: c.name }))
                  ]}
                />
              </div>
              <div className="w-[180px]">
                <Select 
                  value={availabilityFilter} 
                  onChange={e => setAvailabilityFilter(e.target.value)}
                  options={[
                    { label: 'Any Availability', value: '' },
                    { label: 'Available', value: 'available' },
                    { label: 'Hidden', value: 'unavailable' }
                  ]}
                />
              </div>
              <Button onClick={() => openDrawer()} icon={Plus} className="h-[38px]">
                Add Product
              </Button>
            </div>
          </div>

          {/* Bulk Action Strip */}
          {selectedIds.size > 0 && (
            <div className="bg-gray-50 border-b border-erp-border px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="bg-erp-primary text-white w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold">{selectedIds.size}</span>
                <span className="text-erp-text text-sm font-bold uppercase tracking-widest">Selected</span>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={toggleSelectAll}>Clear</Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkAvailability(true)}>Make Available</Button>
                <Button variant="danger" size="sm" onClick={() => handleBulkAvailability(false)}>Hide Items</Button>
              </div>
            </div>
          )}

          {/* Table List */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">
                  <button onClick={toggleSelectAll} className="mt-1">
                    {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? (
                      <CheckSquare className="w-5 h-5 text-erp-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-erp-muted" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Product Details</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Highlight</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-[54px] animate-pulse bg-gray-50/50" />
                  </TableRow>
                ))
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-erp-muted">
                    No products match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((row) => (
                  <TableRow key={row.id} className="h-[54px]" onClick={() => openDrawer(row)}>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(row.id); }} className="mt-1">
                        {selectedIds.has(row.id) ? (
                          <CheckSquare className="w-5 h-5 text-erp-primary" />
                        ) : (
                          <Square className="w-5 h-5 text-erp-muted hover:text-erp-text" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img 
                            src={resolveMenuImage({ image_url: row.image_url, name: row.name, category: row.category })} 
                            alt={row.name} 
                            className="w-[44px] h-[44px] rounded-[10px] object-cover bg-gray-100 border border-erp-border" 
                          />
                          {row.is_veg && <span className="absolute -top-[4px] -right-[4px] w-[12px] h-[12px] rounded-full bg-erp-success border-[2px] border-white" title="Vegetarian"></span>}
                        </div>
                        <div className="flex flex-col gap-[6px]">
                          <div className="font-bold text-erp-text text-[14px] leading-none">{row.name}</div>
                          <div className="text-[12px] text-erp-muted max-w-[250px] truncate leading-none">{row.description || 'No description'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 rounded-lg text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                        {row.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-bold text-[14px] text-erp-text">₹{row.price}</div>
                        {row.large_price && <div className="text-[11px] text-erp-muted uppercase tracking-[1px] font-bold mt-1">L: ₹{row.large_price}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center w-[32px] h-[32px] rounded-full ${row.is_active ? 'bg-erp-success/10 text-erp-success' : 'bg-gray-100 text-erp-muted'}`}>
                        <PowerOff className="w-[16px] h-[16px]" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {row.is_bestseller ? <Star className="w-[18px] h-[18px] text-erp-warning mx-auto fill-erp-warning" /> : <span className="text-erp-border">—</span>}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }} className="w-[36px] h-[36px] flex items-center justify-center text-erp-muted hover:text-erp-text bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mx-auto">
                        <Edit3 className="w-[16px] h-[16px]" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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
