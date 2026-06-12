import { useState, useEffect } from 'react';
import { Star, TrendingUp, AlertTriangle, ThumbsUp, MessageSquare } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';

const AdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [breakdown, setBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page, limit: 10 });
        if (ratingFilter) params.append('rating', ratingFilter);

        const [fbRes, summaryRes] = await Promise.all([
          api.get(`/feedback/my-admin-feedback?${params}`),
          api.get('/feedback/my-summary?days=90')
        ]);
        setFeedbacks(fbRes.data.feedbacks);
        setTotalPages(fbRes.data.totalPages);
        setSummary(summaryRes.data.summary);
        setBreakdown(summaryRes.data.rating_breakdown);
      } catch (err) {
        console.error('Feedback error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page, ratingFilter]);

  if (loading && !summary) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  const totalRatings = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Feedback</h1>
        <p className="text-slate-500 mt-1">Anonymous feedback from students on issues you handled</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 border border-amber-200 bg-amber-50">
          <Star className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs font-medium text-amber-700 uppercase">Average Rating</p>
          <p className="text-3xl font-bold text-amber-900 mt-1">
            {summary?.average_rating || 0}<span className="text-lg text-amber-700">/5</span>
          </p>
        </div>

        <div className="card p-5 border border-indigo-200 bg-indigo-50">
          <MessageSquare className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="text-xs font-medium text-indigo-700 uppercase">Total Feedbacks</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">{summary?.total_feedbacks || 0}</p>
        </div>

        <div className="card p-5 border border-emerald-200 bg-emerald-50">
          <ThumbsUp className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-xs font-medium text-emerald-700 uppercase">High Ratings (4-5)</p>
          <p className="text-3xl font-bold text-emerald-900 mt-1">{summary?.high_ratings || 0}</p>
        </div>

        <div className="card p-5 border border-rose-200 bg-rose-50">
          <AlertTriangle className="w-5 h-5 text-rose-600 mb-2" />
          <p className="text-xs font-medium text-rose-700 uppercase">Low Ratings (1-2)</p>
          <p className="text-3xl font-bold text-rose-900 mt-1">{summary?.low_ratings || 0}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Rating Distribution</h2>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = breakdown[rating] || 0;
            const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="font-medium text-slate-700">{rating}</span>
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      rating >= 4 ? 'bg-emerald-500' : rating === 3 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-16 text-right">{count} ({percent.toFixed(0)}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Filter:</label>
        <select
          value={ratingFilter}
          onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
          className="input max-w-[180px]"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>
      </div>

      {feedbacks.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No feedback yet" message="Feedback will appear here once students rate your handled issues" />
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb._id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{fb.issue_id?.title || 'Issue'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>{fb.issue_id?.primary_category?.replace(/_/g, ' ')}</span>
                    <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Anonymous Student</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={`w-5 h-5 ${s <= fb.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>

              {fb.comment && (
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 italic">"{fb.comment}"</p>
              )}

              <div className="flex items-center gap-3 mt-3">
                {fb.was_actually_resolved ? (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded">Confirmed Resolved</span>
                ) : (
                  <span className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded">Disputed Resolution</span>
                )}
                {fb.flag_for_review && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">Flagged for Review</span>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm">
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;