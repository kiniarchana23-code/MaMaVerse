'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { agentApi } from '@/lib/api';
import { Brain, Heart, PhoneCall, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function WellnessPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  const [exercise, setExercise] = useState<string>('');
  const [exerciseLoading, setExerciseLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const loadMindfulnessExercise = async () => {
    setExerciseLoading(true);
    try {
      const res = await agentApi.getMindfulness();
      setExercise(res.data.exercise);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load guided mindfulness exercise');
    } finally {
      setExerciseLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadMindfulnessExercise();
    }
  }, [profile]);

  const handleAskWellness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setQueryLoading(true);
    setAnswer('');
    try {
      const res = await agentApi.ask(query, 'wellness');
      setAnswer(res.data.response);
    } catch (err) {
      console.error(err);
      toast.error('Wellness agent is offline');
    } finally {
      setQueryLoading(false);
    }
  };

  if (isLoading || !profile) return null;

  return (
    <div className="min-h-screen bg-dark-900 pb-12 mesh-bg">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Mindfulness and Help section */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mindfulness / Breathing Card */}
          <div className="card-glass border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-brand-400" />
                <span>5-Minute Guided Mindfulness Exercise</span>
              </h2>
              <button
                onClick={loadMindfulnessExercise}
                disabled={exerciseLoading}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${exerciseLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {exerciseLoading ? (
              <div className="space-y-4 py-8">
                <div className="skeleton h-6 w-1/3"></div>
                <div className="skeleton h-32 w-full"></div>
              </div>
            ) : exercise ? (
              <div className="prose-mamaverse max-w-none text-white/80" dangerouslySetInnerHTML={{ __html: exercise.replace(/\n/g, '<br />') }} />
            ) : (
              <p className="text-sm text-white/40 text-center py-8">Click the refresh button to generate your daily exercise.</p>
            )}
          </div>

          {/* India Helpline Directory (Supportive & Urgent) */}
          <div className="card-glass border-rose-500/20 bg-rose-950/20 space-y-4">
            <h3 className="text-lg font-bold font-display text-rose-300 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-rose-400" />
              <span>Maternal Mental Health Helplines (India)</span>
            </h3>
            <p className="text-xs text-white/60">
              Motherhood comes with severe changes. If you are experiencing persistent sadness, extreme anxiety, or feelings of despair, help is just a phone call away.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-white text-sm">iCall (TISS Helpline)</h4>
                <p className="text-lg font-bold text-brand-300 mt-1">9152987821</p>
                <span className="text-xs text-white/40">Mon - Sat, 8:00 AM - 10:00 PM</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="font-semibold text-white text-sm">NIMHANS Helpline</h4>
                <p className="text-lg font-bold text-brand-300 mt-1">080-46110007</p>
                <span className="text-xs text-white/40">Available 24/7 (Free Govt Service)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Wellness Companion Chat */}
        <div className="space-y-6">
          <div className="card-glass border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg border-b border-white/10 pb-4">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span>Emotional Wellbeing</span>
            </div>
            <p className="text-xs text-white/60">
              Ask about stress management, baby blues, sleep hygiene, partner support, or emotional self-care.
            </p>

            {answer ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm max-h-[300px] overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-xs text-white/40 border-b border-white/5 pb-1">
                  <span>Wellness Agent</span>
                  <span>Validated Guidance</span>
                </div>
                <div className="text-white/80 prose-mamaverse text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-white/40 text-xs">
                Speak to the agent about postpartum fatigue, balancing home & baby, or relationship transitions.
              </div>
            )}

            <form onSubmit={handleAskWellness} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="How are you feeling today?"
                className="input-glass text-sm"
                disabled={queryLoading}
              />
              <button
                type="submit"
                disabled={queryLoading}
                className="btn-primary p-3 flex items-center justify-center shrink-0"
              >
                {queryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
