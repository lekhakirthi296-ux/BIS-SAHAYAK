import React, { useState, useEffect } from 'react';
import {
  Lock,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Search,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Key,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface AdminStats {
  totalQueries: number;
  positiveFeedback: number;
  negativeFeedback: number;
  totalFeedback: number;
  thumbsDownRate: number;
  standardsSearched: number;
  licensesVerified: number;
  activeSessionsCount: number;
  recentFeedback: Array<{
    id: string;
    messageId: string;
    rating: 'up' | 'down';
    comment?: string;
    queryText?: string;
    timestamp: string;
  }>;
  topUnanswered: Array<{
    id: string;
    query: string;
    language: string;
    audience: string;
    timestamp: string;
    count: number;
  }>;
}

export const AdminPage: React.FC = () => {
  const { showToast } = useApp();

  const [adminKey, setAdminKey] = useState(() => {
    return localStorage.getItem('bis_admin_key') || 'bis-admin-secret-key';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchStats = async (keyToUse?: string) => {
    const key = keyToUse || adminKey;
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'x-admin-key': key,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid Admin Passkey. Please verify your credentials.');
        }
        throw new Error('Failed to load telemetry stats.');
      }

      const data = await res.json();
      setStats(data);
      setIsAuthenticated(true);
      localStorage.setItem('bis_admin_key', key);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication error');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchStats(adminKey);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(adminKey);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            BIS Sahayak Admin Console
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics on consultation inquiries, low-rated responses, and unanswered standards questions.
          </p>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            onClick={() => fetchStats()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        )}
      </div>

      {/* Authentication Prompt */}
      {!isAuthenticated ? (
        <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Admin Authorization Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the admin passkey from your environment configuration (ADMIN_KEY).
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter ADMIN_KEY..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-600 focus:outline-none"
                required
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-600 font-medium text-center">{authError}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Admin Dashboard'}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Default development key: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-purple-600">bis-admin-secret-key</code>
            </p>
          </form>
        </div>
      ) : (
        stats && (
          <div className="space-y-8 animate-in fade-in">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Total Inquiries
                </span>
                <p className="text-2xl font-extrabold text-blue-900 dark:text-blue-300 mt-1">
                  {stats.totalQueries}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Positive Ratings
                </span>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {stats.positiveFeedback}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Negative Ratings
                </span>
                <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {stats.negativeFeedback}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Thumbs Down Rate
                </span>
                <p className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-1">
                  {stats.thumbsDownRate}%
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Standards Searched
                </span>
                <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {stats.standardsSearched}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Licenses Verified
                </span>
                <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                  {stats.licensesVerified}
                </p>
              </div>
            </div>

            {/* Top Unanswered Inquiries (Knowledge Base Gaps) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Top Unanswered Queries (Knowledge Base Expansion Targets)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {stats.topUnanswered.length} items logged
                </span>
              </div>

              {stats.topUnanswered.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No unanswered queries recorded yet. All user queries have matched relevant BIS knowledge chunks.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px]">
                        <th className="pb-2">User Query</th>
                        <th className="pb-2">Count</th>
                        <th className="pb-2">Audience</th>
                        <th className="pb-2">Lang</th>
                        <th className="pb-2">Last Asked</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {stats.topUnanswered.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 max-w-sm truncate">
                            {u.query}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px]">
                              {u.count}x
                            </span>
                          </td>
                          <td className="py-2.5 capitalize text-slate-600 dark:text-slate-400">{u.audience}</td>
                          <td className="py-2.5 uppercase font-mono text-slate-500">{u.language}</td>
                          <td className="py-2.5 text-slate-400 text-[11px]">
                            {new Date(u.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent User Feedback & Comments */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Recent User Feedback & Reviews
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  {stats.recentFeedback.length} entries
                </span>
              </div>

              {stats.recentFeedback.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No explicit user reviews received yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {stats.recentFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 text-xs"
                    >
                      <div className="mt-0.5">
                        {fb.rating === 'up' ? (
                          <div className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded-full bg-rose-100 text-rose-700">
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {fb.rating === 'up' ? 'Helpful Response' : 'Improvement Requested'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(fb.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {fb.queryText && (
                          <p className="text-[11px] text-slate-500 italic">
                            Query: "{fb.queryText}"
                          </p>
                        )}

                        {fb.comment && (
                          <p className="text-slate-700 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                            "{fb.comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};
