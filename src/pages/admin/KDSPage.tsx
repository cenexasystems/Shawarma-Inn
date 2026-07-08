import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, ChefHat } from 'lucide-react';
import { OperationsFilterProvider, useOperationsFilter, formatOrderId } from '../../context/OperationsFilterContext';
import { useAdminContext } from '../../context/AdminContext';

function KDSBoard() {
 const { orders, loading, updateOrderStatus, datePreset, setDatePreset } = useOperationsFilter();
 const { kdsSettings } = useAdminContext();
 const audioRef = useRef<HTMLAudioElement | null>(null);

 // Default to today to only see today's tickets
 useEffect(() => {
 if (datePreset !== 'today') {
 setDatePreset('today');
 }
 }, [datePreset, setDatePreset]);

 // Alert logic for new pending orders
 useEffect(() => {
 const pendingOrders = orders.filter((o: any) => o.status === 'pending');
 if (pendingOrders.length > 0 && !kdsSettings.is_muted && kdsSettings.sound_url) {
 if (!audioRef.current) {
 audioRef.current = new Audio(kdsSettings.sound_url);
 } else if (audioRef.current.src !== kdsSettings.sound_url) {
 audioRef.current.src = kdsSettings.sound_url;
 }
 
 audioRef.current.volume = kdsSettings.volume / 100;
 
 const playPromise = audioRef.current.play();
 if (playPromise !== undefined) {
 playPromise.catch(e => console.error("KDS Audio play failed (might need user interaction):", e));
 }

 // Loop if repeat interval is set
 let intervalId: any;
 if (kdsSettings.repeat_interval_sec > 0) {
 intervalId = setInterval(() => {
 if (audioRef.current) {
 const loopPromise = audioRef.current.play();
 if (loopPromise !== undefined) {
 loopPromise.catch(e => console.error("KDS Audio loop failed:", e));
 }
 }
 }, kdsSettings.repeat_interval_sec * 1000);
 }
 return () => {
 if (intervalId) clearInterval(intervalId);
 };
 } else {
 if (audioRef.current) {
 audioRef.current.pause();
 audioRef.current.currentTime = 0;
 }
 }
 }, [orders, kdsSettings]);


 const activeOrders = orders.filter((o: any) => ['pending', 'processing', 'preparing'].includes(o.status)).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

 if (loading && orders.length === 0) {
 return <div className="flex-1 flex items-center justify-center min-h-full bg-[var(--black)] text-white"><div className="animate-spin w-8 h-8 border-2 border-[var(--red)] border-t-transparent rounded-full" /></div>;
 }

 return (
 <div className="min-h-[calc(100vh-76px)] bg-[var(--black)] text-white p-6 font-inter flex flex-col">
 <div className="flex items-center justify-between mb-8 shrink-0">
 <div>
 <h1 className="text-3xl font-bebas tracking-wide text-white flex items-center gap-3">
 <ChefHat className="text-[var(--red)]" size={32} />
 Kitchen Display System
 </h1>
 <p className="text-gray-400 text-sm mt-1">Live order tickets</p>
 </div>
 <div className="flex gap-4">
 <div className="bg-[#141414] border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-[var(--red)] animate-pulse" />
 <span className="text-sm font-bold">{activeOrders.length} Active Tickets</span>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 pb-20">
 <AnimatePresence>
 {activeOrders.map((order: any) => {
 const isPending = order.status === 'pending';
 const timeElapsedMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
 const isDelayed = timeElapsedMinutes > 15;

 return (
 <motion.div
 layout
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.9 }}
 key={order.id}
 className={`flex flex-col bg-[#141414] rounded-2xl border overflow-hidden shadow-xl ${isPending ? 'border-[var(--red)] shadow-[0_0_15px_rgba(229,9,20,0.15)]' : isDelayed ? 'border-orange-500' : 'border-white/10'}`}
 >
 {/* Ticket Header */}
 <div className={`p-4 border-b ${isPending ? 'bg-[var(--red)]/10 border-[var(--red)]/20' : 'bg-white/5 border-white/10'} flex justify-between items-center`}>
 <div className="flex flex-col">
 <span className="font-bebas text-2xl tracking-wide">{formatOrderId(order)}</span>
 <span className="text-xs text-gray-400">{order.customer_name || 'Guest'}</span>
 </div>
 <div className="flex flex-col items-end">
 <span className={`text-sm font-bold flex items-center gap-1 ${isDelayed ? 'text-orange-500 animate-pulse' : 'text-gray-300'}`}>
 <Clock size={14} />
 {timeElapsedMinutes}m ago
 </span>
 <span className="text-[10px] uppercase font-bold tracking-wider mt-1 px-2 py-0.5 rounded bg-white/10">{order.delivery_type?.replace('_', ' ')}</span>
 </div>
 </div>

 {/* Ticket Items */}
 <div className="p-5 flex-1 overflow-y-auto min-h-[220px]">
 <ul className="space-y-4">
 {(order.items || []).map((item: any) => (
 <li key={item.id} className="flex justify-between items-start text-sm">
 <div className="flex gap-4 items-center">
 <span className="font-bebas text-[var(--red)] text-2xl leading-none bg-[var(--red)]/10 px-3 py-1.5 rounded-lg border border-[var(--red)]/20">x{item.quantity}</span>
 <span className="font-bold text-gray-100 text-lg">{item.name}</span>
 </div>
 </li>
 ))}
 </ul>
 {order.notes && (
 <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
 <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider block mb-2">Notes</span>
 <span className="text-sm text-orange-200 font-medium leading-relaxed">{order.notes}</span>
 </div>
 )}
 </div>

 {/* Ticket Actions */}
 <div className="p-4 border-t border-white/10 bg-white/5">
 {isPending ? (
 <button
 onClick={() => updateOrderStatus(order.id, 'processing')}
 className="w-full bg-[var(--red)] hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-sm shadow-lg shadow-red-900/20 active:scale-[0.98]"
 >
 Start Preparing
 </button>
 ) : (
 <button
 onClick={() => updateOrderStatus(order.id, 'ready')}
 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-[0.98]"
 >
 <CheckCircle size={18} /> Mark Ready
 </button>
 )}
 </div>
 </motion.div>
 );
 })}
 </AnimatePresence>
 {activeOrders.length === 0 && !loading && (
 <div className="col-span-full py-24 flex flex-col items-center justify-center text-gray-500 bg-[#141414] rounded-2xl border border-white/10">
 <CheckCircle size={56} className="mb-4 opacity-20" />
 <p className="text-2xl font-bebas tracking-wide text-gray-400">All Caught Up!</p>
 <p className="text-sm mt-2 text-gray-500">No active orders in the kitchen.</p>
 </div>
 )}
 </div>
 </div>
 );
}

export default function KDSPage() {
 return (
 <OperationsFilterProvider>
 <KDSBoard />
 </OperationsFilterProvider>
 );
}
