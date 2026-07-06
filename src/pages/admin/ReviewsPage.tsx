import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';

export default function ReviewsPage() {
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [reviews, setReviews] = useState<any[]>([]);

  const loadData = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id, rating, comment, is_visible, created_at,
          profiles(name, avatar_url),
          menu_items(name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedReviews = (data || []).map((r: any) => ({
        id: r.id,
        rating: r.rating,
        review_text: r.comment,
        is_hidden: !r.is_visible,
        created_at: r.created_at,
        name: r.profiles?.name || 'Anonymous User',
        avatar_url: r.profiles?.avatar_url || null,
        item_name: r.menu_items?.name || null
      }));
      
      setReviews(formattedReviews);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [isAdmin]);

  const handleToggleReviewVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
        
      if (error) throw error;
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle review visibility');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', id);
      if (error) throw error;
      void loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete review');
    }
  };

  return (
    <div className="min-h-screen bg-erp-bg font-inter p-8 max-w-[1680px] mx-auto">
      <PageHeader 
        title="Customer Reviews"
        subtitle="Manage and moderate customer feedback across your menu items."
      />

      {error && <div className="text-erp-danger bg-erp-danger/10 p-4 rounded-[14px] text-sm border border-erp-danger/20 mb-8 font-inter font-medium">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && reviews.length === 0 ? (
           [...Array(3)].map((_, i) => (
             <Card key={i} className="h-48 animate-pulse" />
           ))
        ) : reviews.length === 0 ? (
          <div className="col-span-full p-16 text-center bg-white border border-dashed border-erp-border rounded-erp text-erp-muted font-medium">
            No reviews found.
          </div>
        ) : reviews.map(r => (
          <Card key={r.id} className={`p-6 flex flex-col justify-between transition-all relative overflow-hidden ${r.is_hidden ? 'border-erp-danger/20 bg-gray-50 opacity-60' : 'hover:border-erp-primary'}`}>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 border border-erp-border overflow-hidden flex items-center justify-center font-bebas text-2xl text-erp-primary shadow-sm">
                    {r.avatar_url ? <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" /> : r.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-tight text-erp-text">{r.name}</h4>
                    <p className="text-[10px] text-erp-muted uppercase tracking-[1px] mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className={i < r.rating ? 'text-erp-warning fill-erp-warning drop-shadow-sm' : 'text-gray-200'} />
                  ))}
                </div>
              </div>
              
              {r.item_name && (
                <div className="mb-3 inline-block px-2 py-1 bg-gray-100 border border-erp-border rounded-md text-[9px] font-bold uppercase tracking-[1.5px] text-erp-muted">
                  {r.item_name}
                </div>
              )}
              
              <p className="text-sm text-erp-text italic mb-6 leading-relaxed">"{r.review_text}"</p>
            </div>
            
            <div className="flex justify-end gap-3 border-t border-erp-border pt-4 relative z-10 mt-auto">
               <button onClick={() => handleToggleReviewVisibility(r.id, !r.is_hidden)} className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[1px] flex items-center gap-2 transition-colors ${r.is_hidden ? 'bg-erp-success/10 text-erp-success hover:bg-erp-success/20' : 'bg-erp-warning/10 text-erp-warning hover:bg-erp-warning/20'}`}>
                  {r.is_hidden ? <><Eye size={14} /> Approve Review</> : <><EyeOff size={14} /> Hide Review</>}
                </button>
                <button onClick={() => handleDeleteReview(r.id)} className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[1px] bg-erp-danger/5 text-erp-danger hover:bg-erp-danger/10 flex items-center gap-2 transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
