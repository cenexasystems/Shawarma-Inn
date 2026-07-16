import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CalendarDays, ShoppingCart, TrendingUp, Users, Activity } from 'lucide-react';

export interface ProductAnalysisStats {
  name: string;
  quantity: number;
  revenue: number;
  orders: number;
  hours: Record<number, number>;
  days: Record<number, number>;
  co_buys: Record<string, number>;
  revenue_contribution: number;
  unique_buyers: number;
  avg_basket_with_item: number;
  dates: Record<string, number>;
}

interface ProductIntelligenceModalProps {
  product: ProductAnalysisStats | null;
  onClose: () => void;
}

export const ProductIntelligenceModal: React.FC<ProductIntelligenceModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  // Compute Peak Hour
  const peakHour = Object.entries(product.hours).reduce((max, [hour, count]) => count > max.count ? { hour, count } : max, { hour: '0', count: 0 });
  const hourAmPm = (h: number) => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h > 12 ? `${h - 12} PM` : `${h} AM`;
  };

  // Compute Best Day
  const bestDay = Object.entries(product.days).reduce((max, [day, count]) => count > max.count ? { day, count } : max, { day: '0', count: 0 });
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Compute Top Co-Buys
  const topCoBuys = Object.entries(product.co_buys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Compute Advanced Metrics
  const repeatRate = product.orders > 0 ? ((product.orders - product.unique_buyers) / product.orders) * 100 : 0;
  
  // Quick Sparkline (last 7 active days)
  const sortedDates = Object.entries(product.dates).sort((a, b) => a[0].localeCompare(b[0]));
  const recentDates = sortedDates.slice(-7);
  const maxDayQty = Math.max(...recentDates.map(d => d[1]), 1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-[#0d1b14] p-8 text-white shrink-0">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
            >
              <X size={20} />
            </button>
            <div className="inline-flex items-center gap-2 text-erp-primary bg-erp-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 border border-erp-primary/30">
              <TrendingUp size={12} /> Deep Product Intelligence
            </div>
            <h2 className="text-3xl font-[800] tracking-tight">{product.name}</h2>
            <p className="text-white/60 mt-2 text-sm">Granular performance metrics and behavioral insights.</p>
          </div>

          <div className="p-8 bg-gray-50/50 overflow-y-auto">
            {/* Top Level KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <div className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Qty Sold</div>
                <div className="text-xl font-[800] text-gray-900">{product.quantity}</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Revenue</div>
                <div className="text-xl font-[800] text-erp-success">₹{product.revenue.toLocaleString()}</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Orders</div>
                <div className="text-xl font-[800] text-gray-900">{product.orders}</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">Unique Buyers</div>
                <div className="text-xl font-[800] text-purple-600">{product.unique_buyers}</div>
              </div>
              <div className="bg-white p-4 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-1">% of Total Rev</div>
                <div className="text-xl font-[800] text-blue-600">{(product.revenue_contribution * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Behavioral Insights */}
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm flex flex-col justify-center">
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Users size={16} /> Buyer Behavior
                </h4>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-[600] text-gray-700">Repeat Purchase Rate</span>
                      <span className="text-lg font-[800] text-gray-900">{repeatRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${repeatRate}%` }}></div>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2">Percentage of orders coming from returning customers.</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-[600] text-gray-700">Avg Basket w/ Item</span>
                      <span className="text-lg font-[800] text-gray-900">₹{product.avg_basket_with_item.toFixed(0)}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Average total order value when this product is included.</p>
                  </div>
                </div>
              </div>

              {/* Recent Sales Trend */}
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Activity size={16} /> Recent Sales Volume
                </h4>
                {recentDates.length > 0 ? (
                  <div className="flex items-end justify-between h-[120px] gap-2 pt-4">
                    {recentDates.map(([date, qty]) => (
                      <div key={date} className="flex flex-col items-center flex-1 gap-2 group">
                        <div className="w-full bg-gray-100 rounded-t-sm relative flex items-end justify-center h-full">
                          <div 
                            className="w-full bg-erp-primary/80 group-hover:bg-erp-primary transition-colors rounded-t-sm" 
                            style={{ height: `${(qty / maxDayQty) * 100}%` }}
                          />
                          <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-gray-600">
                            {qty}
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-gray-400 text-sm">No recent daily data available.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Peak Sales Time */}
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-4">
                  <Clock size={20} />
                </div>
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Peak Sales Hour</h4>
                <div className="text-2xl font-[800] text-gray-900">
                  {hourAmPm(parseInt(peakHour.hour))}
                </div>
                <p className="text-[12px] font-bold text-orange-500 mt-2 bg-orange-50 inline-block px-2 py-0.5 rounded-full">{peakHour.count} items sold</p>
              </div>

              {/* Best Day */}
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-4">
                  <CalendarDays size={20} />
                </div>
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Best Day of Week</h4>
                <div className="text-2xl font-[800] text-gray-900">
                  {daysOfWeek[parseInt(bestDay.day)]}
                </div>
                <p className="text-[12px] font-bold text-purple-500 mt-2 bg-purple-50 inline-block px-2 py-0.5 rounded-full">{bestDay.count} items sold</p>
              </div>

              {/* Market Basket */}
              <div className="bg-white p-6 rounded-[16px] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-4">
                  <ShoppingCart size={20} />
                </div>
                <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-3">Often Bought With</h4>
                {topCoBuys.length > 0 ? (
                  <ul className="space-y-3">
                    {topCoBuys.map(([name, count]) => (
                      <li key={name} className="flex items-center justify-between">
                        <span className="text-sm font-[600] text-gray-700 truncate pr-2">{name}</span>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{count}x</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">Not enough correlations.</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
