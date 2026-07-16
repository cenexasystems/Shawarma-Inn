import { useEffect, useState } from 'react';
import { Search, Plus, FolderTree, Edit3, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

interface Category {
 id: string;
 name: string;
 display_order: number;
 is_active: boolean;
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

 return (
 <div className="min-h-screen bg-erp-bg px-4 py-5 sm:px-6 sm:py-6 lg:p-[32px]">
 <PageHeader 
 title="Menu Categories"
 subtitle="Manage only the category details needed for menu organization."
 action={
 <div className="flex w-full gap-2 sm:w-auto">
 <Button 
 icon={Plus}
 onClick={() => openModal()}
 className="w-full sm:w-auto"
 >
 Add Category
 </Button>
 </div>
 }
 />

 {/* Toolbar */}
 <Card className="mb-6 p-4 sm:mb-8">
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

 <div className="bg-erp-card rounded-[24px] shadow-erp border border-erp-border overflow-hidden">
 <div className="grid gap-3 p-4 md:hidden">
 {loading ? (
 [...Array(4)].map((_, i) => (
 <div key={i} className="h-[116px] animate-pulse rounded-[20px] border border-erp-border bg-gray-50/50" />
 ))
 ) : filteredCategories.length === 0 ? (
 <div className="rounded-[20px] border border-dashed border-erp-border bg-white p-6 text-center text-erp-muted">
 No categories found.
 </div>
 ) : (
 filteredCategories.map((cat) => (
 <article key={cat.id} className="rounded-[20px] border border-erp-border bg-white p-4 shadow-sm">
 <div className="flex items-start gap-3">
 <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] border border-erp-border bg-[#F8FAFC] text-erp-primary">
 <FolderTree size={18} />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <h3 className="truncate text-[15px] font-[700] text-erp-text">{cat.name}</h3>
 <p className="mt-1 text-[12px] text-erp-muted">Display order: {cat.display_order}</p>
 </div>
 <span className={`inline-flex min-h-[28px] items-center rounded-full border px-[10px] text-[10px] font-[700] uppercase tracking-[0.08em] ${cat.is_active ? 'border-erp-success/20 bg-erp-success/8 text-erp-success' : 'border-gray-200 bg-gray-100 text-erp-muted'}`}>
 {cat.is_active ? 'Active' : 'Hidden'}
 </span>
 </div>
 <div className="mt-4 flex gap-2">
 <button onClick={() => openModal(cat)} className="flex flex-1 items-center justify-center rounded-[12px] border border-erp-blue/20 bg-white px-3 py-2 text-[12px] font-[700] text-erp-blue transition-colors hover:bg-erp-blue/5">
 Edit
 </button>
 <button onClick={() => handleDelete(cat.id, cat.name)} className="flex flex-1 items-center justify-center rounded-[12px] border border-erp-danger/20 bg-white px-3 py-2 text-[12px] font-[700] text-erp-danger transition-colors hover:bg-erp-danger/5">
 Delete
 </button>
 </div>
 </div>
 </div>
 </article>
 ))
 )}
 </div>
 <div className="hidden md:block">
 <Table>
 <TableHeader>
 <TableRow>
 <TableHead>Category</TableHead>
 <TableHead>Display Order</TableHead>
 <TableHead>Status</TableHead>
 <TableHead className="text-center">Actions</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {loading ? (
 [...Array(5)].map((_, i) => (
 <TableRow key={i}>
 <TableCell colSpan={4} className="h-[68px] animate-pulse bg-gray-50/50" />
 </TableRow>
 ))
 ) : filteredCategories.length === 0 ? (
 <TableRow>
 <TableCell colSpan={4} className="py-[56px] text-center">
 <div className="flex flex-col items-center justify-center text-center">
 <FolderTree size={32} className="text-gray-300 mb-3" />
 <p className="text-[15px] font-[500] text-erp-muted">No categories found.</p>
 </div>
 </TableCell>
 </TableRow>
 ) : (
 filteredCategories.map((cat) => (
 <TableRow key={cat.id}>
 <TableCell>
 <div className="flex items-center gap-[12px]">
 <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[12px] border border-erp-border bg-[#F8FAFC] text-erp-primary">
 <FolderTree size={16} />
 </div>
 <span className="text-[15px] font-[700] text-erp-text">{cat.name}</span>
 </div>
 </TableCell>
 <TableCell className="font-[700] text-erp-text">{cat.display_order}</TableCell>
 <TableCell>
 <span className={`inline-flex h-[32px] items-center rounded-full border px-[12px] text-[12px] font-[700] uppercase tracking-[0.08em] ${cat.is_active ? 'border-erp-success/20 bg-erp-success/8 text-erp-success' : 'border-gray-200 bg-gray-100 text-erp-muted'}`}>
 {cat.is_active ? 'Active' : 'Hidden'}
 </span>
 </TableCell>
 <TableCell className="text-center">
 <div className="flex items-center justify-center gap-[8px]">
 <button onClick={() => openModal(cat)} className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-erp-blue/20 bg-white text-erp-blue transition-colors hover:bg-erp-blue/5">
 <Edit3 size={15} />
 </button>
 <button onClick={() => handleDelete(cat.id, cat.name)} className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-erp-danger/20 bg-white text-erp-danger transition-colors hover:bg-erp-danger/5">
 <Trash2 size={15} />
 </button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </div>

 {/* Modal */}
 {isModalOpen && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
 <div className="relative mx-4 w-full max-w-md rounded-[24px] border border-erp-border bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8">
 <h3 className="font-[700] text-[22px] tracking-[-0.02em] text-erp-text mb-6">
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

 <div className="mt-6 flex flex-col gap-3 border-t border-erp-border pt-6 sm:flex-row">
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
