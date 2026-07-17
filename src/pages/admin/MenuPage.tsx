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
 setItems((menuRes.data || []).filter((item) => {
   const name = String(item.name || '').trim().toLowerCase();
   return name !== 'chicken burger' && name !== 'chinna chicken burger';
 }));
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
 const updates = await Promise.all(
 Array.from(selectedIds).map(id => supabase.from('menu_items').update({ is_active }).eq('id', id)),
 );
 const failed = updates.find((result) => result.error);
 if (failed?.error) throw failed.error;
 await loadData();
 setSelectedIds(new Set());
 } catch (e) {
 alert(e instanceof Error ? e.message : 'Failed to update availability');
 loadData();
 }
 };

 const handleAvailabilityToggle = async (item: any, event: React.MouseEvent<HTMLButtonElement>) => {
 event.stopPropagation();
 const nextActive = !Boolean(item.is_active);
 setItems((prev) => prev.map((current) => (
   current.id === item.id ? { ...current, is_active: nextActive } : current
 )));

 const { error } = await supabase
   .from('menu_items')
   .update({ is_active: nextActive })
   .eq('id', item.id);

 if (error) {
   setItems((prev) => prev.map((current) => (
     current.id === item.id ? { ...current, is_active: item.is_active } : current
   )));
   alert(error.message);
   return;
 }

 await loadData();
 };


 return (
 <>
 <div className="min-h-screen bg-erp-bg px-4 py-5 sm:px-6 sm:py-6 lg:p-[32px]">
 
 <PageHeader 
 title="Menu Management"
 subtitle="Manage your entire product catalog from one place."
 />

 {/* KPI Cards */}
 <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:mb-erp-32 xl:flex xl:flex-wrap xl:gap-erp-24">
 <KPICard title="Total Products" value={items.length} icon={Package} iconBgColor="bg-[#173F2E]/10" iconColor="text-[#173F2E]" className="border-[#173F2E]/10 bg-[#173F2E]/[0.03]" subtitle="Catalog size" />
 <KPICard title="Active" value={items.filter(i => i.is_active).length} icon={CheckSquare} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" className="border-erp-success/10 bg-erp-success/[0.03]" subtitle="Visible now" />
 <KPICard title="Bestsellers" value={items.filter(i => i.is_bestseller).length} icon={Star} iconBgColor="bg-erp-warning/10" iconColor="text-erp-warning" className="border-erp-warning/10 bg-erp-warning/[0.03]" subtitle="Highlighted items" />
 <KPICard title="Categories" value={categories.length} icon={Square} iconBgColor="bg-erp-blue/10" iconColor="text-erp-blue" className="border-erp-blue/10 bg-erp-blue/[0.03]" subtitle="Menu groups" />
 </div>

 {/* Table Section */}
 <div className="bg-erp-card rounded-[24px] shadow-erp border border-erp-border overflow-hidden flex flex-col">
 
 {/* Toolbar */}
 <div className="border-b border-erp-border bg-erp-card px-4 py-4 sm:px-[24px] sm:py-[16px]">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex min-w-0 items-center gap-3">
 <Package size={20} className="text-erp-primary" />
 <h2 className="min-w-0 truncate text-[18px] font-semibold text-erp-text font-inter">Product Catalog</h2>
 <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-erp-muted">
 {filteredItems.length} Products
 </span>
 </div>

 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
 <div className="w-full sm:col-span-2 xl:w-[240px]">
 <Input 
 icon={Search} 
 placeholder="Search products..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 />
 </div>
 <div className="w-full xl:w-[180px]">
 <Select 
 value={categoryFilter} 
 onChange={e => setCategoryFilter(e.target.value)}
 options={[
 { label: 'All Categories', value: '' },
 ...categories.map(c => ({ label: c.name, value: c.name }))
 ]}
 />
 </div>
 <div className="w-full xl:w-[180px]">
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
 <Button onClick={() => openDrawer()} icon={Plus} className="h-[42px] w-full sm:w-auto">
 Add Product
 </Button>
 </div>
 </div>
 </div>

 {/* Bulk Action Strip */}
 {selectedIds.size > 0 && (
 <div className="flex flex-col gap-3 border-b border-erp-border bg-gray-50 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
 <div className="flex items-center gap-3">
 <span className="bg-erp-primary text-white w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold">{selectedIds.size}</span>
 <span className="text-erp-text text-sm font-bold uppercase tracking-widest">Selected</span>
 </div>
 <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
 <Button variant="outline" size="sm" onClick={toggleSelectAll} className="w-full sm:w-auto">Clear</Button>
 <Button variant="secondary" size="sm" onClick={() => handleBulkAvailability(true)} className="w-full sm:w-auto">Make Available</Button>
 <Button variant="danger" size="sm" onClick={() => handleBulkAvailability(false)} className="w-full sm:w-auto">Hide Items</Button>
 </div>
 </div>
 )}

 {/* Mobile List */}
 <div className="grid gap-3 p-4 md:hidden">
 {loading ? (
 [...Array(4)].map((_, i) => (
 <div key={i} className="h-[156px] animate-pulse rounded-[20px] border border-erp-border bg-gray-50/50" />
 ))
 ) : filteredItems.length === 0 ? (
 <div className="rounded-[20px] border border-dashed border-erp-border bg-white p-6 text-center text-erp-muted">
 No products match your filters.
 </div>
 ) : (
 filteredItems.map((row) => (
 <article key={row.id} className="overflow-hidden rounded-[20px] border border-erp-border bg-white p-3 shadow-sm sm:p-4">
 <div className="flex items-start gap-3">
 <img
 src={resolveMenuImage({ image_url: row.image_url, image: row.image, name: row.name, category: row.category })}
 alt={row.name}
 className="h-[64px] w-[64px] shrink-0 rounded-[14px] border border-erp-border bg-gray-100 object-cover"
 />
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <h3 className="truncate text-[15px] font-[700] text-erp-text">{row.name}</h3>
 <p className="mt-1 line-clamp-2 text-[12px] text-erp-muted">{row.description || 'No description'}</p>
 </div>
 <button onClick={() => toggleSelect(row.id)} className="shrink-0 text-erp-primary">
 {selectedIds.has(row.id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-erp-muted" />}
 </button>
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <span className="inline-flex rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">
 {row.category}
 </span>
 <span className="text-[13px] font-[700] text-erp-text">Rs. {row.price}</span>
 {row.large_price && <span className="text-[11px] font-[700] uppercase tracking-[0.06em] text-erp-muted">Large: Rs. {row.large_price}</span>}
 {row.is_bestseller && <Star className="h-4 w-4 fill-erp-warning text-erp-warning" />}
 </div>
 <div className="mt-4 grid grid-cols-1 gap-2">
 <Button variant="outline" size="sm" onClick={() => openDrawer(row)} className="h-auto min-h-[40px] w-full whitespace-normal px-3 py-2 text-center leading-tight">
 Edit
 </Button>
 <button
 type="button"
 onClick={(e) => { void handleAvailabilityToggle(row, e); }}
 className={`min-h-[40px] w-full rounded-[12px] border px-3 py-2 text-center text-[12px] font-[700] leading-tight ${row.is_active ? 'border-erp-success/20 bg-erp-success/10 text-erp-success' : 'border-gray-200 bg-gray-100 text-erp-muted'}`}
 >
 {row.is_active ? 'Available' : 'Hidden'}
 </button>
 </div>
 </div>
 </div>
 </article>
 ))
 )}
 </div>

 {/* Table List */}
 <div className="hidden md:block">
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
 src={resolveMenuImage({ image_url: row.image_url, image: row.image, name: row.name, category: row.category })} 
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
 <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
 <button
  type="button"
  onClick={(e) => { void handleAvailabilityToggle(row, e); }}
  title={row.is_active ? 'Turn off product' : 'Turn on product'}
  aria-label={row.is_active ? `Turn off ${row.name}` : `Turn on ${row.name}`}
  className={`inline-flex items-center justify-center w-[32px] h-[32px] rounded-full transition-colors ${row.is_active ? 'bg-erp-success/10 text-erp-success hover:bg-erp-danger/10 hover:text-erp-danger' : 'bg-gray-100 text-erp-muted hover:bg-erp-success/10 hover:text-erp-success'}`}
 >
  <PowerOff className="w-[16px] h-[16px]" />
 </button>
 </TableCell>
 <TableCell className="text-center">
 {row.is_bestseller ? <Star className="w-[18px] h-[18px] text-erp-warning mx-auto fill-erp-warning" /> : <span className="text-erp-border">—</span>}
 </TableCell>
 <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
 <button onClick={(e) => { e.stopPropagation(); openDrawer(row); }} className="w-[36px] h-[36px] flex items-center justify-center text-erp-blue hover:text-erp-blue bg-white border border-erp-blue/20 hover:bg-erp-blue/5 rounded-full transition-colors mx-auto">
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
