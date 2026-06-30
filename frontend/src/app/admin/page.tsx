'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { adminApi } from '@/lib/api';
import { ShieldAlert, Plus, BookOpen, Clock, CheckCircle2, XCircle, Users, BarChart3, RefreshCw, Send, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Ingestion Form State
  const [sourceUrl, setSourceUrl] = useState('');
  const [category, setCategory] = useState('pregnancy');
  const [notes, setNotes] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Verification Router protection
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        toast.error('Forbidden: Admins only');
        router.push('/dashboard');
      }
    }
  }, [user, isAdmin, isLoading, router]);

  const loadDashboardData = async () => {
    if (!isAdmin) return;
    setStatsLoading(true);
    setPendingLoading(true);
    try {
      const statsRes = await adminApi.getStats();
      setStats(statsRes.data);
      
      const pendingRes = await adminApi.getPending();
      setPending(pendingRes.data.articles || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dashboard statistics');
    } finally {
      setStatsLoading(false);
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceUrl.trim()) return;

    setIngesting(true);
    try {
      const res = await adminApi.ingest({
        source_url: sourceUrl,
        category,
        notes,
      });
      toast.success('Source processed and queued for review successfully!');
      setSourceUrl('');
      setNotes('');
      loadDashboardData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to ingest URL. Make sure it is an approved domain.');
    } finally {
      setIngesting(false);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewArticle(id, action);
      toast.success(`Article ${action === 'approve' ? 'Approved & Published' : 'Rejected'}!`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      toast.error('Review submission failed');
    }
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-dark-900 pb-12 mesh-bg">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        
        {/* Header and stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-dark-700 pb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-400" />
              <span>Admin Approvals & Ingestion Portal</span>
            </h1>
            <p className="text-sm text-white/60">
              Crawl verified medical sources (WHO, NHS, ICMR) using AI Agents. Validate before publishing.
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={statsLoading}
            className="btn-secondary py-2 px-4 text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-glass border-dark-700 p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-white/40 font-semibold block uppercase">Pending Review</span>
              <span className="text-2xl font-bold text-white">{stats?.pending_review ?? 0}</span>
            </div>
          </div>

          <div className="card-glass border-dark-700 p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-white/40 font-semibold block uppercase">Published Articles</span>
              <span className="text-2xl font-bold text-white">{stats?.published ?? 0}</span>
            </div>
          </div>

          <div className="card-glass border-dark-700 p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-white/40 font-semibold block uppercase">Rejected Articles</span>
              <span className="text-2xl font-bold text-white">{stats?.rejected ?? 0}</span>
            </div>
          </div>

          <div className="card-glass border-dark-700 p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-brand-500/10 text-brand-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-white/40 font-semibold block uppercase">Registered Parents</span>
              <span className="text-2xl font-bold text-white">{stats?.total_users ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Main section: Ingestion & Review Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Col: Ingestion Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-glass border-dark-700 space-y-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-500" />
                <span>Ingest Medical Resource</span>
              </h3>
              <p className="text-xs text-white/60">
                Input any URL from approved domains (WHO, NHS, ICMR, PubMed, AAP, CDC, FOGSI).
              </p>

              <form onSubmit={handleIngest} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-semibold">Source URL</label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://www.who.int/... or https://www.nhs.uk/..."
                    className="input-glass text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-semibold">Target Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-glass text-xs"
                  >
                    <option value="pregnancy">Pregnancy & Fetal Development</option>
                    <option value="newborn">Newborn & Infant Care</option>
                    <option value="nutrition">Diet & Nutrition</option>
                    <option value="wellness">Mental Wellbeing</option>
                    <option value="healthcare">Healthcare Services</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-white/60 font-semibold">Admin Ingestion Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Target postpartum anemia guidelines"
                    className="input-glass text-xs h-20 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={ingesting}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-semibold"
                >
                  {ingesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Process & Queue AI Summary</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right 2 cols: Review queue list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card-glass border-dark-700 min-h-[400px]">
              <h3 className="text-lg font-bold font-display text-white border-b border-dark-700 pb-4 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-500" />
                <span>AI Ingested Pending Queue ({pending.length})</span>
              </h3>

              {pendingLoading ? (
                <div className="space-y-4">
                  <div className="skeleton h-32"></div>
                  <div className="skeleton h-32"></div>
                </div>
              ) : pending.length > 0 ? (
                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                  {pending.map((art) => (
                    <div key={art.id} className="p-4 rounded-xl bg-dark-900 border border-dark-700 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-brand-500 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                            {art.category}
                          </span>
                          <h4 className="font-bold text-white text-base mt-2">{art.title}</h4>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            art.ai_confidence_score >= 0.8 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            AI Confidence: {Math.round(art.ai_confidence_score * 100)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 bg-dark-900 p-3 rounded-lg border border-dark-700 italic">
                        {art.summary}
                      </p>

                      {art.risk_flags && art.risk_flags.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span><strong>Risk Flags Detected:</strong> {art.risk_flags.join(', ')}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-dark-700">
                        <div className="text-[11px] text-white/40">
                          Source: <a href={art.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{art.source_name}</a>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(art.id, 'reject')}
                            className="py-1 px-3 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleReview(art.id, 'approve')}
                            className="py-1 px-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-semibold transition-all shadow-md"
                          >
                            Approve & Publish
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-white/40 py-16">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400/20 mb-2" />
                  <p className="text-sm font-semibold">Approval queue is empty</p>
                  <p className="text-xs mt-1">Excellent! All AI processed medical articles have been reviewed.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
