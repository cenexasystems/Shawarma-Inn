import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../lib/api';

interface AdminMenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  is_active: number;
}

interface DailyReport {
  totalOrdersToday: number;
  totalRevenueToday: number;
  topSellingItem: { name: string; quantity: number } | null;
}

const emptyForm = {
  name: '',
  price: '',
  category: '',
  is_active: true,
};

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();

  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<DailyReport | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const tokenRequired = token || '';

  const loadData = async () => {
    if (!tokenRequired) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [menuResponse, reportResponse] = await Promise.all([
        apiRequest<{ items: AdminMenuItem[] }>('/admin/menu-items', { token: tokenRequired }),
        apiRequest<{ report: DailyReport }>('/admin/reports/daily', { token: tokenRequired }),
      ]);
      setItems(menuResponse.items || []);
      setReport(reportResponse.report || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeCount = useMemo(() => items.filter((item) => Boolean(item.is_active)).length, [items]);

  const submitForm = async () => {
    if (!form.name.trim()) {
      setError('Menu item name is required.');
      return;
    }

    const numericPrice = Number(form.price);
    if (!Number.isFinite(numericPrice)) {
      setError('Price must be a valid number.');
      return;
    }

    if (!form.category.trim()) {
      setError('Category is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: form.name.trim(),
        price: numericPrice,
        category: form.category.trim(),
        is_active: form.is_active,
      };

      if (editingId) {
        await apiRequest(`/admin/menu-items/${editingId}`, {
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

      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: AdminMenuItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      is_active: Boolean(item.is_active),
    });
  };

  const deleteItem = async (item: AdminMenuItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) {
      return;
    }

    try {
      await apiRequest(`/admin/menu-items/${item.id}`, {
        method: 'DELETE',
        token: tokenRequired,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-[#101010] text-[#f7f7f7] px-4 py-8 md:px-8 md:py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-bebas text-6xl tracking-[4px] uppercase">Admin Dashboard</h1>
            <p className="text-sm text-white/60">Manage menu, billing, and daily reports.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/pos" className="bg-[#ef8f2f] text-[#101010] px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm">
              Open POS Screen
            </Link>
            <Link to="/analytics" className="bg-white/10 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-white/20 transition-all">
              📊 Analytics
            </Link>
            <button onClick={logout} className="border border-white/20 px-6 py-3 rounded-full text-sm uppercase tracking-wider">
              Logout
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[2px] text-white/50">Menu Items</p>
            <p className="font-bebas text-5xl mt-2">{items.length}</p>
          </div>
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[2px] text-white/50">Active Items</p>
            <p className="font-bebas text-5xl mt-2">{activeCount}</p>
          </div>
          <div className="bg-[#181818] border border-white/10 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[2px] text-white/50">Revenue Today</p>
            <p className="font-bebas text-5xl mt-2">₹{report?.totalRevenueToday.toFixed(0) || '0'}</p>
          </div>
        </section>

        <section className="bg-[#181818] border border-white/10 rounded-2xl p-6">
          <h2 className="font-bebas text-4xl tracking-[3px] uppercase mb-4">Daily Report</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
              <p className="text-white/60">Orders Today</p>
              <p className="font-bebas text-3xl mt-2">{report?.totalOrdersToday || 0}</p>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
              <p className="text-white/60">Top Selling Item</p>
              <p className="font-bebas text-3xl mt-2">{report?.topSellingItem?.name || 'N/A'}</p>
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-4">
              <p className="text-white/60">Top Item Qty</p>
              <p className="font-bebas text-3xl mt-2">{report?.topSellingItem?.quantity || 0}</p>
            </div>
          </div>
        </section>

        <section className="bg-[#181818] border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-bebas text-4xl tracking-[3px] uppercase">Menu Management</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Name"
              className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"
            />
            <input
              type="number"
              value={form.price}
              onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              placeholder="Price"
              className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"
            />
            <input
              type="text"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Category"
              className="bg-black/30 border border-white/10 rounded-xl p-3 text-sm"
            />
            <label className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-xl p-3 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Active
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={submitForm}
              disabled={saving}
              className="bg-[#ef8f2f] text-[#101010] px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Item' : 'Create Item'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="border border-white/20 px-6 py-3 rounded-full text-sm uppercase tracking-wider"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-black/40 text-left uppercase tracking-[2px] text-[11px] text-white/60">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td className="p-4" colSpan={5}>Loading menu items...</td>
                  </tr>
                )}
                {!loading && items.map((item) => (
                  <tr key={item.id} className="border-t border-white/10">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">₹{Number(item.price).toFixed(0)}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="px-3 py-1 rounded-lg bg-white/10 text-white/90"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void deleteItem(item)}
                        className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
