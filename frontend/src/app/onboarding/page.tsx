'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import { Sparkles, Baby, Heart, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile, isLoading: authLoading } = useAuth();
  
  const [userType, setUserType] = useState<'pregnant' | 'new_mom' | null>(null);
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(12);
  const [babyAgeMonths, setBabyAgeMonths] = useState<number | ''>('');
  const [dietaryPref, setDietaryPref] = useState<'vegetarian' | 'non_vegetarian' | 'vegan'>('vegetarian');
  const [saveProfile, setSaveProfile] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Wait for auth to settle before redirecting to prevent flicker
    if (authLoading) return;
    if (!user) {
      router.push('/login');
    } else if (profile) {
      // Has a saved server profile → go straight to dashboard
      router.push('/dashboard');
    } else {
      // Check if a temp session profile already exists (guest chose not to save)
      const tempProfile = sessionStorage.getItem('temp_profile');
      if (tempProfile) {
        router.push('/dashboard');
      }
    }
  }, [user, profile, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) {
      toast.error('Please select your current phase');
      return;
    }
    
    setLoading(true);
    
    // Calculate an approximate baby_birth_date if age is provided
    let babyBirthDate = null;
    if (userType === 'new_mom' && babyAgeMonths !== '') {
      const calcDate = new Date();
      calcDate.setMonth(calcDate.getMonth() - Number(babyAgeMonths));
      babyBirthDate = calcDate.toISOString().split('T')[0];
    }

    try {
      if (saveProfile) {
        await profileApi.create({
          user_type: userType,
          pregnancy_week: userType === 'pregnant' ? pregnancyWeek : null,
          baby_birth_date: babyBirthDate,
          dietary_preference: dietaryPref,
          is_subscribed: !user?.isAnonymous,
        });
        toast.success('Profile created successfully! Welcome to MaMaVerse.');
        await refreshProfile();
      } else {
        // Save temporary profile without creating it in the backend
        sessionStorage.setItem('temp_profile', JSON.stringify({
          user_type: userType,
          pregnancy_week: userType === 'pregnant' ? pregnancyWeek : null,
          baby_birth_date: babyBirthDate,
          dietary_preference: dietaryPref,
          email: user?.email
        }));
        toast.success('Continuing without saving profile.');
      }
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to complete profile creation');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
        <div className="skeleton w-12 h-12 rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-40px)] flex flex-col items-center justify-center p-4 mesh-bg relative overflow-hidden">
      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-brand-500/10 blur-[120px] pointer-events-none animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand mb-6 animate-fade-in">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold font-display tracking-tight text-white mb-3">
            Let's Personalize Your Journey
          </h1>
          <p className="text-sm text-white/60 max-w-sm font-medium">
            Select your current phase to get started. You can skip the optional details if you prefer.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
          {/* User Type Selection Cards */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setUserType('pregnant')}
              className={`relative overflow-hidden p-6 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 text-center transition-all duration-300 ${
                userType === 'pregnant'
                  ? 'bg-brand-950/40 border-brand-500 shadow-glow-brand'
                  : 'bg-dark-900 border-dark-700 hover:bg-dark-700 hover:border-dark-600'
              }`}
            >
              <div className={`p-3 rounded-full transition-colors ${userType === 'pregnant' ? 'bg-brand-500 text-white' : 'bg-dark-700 text-white/40'}`}>
                <Heart className="w-8 h-8" />
              </div>
              <span className={`font-bold text-lg ${userType === 'pregnant' ? 'text-white' : 'text-white/60'}`}>I am Pregnant</span>
            </button>

            <button
              type="button"
              onClick={() => setUserType('new_mom')}
              className={`relative overflow-hidden p-6 rounded-2xl flex flex-col items-center justify-center gap-3 border-2 text-center transition-all duration-300 ${
                userType === 'new_mom'
                  ? 'bg-brand-950/40 border-brand-500 shadow-glow-brand'
                  : 'bg-dark-900 border-dark-700 hover:bg-dark-700 hover:border-dark-600'
              }`}
            >
              <div className={`p-3 rounded-full transition-colors ${userType === 'new_mom' ? 'bg-brand-500 text-white' : 'bg-dark-700 text-white/40'}`}>
                <Baby className="w-8 h-8" />
              </div>
              <span className={`font-bold text-lg ${userType === 'new_mom' ? 'text-white' : 'text-white/60'}`}>I am a New Mom</span>
            </button>
          </div>

          {/* Conditional inputs based on selection */}
          <div className="transition-all duration-500 ease-in-out" style={{ minHeight: userType ? '120px' : '0' }}>
            {userType === 'pregnant' && (
              <div className="card-glass border-dark-700 animate-fade-in space-y-4">
                <label className="text-sm font-semibold text-white/80 flex items-center justify-between">
                  <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-brand-400" /> Pregnancy Week (Optional)</span>
                  <span className="text-brand-500 font-bold bg-brand-500/20 px-3 py-1 rounded-full">Week {pregnancyWeek}</span>
                </label>
                <div className="pt-2">
                  <input
                    type="range"
                    min="1"
                    max="42"
                    value={pregnancyWeek}
                    onChange={(e) => setPregnancyWeek(parseInt(e.target.value))}
                    className="w-full accent-brand-500 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer outline-none"
                  />
                  <div className="flex justify-between text-xs text-white/40 font-medium mt-3 px-1 uppercase tracking-wider">
                    <span>Trimester 1</span>
                    <span>Trimester 2</span>
                    <span>Trimester 3</span>
                  </div>
                </div>
              </div>
            )}
            
            {userType === 'new_mom' && (
              <div className="card-glass border-dark-700 animate-fade-in space-y-4">
                <label className="text-sm font-semibold text-white/80 block flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-400" /> Baby's Age in Months (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="36"
                  placeholder="e.g., 3"
                  value={babyAgeMonths}
                  onChange={(e) => setBabyAgeMonths(e.target.value ? parseInt(e.target.value) : '')}
                  className="input-glass border-dark-700 focus:border-brand-500 bg-dark-900"
                />
              </div>
            )}
          </div>

          {/* Diet Selection */}
          <div className="space-y-4 pt-4 border-t border-dark-700">
            <label className="text-sm font-semibold text-white/80 block text-center">Dietary Preference (Optional)</label>
            <div className="grid grid-cols-3 gap-3 bg-dark-900 p-2 rounded-xl border border-dark-700">
              {(['vegetarian', 'non_vegetarian', 'vegan'] as const).map((pref) => (
                <button
                  type="button"
                  key={pref}
                  onClick={() => setDietaryPref(pref)}
                  className={`py-3 px-3 rounded-lg text-xs md:text-sm font-bold capitalize transition-all duration-300 ${
                    dietaryPref === pref
                      ? 'bg-gradient-brand text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-dark-900'
                  }`}
                >
                  {pref.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-8">
            <input
              id="save-profile"
              type="checkbox"
              checked={saveProfile}
              onChange={(e) => setSaveProfile(e.target.checked)}
              className="h-4 w-4 rounded border-dark-700 text-brand-600 focus:ring-brand-500 bg-dark-900"
            />
            <label htmlFor="save-profile" className="text-sm text-white/80 cursor-pointer">
              Save this profile to my account (Optional)
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !userType}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-base font-bold shadow-glow-brand mt-4"
          >
            {loading ? 'Creating Profile...' : 'Enter MaMaVerse'}
          </button>

          <button
            type="button"
            onClick={async () => {
              const { signOutUser } = await import('@/lib/firebase');
              await signOutUser();
              window.location.href = '/login';
            }}
            className="w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors mt-4 block"
          >
            Sign Out / Choose Another Account
          </button>
        </form>
      </div>
    </main>
  );
}
