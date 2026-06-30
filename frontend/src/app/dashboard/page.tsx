'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { agentApi, contentApi } from '@/lib/api';
import { Send, Sparkles, BookOpen, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  
  const [activeWeekOrMonth, setActiveWeekOrMonth] = useState<number>(1);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [agentType, setAgentType] = useState<string>('general');

  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // Redirect if not logged in or no profile
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!profile && !sessionStorage.getItem('temp_profile')) {
        router.push('/onboarding');
      }
    }
  }, [user, profile, isLoading, router]);

  // Sync user profile state
  useEffect(() => {
    const activeProfile = profile || (typeof window !== 'undefined' && sessionStorage.getItem('temp_profile') ? JSON.parse(sessionStorage.getItem('temp_profile')!) : null);
    
    if (activeProfile) {
      if (activeProfile.user_type === 'pregnant') {
        setActiveWeekOrMonth(activeProfile.pregnancy_week || 12);
        setAgentType('pregnancy');
      } else {
        setActiveWeekOrMonth(activeProfile.baby_age_months || 0);
        setAgentType('newmom');
      }
    }
  }, [profile]);

  // Load week summary or month guide
  const loadPhaseSummary = useCallback(async (val: number) => {
    const activeProfile = profile || (typeof window !== 'undefined' && sessionStorage.getItem('temp_profile') ? JSON.parse(sessionStorage.getItem('temp_profile')!) : null);
    if (!activeProfile) return;
    setSummaryLoading(true);
    try {
      if (activeProfile.user_type === 'pregnant') {
        const res = await agentApi.getPregnancyWeek(val);
        setSummaryData(res.data);
      } else {
        const res = await agentApi.getBabyMonth(val);
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load phase guide');
    } finally {
      setSummaryLoading(false);
    }
  }, [profile]);

  // Load curated knowledge base articles for current category
  const loadCuratedArticles = useCallback(async () => {
    const activeProfile = profile || (typeof window !== 'undefined' && sessionStorage.getItem('temp_profile') ? JSON.parse(sessionStorage.getItem('temp_profile')!) : null);
    if (!activeProfile) return;
    setArticlesLoading(true);
    try {
      const category = activeProfile.user_type === 'pregnant' ? 'pregnancy' : 'newborn';
      const res = await contentApi.getArticles({
        category,
        pregnancy_week: activeProfile.user_type === 'pregnant' ? activeWeekOrMonth : undefined,
        baby_age_months: activeProfile.user_type === 'new_mom' ? activeWeekOrMonth : undefined,
      });
      setArticles(res.data.articles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setArticlesLoading(false);
    }
  }, [profile, activeWeekOrMonth]);

  useEffect(() => {
    const activeProfile = profile || (typeof window !== 'undefined' && sessionStorage.getItem('temp_profile') ? JSON.parse(sessionStorage.getItem('temp_profile')!) : null);
    if (activeProfile) {
      loadPhaseSummary(activeWeekOrMonth);
      loadCuratedArticles();
    }
  }, [profile, activeWeekOrMonth, loadPhaseSummary, loadCuratedArticles]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    setChatLoading(true);
    setChatResponse('');
    try {
      const res = await agentApi.ask(chatQuery, agentType);
      setChatResponse(res.data.response);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Agent is currently offline');
    } finally {
      setChatLoading(false);
    }
  };

  const activeProfile = profile || (typeof window !== 'undefined' && sessionStorage.getItem('temp_profile') ? JSON.parse(sessionStorage.getItem('temp_profile')!) : null);

  if (isLoading || !activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
          <span className="text-sm text-white/60">Tailoring your experience...</span>
        </div>
      </div>
    );
  }

  const isPreg = activeProfile.user_type === 'pregnant';

  return (
    <div className="min-h-screen bg-dark-900 pb-12 mesh-bg">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Main curations & guides */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome Empathy banner */}
          <div className="p-6 rounded-2xl bg-gradient-brand shadow-glow-brand flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                Medically Curated
              </span>
              <h2 className="text-2xl font-bold font-display mt-2">
                Hello, {user?.displayName?.split(' ')[0] || activeProfile.email?.split('@')[0] || 'Mom'} ✨
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {isPreg 
                  ? `You are in Week ${activeWeekOrMonth} of pregnancy. Let's look after you and your baby.`
                  : `Your baby is ${activeWeekOrMonth} months old. Here is your evidence-based milestone summary.`}
              </p>
            </div>
            {/* Week / Month quick selection controls */}
            <div className="flex items-center gap-2 bg-white/10 p-1.5 rounded-xl border border-dark-600">
              <button
                disabled={activeWeekOrMonth <= (isPreg ? 1 : 0)}
                onClick={() => setActiveWeekOrMonth(prev => prev - 1)}
                className="p-1 rounded-lg hover:bg-dark-800 text-white disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-sm px-2">
                {isPreg ? `Week ${activeWeekOrMonth}` : `Month ${activeWeekOrMonth}`}
              </span>
              <button
                disabled={activeWeekOrMonth >= (isPreg ? 42 : 36)}
                onClick={() => setActiveWeekOrMonth(prev => prev + 1)}
                className="p-1 rounded-lg hover:bg-dark-800 text-white disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Medically Curated Phase Guide */}
          <div className="card-glass border-dark-700 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-700 pb-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                {isPreg ? 'Fetal Development & Maternal Health' : 'Infant Milestones & Recovery'}
              </h3>
              <span className="text-xs text-white/40">Sources: WHO, ICMR, AAP</span>
            </div>

            {summaryLoading ? (
              <div className="space-y-4 py-8">
                <div className="skeleton h-6 w-1/3"></div>
                <div className="skeleton h-32 w-full"></div>
                <div className="skeleton h-20 w-5/6"></div>
              </div>
            ) : summaryData ? (
              <div className="prose-mamaverse prose max-w-none text-white/80" dangerouslySetInnerHTML={{ __html: summaryData.content.replace(/\n/g, '<br />') }} />
            ) : (
              <p className="text-sm text-white/40 py-8 text-center">No summary data found for this period.</p>
            )}
          </div>

          {/* Curated Knowledge Base Articles (Admin Approved) */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Curated & Verified Publications
            </h3>

            {articlesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="skeleton h-40"></div>
                <div className="skeleton h-40"></div>
              </div>
            ) : articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map((art) => (
                  <div key={art.id} className="card-glass border-dark-700 hover:border-brand-500/30 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20">
                        {art.category}
                      </span>
                      <h4 className="font-bold text-white text-base mt-2 line-clamp-1">{art.title}</h4>
                      <p className="text-xs text-white/60 mt-1 line-clamp-3">{art.summary}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
                      <span>Source: <strong>{art.source_name}</strong></span>
                      <a href={art.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline">
                        Visit Source
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-glass text-center py-8 text-sm text-white/40 border-dashed border-dark-700">
                No admin-validated articles currently published for this week.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Personal AI Companion Chat */}
        <div className="space-y-6">
          <div className="card-glass border-dark-700 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg border-b border-dark-700 pb-4">
                <Sparkles className="w-5 h-5 text-brand-400" />
                <span>AI Health Companion</span>
              </div>
              <p className="text-xs text-white/60">
                Ask anything about your health, diet, wellness or baby milestones. Powered by Gemini with direct medical source grounding.
              </p>

              {/* Agent specialty selection */}
              <div className="grid grid-cols-3 gap-1 bg-dark-900 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setAgentType(isPreg ? 'pregnancy' : 'newmom')}
                  className={`py-1.5 rounded ${agentType === 'pregnancy' || agentType === 'newmom' ? 'bg-brand-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  {isPreg ? 'Pregnancy' : 'Baby Care'}
                </button>
                <button
                  onClick={() => setAgentType('nutrition')}
                  className={`py-1.5 rounded ${agentType === 'nutrition' ? 'bg-brand-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  Nutrition
                </button>
                <button
                  onClick={() => setAgentType('wellness')}
                  className={`py-1.5 rounded ${agentType === 'wellness' ? 'bg-brand-500 text-white' : 'text-white/60 hover:text-white'}`}
                >
                  Wellness
                </button>
              </div>

              {/* Agent chat response screen */}
              {chatResponse ? (
                <div className="p-4 rounded-xl bg-dark-900 border border-dark-700 text-sm max-h-[300px] overflow-y-auto space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-white/40">
                    <span className="font-semibold text-brand-300">MaMaVerse AI</span>
                    <span>Sources: WHO / ICMR</span>
                  </div>
                  <div className="text-white/80 prose-mamaverse text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: chatResponse.replace(/\n/g, '<br />') }} />
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-dark-900 border border-dashed border-dark-700 flex flex-col items-center justify-center text-center text-white/40 text-xs">
                  <AlertCircle className="w-8 h-8 text-white/20 mb-2" />
                  <span>Ask a question below to start the conversation.</span>
                </div>
              )}
            </div>

            {/* Chat query form */}
            <form onSubmit={handleChatSubmit} className="mt-6 flex items-center gap-2 relative">
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="Ask about foods, symptoms, tests..."
                className="input-glass pr-12 text-sm"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-gradient-brand text-white hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {chatLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
