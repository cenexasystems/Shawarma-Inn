import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ReviewsPage() {
  const { token } = useAuth();
  const tokenRequired = token || '';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [reviews, setReviews] = useState<any[]>([]);

  const loadData = async () => {
    if (!tokenRequired) return;
    setLoading(true);
    setError('');
    try {
      const revRes = await apiRequest<any>('/admin/reviews', { token: tokenRequired });
      setReviews(revRes.reviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [tokenRequired]);

  const handleToggleReviewVisibility = async (id: number) => {
    try {
      await apiRequest(`/admin/reviews/${id}/hide`, { method: 'PATCH', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle review visibility');
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await apiRequest(`/admin/reviews/${id}`, { method: 'DELETE', token: tokenRequired });
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className="font-bebas text-5xl tracking-[3px] uppercase">Customer Reviews</h2>
      </header>

      {error && <div className="text-red-400 bg-red-400/10 p-4 rounded-xl text-sm border border-red-400/20">{error}</div>}
      {loading && <div className="text-xs text-white/30 animate-pulse">Loading reviews…</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map(r => (
          <div key={r.id} className={`bg-[#181818] border p-6 rounded-2xl transition-all ${!r.is_hidden ? 'border-white/10' : 'border-white/5 opacity-50 grayscale'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center font-bebas text-xl text-[#ef8f2f]">
                  {r.avatar_url ? <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" /> : r.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-sm leading-tight">{r.name}</h4>
                  <p className="text-[10px] text-white/40">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                ))}
              </div>
            </div>
            <p className="text-sm text-white/70 italic mb-6">"{r.review_text}"</p>
            
            <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
               <button onClick={() => handleToggleReviewVisibility(r.id)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${r.is_hidden ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}`}>
                  {r.is_hidden ? <><Eye size={14} /> Approve</> : <><EyeOff size={14} /> Hide</>}
                </button>
                <button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
