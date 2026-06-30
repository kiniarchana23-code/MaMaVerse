'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { agentApi } from '@/lib/api';
import { Salad, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NutritionPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  
  const [mealPlan, setMealPlan] = useState<string>('');
  const [planLoading, setPlanLoading] = useState(false);
  const [dietPref, setDietPref] = useState<string>('vegetarian');
  
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!profile) {
        router.push('/onboarding');
      }
    }
  }, [user, profile, isLoading, router]);

  const loadMealPlan = async () => {
    setPlanLoading(true);
    try {
      const res = await agentApi.getMealPlan();
      setMealPlan(res.data.meal_plan);
      setDietPref(res.data.dietary_preference || 'vegetarian');
    } catch (err) {
      console.error(err);
      toast.error('Failed to load personalized meal plan');
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      loadMealPlan();
    }
  }, [profile]);

  const handleAskNutrition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setQueryLoading(true);
    setAnswer('');
    try {
      const res = await agentApi.ask(query, 'nutrition');
      setAnswer(res.data.response);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 429) {
        toast.error('AI is temporarily busy — please try again in a minute.');
      } else if (status === 401) {
        toast.error('Please sign in to ask questions.');
      } else {
        toast.error(err?.response?.data?.detail || 'Could not reach the AI. Please try again.');
      }
    } finally {
      setQueryLoading(false);
    }
  };

  if (isLoading || !profile) return null;

  return (
    <div className="min-h-screen bg-dark-900 pb-12 mesh-bg">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Meal Plan display */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-glass border-dark-700 space-y-4">
            <div className="flex items-center justify-between border-b border-dark-700 pb-4">
              <h2 className="text-xl font-bold font-display text-white flex items-center gap-2">
                <Salad className="w-6 h-6 text-brand-500" />
                <span>Personalized 7-Day Indian Diet Plan</span>
              </h2>
              <span className="text-xs uppercase px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-500 font-bold border border-brand-500/20">
                {dietPref}
              </span>
            </div>

            {planLoading ? (
              <div className="space-y-4 py-8">
                <div className="skeleton h-6 w-1/3"></div>
                <div className="skeleton h-48 w-full"></div>
              </div>
            ) : mealPlan ? (
              <div className="prose-mamaverse max-w-none text-white/80 overflow-x-auto" dangerouslySetInnerHTML={{ __html: mealPlan.replace(/\n/g, '<br />') }} />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-white/40">No custom plan found. Click below to generate.</p>
                <button onClick={loadMealPlan} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
                  Generate Meal Plan
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nutrition AI assistant */}
        <div className="space-y-6">
          <div className="card-glass border-dark-700 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-lg border-b border-dark-700 pb-4">
              <Sparkles className="w-5 h-5 text-brand-500" />
              <span>Nutrition Assistant</span>
            </div>
            <p className="text-xs text-white/60">
              Ask about iron, calcium, folic acid intake or regional Indian dishes appropriate for your week or baby stage.
            </p>

            {answer ? (
              <div className="p-4 rounded-xl bg-dark-900 border border-dark-700 text-sm max-h-[300px] overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-xs text-white/40 border-b border-dark-700 pb-1">
                  <span>Nutrition Agent</span>
                  <span>Grounded in ICMR-NIN</span>
                </div>
                <div className="text-white/80 prose-mamaverse text-xs md:text-sm" dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br />') }} />
              </div>
            ) : (
              <div className="p-8 rounded-xl bg-dark-900 border border-dashed border-dark-700 text-center text-white/40 text-xs">
                Ask about pregnancy dietary restrictions, milk supply recipes, or ragi preparations.
              </div>
            )}

            <form onSubmit={handleAskNutrition} className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about diet, iron/calcium foods..."
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
