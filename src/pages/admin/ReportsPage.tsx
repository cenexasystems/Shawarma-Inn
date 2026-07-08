import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Download, IndianRupee, PackageCheck, ShoppingBag, TrendingUp } from 'lucide-react';
import {
 Bar,
 BarChart,
 CartesianGrid,
 ResponsiveContainer,
 Tooltip as RechartsTooltip,
 XAxis,
 YAxis,
} from 'recharts';
import { supabase } from '../../lib/supabaseClient';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { KPICard } from '../../components/ui/KPICard';
import { Card } from '../../components/ui/Card';

type ReportPreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PERIODS: Array<{ value: ReportPreset; label: string }> = [
 { value: 'all', label: 'All' },
 { value: 'today', label: 'Today' },
 { value: 'week', label: 'This Week' },
 { value: 'month', label: 'This Month' },
 { value: 'year', label: 'This Year' },
 { value: 'custom', label: 'Custom' },
];

function money(value: unknown): string {
 return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function startOfDay(date: Date) {
 const copy = new Date(date);
 copy.setHours(0, 0, 0, 0);
 return copy;
}

function endOfDay(date: Date) {
 const copy = new Date(date);
 copy.setHours(23, 59, 59, 999);
 return copy;
}

function getISOWeek(date: Date): number {
 const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
 const day = d.getUTCDay() || 7;
 d.setUTCDate(d.getUTCDate() + 4 - day);
 const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
 return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getISOWeekYear(date: Date): number {
 const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
 const day = d.getUTCDay() || 7;
 d.setUTCDate(d.getUTCDate() + 4 - day);
 return d.getUTCFullYear();
}

function getStartOfISOWeek(date: Date): Date {
 const copy = new Date(date);
 const day = copy.getDay();
 const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
 copy.setDate(diff);
 copy.setHours(0, 0, 0, 0);
 return copy;
}

function getPresetRange(preset: ReportPreset, customRange: { from: string; to: string }) {
 if (preset === 'all') return null;
 if (preset === 'custom') {
 if (!customRange.from || !customRange.to) return null;
 return {
 from: startOfDay(new Date(customRange.from)).toISOString(),
 to: endOfDay(new Date(customRange.to)).toISOString(),
 };
 }

 const now = new Date();
 if (preset === 'today') {
 return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
 }

 if (preset === 'week') {
 const from = startOfDay(now);
 const day = from.getDay();
 from.setDate(from.getDate() - day + (day === 0 ? -6 : 1));
 return { from: from.toISOString(), to: endOfDay(now).toISOString() };
 }

 if (preset === 'month') {
 return { from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)).toISOString(), to: endOfDay(now).toISOString() };
 }

 return { from: startOfDay(new Date(now.getFullYear(), 0, 1)).toISOString(), to: endOfDay(now).toISOString() };
}

function ChartShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
 return (
 <Card className="p-[24px] flex flex-col min-h-[360px]">
 <div className="mb-[20px]">
 <h3 className="text-[13px] uppercase tracking-[0.12em] text-erp-muted font-[700]">{title}</h3>
 <p className="mt-[8px] text-[14px] text-erp-muted">{subtitle}</p>
 </div>
 <div className="min-h-[270px] flex-1">{children}</div>
 </Card>
 );
}

export default function ReportsPage() {
 const [period, setPeriod] = useState<ReportPreset>('year');
 const [customRange, setCustomRange] = useState({ from: '', to: '' });
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 const [orders, setOrders] = useState<any[]>([]);

 const selectedRange = useMemo(() => getPresetRange(period, customRange), [period, customRange]);
 const currentYear = selectedRange?.from ? new Date(selectedRange.from).getFullYear() : new Date().getFullYear();

 const loadData = async () => {
 setLoading(true);
 setError('');

 try {
 let query = supabase
 .from('orders')
 .select('*, order_items(id, name, price, quantity)')
 .order('created_at', { ascending: true });

 if (selectedRange?.from) query = query.gte('created_at', selectedRange.from);
 if (selectedRange?.to) query = query.lte('created_at', selectedRange.to);

 const { data, error: fetchError } = await query;
 if (fetchError) throw fetchError;
 setOrders(data || []);
 } catch (err) {
 console.error(err);
 setError('Failed to fetch analytics data');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 void loadData();
 }, [selectedRange?.from, selectedRange?.to, period]);

 const analytics = useMemo(() => {
 const completed = orders.filter(o => o.status === 'completed');
 const revenue = completed.reduce((sum, o) => sum + Number(o.total || 0), 0);
 const avgOrder = completed.length > 0 ? revenue / completed.length : 0;

 const monthlyData = MONTHS.map((month) => ({ month, revenue: 0, orders: 0, items: 0 }));
 const weeklyMap = new Map<number, { revenue: number; orders: number; items: number }>();
 const productMap = new Map<string, { quantity: number; revenue: number; orders: number }>();
 const completedDates = completed
 .map((order) => new Date(order.created_at))
 .filter((date) => !Number.isNaN(date.getTime()));

 completed.forEach(order => {
 const created = new Date(order.created_at);
 const monthIndex = created.getMonth();
 const orderItems = order.order_items || [];
 const itemCount = orderItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);

 monthlyData[monthIndex].revenue += Number(order.total || 0);
 monthlyData[monthIndex].orders += 1;
 monthlyData[monthIndex].items += itemCount;

 const week = getISOWeek(created);
 const existingWeek = weeklyMap.get(week) || { revenue: 0, orders: 0, items: 0 };
 weeklyMap.set(week, {
 revenue: existingWeek.revenue + Number(order.total || 0),
 orders: existingWeek.orders + 1,
 items: existingWeek.items + itemCount,
 });

 orderItems.forEach((item: any) => {
 const existing = productMap.get(item.name) || { quantity: 0, revenue: 0, orders: 0 };
 productMap.set(item.name, {
 quantity: existing.quantity + Number(item.quantity || 0),
 revenue: existing.revenue + Number(item.price || 0) * Number(item.quantity || 0),
 orders: existing.orders + 1,
 });
 });
 });

 const currentWeek = getISOWeek(new Date());
 const weeklyData = Array.from({ length: 53 }, (_, idx) => {
 const week = idx + 1;
 const value = weeklyMap.get(week) || { revenue: 0, orders: 0, items: 0 };
 return { week, label: `Week ${week}`, ...value };
 }).filter(row => row.revenue > 0 || (row.week >= Math.max(1, currentWeek - 4) && row.week <= currentWeek + 4));

 const productSales = Array.from(productMap.entries())
 .map(([name, stats]) => ({ name, ...stats }))
 .sort((a, b) => b.quantity - a.quantity);

 const totalItemsSold = productSales.reduce((sum, item) => sum + item.quantity, 0);
 const activeWeekDate =
 period === 'week'
 ? new Date()
 : completedDates.length > 0
 ? completedDates.reduce((latest, date) => (date > latest ? date : latest), completedDates[0])
 : new Date();
 const activeWeek = getISOWeek(activeWeekDate);
 const activeWeekYear = getISOWeekYear(activeWeekDate);
 const weekStart = getStartOfISOWeek(activeWeekDate);
 const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
 const dailyWeekData = dayLabels.map((label, index) => {
 const day = new Date(weekStart);
 day.setDate(weekStart.getDate() + index);

 return {
 label,
 fullLabel: day.toLocaleDateString('en-US', { weekday: 'long' }),
 revenue: 0,
 orders: 0,
 items: 0,
 };
 });

 completed.forEach((order) => {
 const created = new Date(order.created_at);
 if (getISOWeek(created) !== activeWeek || getISOWeekYear(created) !== activeWeekYear) return;

 const dayIndex = (created.getDay() + 6) % 7;
 const orderItems = order.order_items || [];
 const itemCount = orderItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);

 dailyWeekData[dayIndex].revenue += Number(order.total || 0);
 dailyWeekData[dayIndex].orders += 1;
 dailyWeekData[dayIndex].items += itemCount;
 });

 return {
 completed,
 revenue,
 avgOrder,
 totalItemsSold,
 monthlyData,
 weeklyData,
 activeWeek,
 activeWeekYear,
 dailyWeekData,
 productSales,
 topProduct: productSales[0]?.name || 'No completed sales',
 };
 }, [orders, period]);

 const handleExport = () => {
 const csvContent = 'data:text/csv;charset=utf-8,'
 + 'Order ID,Date,Customer,Total,Status\n'
 + orders.map(o => `${o.id},${new Date(o.created_at).toISOString()},"${o.customer_name || 'Guest'}",${o.total},${o.status}`).join('\n');

 const encodedUri = encodeURI(csvContent);
 const link = document.createElement('a');
 link.setAttribute('href', encodedUri);
 link.setAttribute('download', `shawarma_inn_completed_order_report_${period}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 };

 const tooltipStyle = {
 backgroundColor: '#fff',
 border: '1px solid #EEF2F6',
 borderRadius: '16px',
 boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
 color: '#111827',
 };

 return (
 <div className="min-h-screen bg-erp-bg p-[32px] ">
 <PageHeader
 title="Business Analytics"
 subtitle="Completed-order revenue, product sales, and date-wise demand."
 action={
 <Button onClick={handleExport} variant="outline" icon={Download}>
 Export CSV
 </Button>
 }
 />

 <div className="mb-[24px] rounded-[22px] border border-erp-border bg-white p-[12px] shadow-erp">
 <div className="flex flex-wrap items-center gap-[8px]">
 <span className="px-[8px] text-[12px] font-[700] uppercase tracking-[0.12em] text-erp-muted">Period</span>
 {PERIODS.map(item => (
 <button
 key={item.value}
 onClick={() => setPeriod(item.value)}
 className={`h-[42px] rounded-full border px-[18px] text-[13px] font-[700] transition-colors ${
 period === item.value
 ? 'border-erp-primary bg-erp-primary text-white'
 : 'border-erp-border bg-white text-erp-text hover:bg-[#FAFBFC]'
 }`}
 >
 {item.label}
 </button>
 ))}

 {period === 'custom' && (
 <div className="flex flex-wrap items-center gap-[8px] pl-[4px]">
 <input
 type="date"
 value={customRange.from}
 onChange={(event) => setCustomRange((prev) => ({ ...prev, from: event.target.value }))}
 className="h-[42px] rounded-full border border-erp-border bg-white px-[14px] text-[13px] font-[600] text-erp-text outline-none focus:border-erp-primary"
 />
 <span className="text-[13px] text-erp-muted">to</span>
 <input
 type="date"
 value={customRange.to}
 onChange={(event) => setCustomRange((prev) => ({ ...prev, to: event.target.value }))}
 className="h-[42px] rounded-full border border-erp-border bg-white px-[14px] text-[13px] font-[600] text-erp-text outline-none focus:border-erp-primary"
 />
 </div>
 )}
 </div>
 </div>

 {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[16px] text-sm border border-erp-danger/20 mb-8 font-medium">{error}</div>}

 <div className="flex flex-wrap gap-erp-24 mb-erp-32">
 <KPICard title="Completed Revenue" value={money(analytics.revenue)} icon={IndianRupee} iconBgColor="bg-erp-success/10" iconColor="text-erp-success" subtitle="Completed orders only" />
 <KPICard title="Completed Orders" value={analytics.completed.length.toLocaleString()} icon={ShoppingBag} iconBgColor="bg-erp-primary/10" iconColor="text-erp-primary" subtitle="Revenue source" />
 <KPICard title="Products Sold" value={analytics.totalItemsSold.toLocaleString()} icon={PackageCheck} iconBgColor="bg-erp-blue/10" iconColor="text-erp-blue" subtitle="From completed orders" />
 <KPICard title="Avg Order Value" value={money(Math.round(analytics.avgOrder))} icon={TrendingUp} iconBgColor="bg-erp-warning/10" iconColor="text-erp-warning" subtitle="Per completed order" />
 </div>

 {loading ? (
 <Card className="h-96 flex items-center justify-center">
 <div className="w-8 h-8 border-2 border-erp-primary border-t-transparent rounded-full animate-spin" />
 </Card>
 ) : (
 <div className="space-y-[24px]">
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px]">
 <ChartShell title={`Revenue Trend This Year ${currentYear}`} subtitle="Monthly revenue from completed orders.">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={analytics.monthlyData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="monthlyRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#173F2E" stopOpacity={1} />
 <stop offset="100%" stopColor="#22C55E" stopOpacity={0.72} />
 </linearGradient>
 </defs>
 <CartesianGrid stroke="#EEF2F6" vertical={false} />
 <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickMargin={12} axisLine={false} tickLine={false} />
 <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${Number(v) / 1000}k`} axisLine={false} tickLine={false} />
 <RechartsTooltip formatter={(value, name) => [name === 'revenue' ? money(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(23,63,46,0.05)' }} />
 <Bar dataKey="revenue" fill="url(#monthlyRevenue)" radius={[14, 14, 4, 4]} maxBarSize={44} />
 </BarChart>
 </ResponsiveContainer>
 </ChartShell>

 <ChartShell
 title={`Revenue This Week (Week ${analytics.activeWeek} of ${analytics.activeWeekYear})`}
 subtitle="Monday to Sunday revenue for the exact ISO week in focus."
 >
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={analytics.dailyWeekData} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
 <defs>
 <linearGradient id="weeklyRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#2563EB" stopOpacity={1} />
 <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.76} />
 </linearGradient>
 </defs>
 <CartesianGrid stroke="#EEF2F6" vertical={false} />
 <XAxis dataKey="label" stroke="#64748B" fontSize={12} tickMargin={12} axisLine={false} tickLine={false} />
 <YAxis stroke="#64748B" fontSize={12} tickFormatter={(v) => `₹${Number(v) / 1000}k`} axisLine={false} tickLine={false} />
 <RechartsTooltip
 formatter={(value, name) => [name === 'revenue' ? money(value) : value, name === 'revenue' ? 'Revenue' : 'Orders']}
 labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || ''}
 contentStyle={tooltipStyle}
 cursor={{ fill: 'rgba(37,99,235,0.06)' }}
 />
 <Bar dataKey="revenue" fill="url(#weeklyRevenue)" radius={[14, 14, 4, 4]} maxBarSize={40} />
 </BarChart>
 </ResponsiveContainer>
 </ChartShell>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_.65fr] gap-[24px]">
 <Card className="p-[24px]">
 <div className="mb-[20px] flex items-center justify-between gap-[16px]">
 <div>
 <h3 className="text-[13px] uppercase tracking-[0.12em] text-erp-muted font-[700]">Products Sold From Completed Orders</h3>
 <p className="mt-[8px] text-[14px] text-erp-muted">This is the product ledger that updates when orders are marked completed.</p>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[720px] text-left">
 <thead>
 <tr className="bg-[#F4FAF4]">
 <th className="h-[48px] rounded-l-[16px] px-[16px] text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-muted">Product</th>
 <th className="h-[48px] px-[16px] text-right text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-muted">Qty Sold</th>
 <th className="h-[48px] px-[16px] text-right text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-muted">Revenue</th>
 <th className="h-[48px] rounded-r-[16px] px-[16px] text-right text-[13px] font-[700] uppercase tracking-[0.08em] text-erp-muted">Orders</th>
 </tr>
 </thead>
 <tbody>
 {analytics.productSales.length === 0 ? (
 <tr>
 <td colSpan={4} className="py-[48px] text-center text-[15px] font-[500] text-erp-muted">No completed product sales for this period.</td>
 </tr>
 ) : analytics.productSales.slice(0, 12).map((item) => (
 <tr key={item.name} className="border-b border-erp-border last:border-b-0">
 <td className="px-[16px] py-[16px] text-[15px] font-[700] text-erp-text">{item.name}</td>
 <td className="px-[16px] py-[16px] text-right text-[15px] font-[700] text-erp-text">{item.quantity}</td>
 <td className="px-[16px] py-[16px] text-right text-[15px] font-[700] text-erp-success">{money(item.revenue)}</td>
 <td className="px-[16px] py-[16px] text-right text-[15px] font-[600] text-erp-muted">{item.orders}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </Card>

 <Card className="p-[24px]">
 <h3 className="text-[13px] uppercase tracking-[0.12em] text-erp-muted font-[700] mb-[20px]">Top Items By Revenue</h3>
 <div className="space-y-[16px]">
 {analytics.productSales.slice(0, 6).map((item, index) => {
 const maxRevenue = Math.max(...analytics.productSales.map(product => product.revenue), 1);
 return (
 <div key={item.name}>
 <div className="mb-[8px] flex items-center justify-between gap-[12px]">
 <span className="min-w-0 truncate text-[14px] font-[700] text-erp-text">{index + 1}. {item.name}</span>
 <span className="shrink-0 text-[13px] font-[700] text-erp-text">{money(item.revenue)}</span>
 </div>
 <div className="h-[8px] overflow-hidden rounded-full bg-erp-border">
 <div className="h-full rounded-full bg-erp-primary" style={{ width: `${Math.max(6, (item.revenue / maxRevenue) * 100)}%` }} />
 </div>
 <p className="mt-[6px] text-[12px] font-[600] text-erp-muted">{item.quantity} sold</p>
 </div>
 );
 })}
 {analytics.productSales.length === 0 && (
 <p className="py-[48px] text-center text-[15px] font-[500] text-erp-muted">No product sales yet.</p>
 )}
 </div>
 </Card>
 </div>
 </div>
 )}
 </div>
 );
}
