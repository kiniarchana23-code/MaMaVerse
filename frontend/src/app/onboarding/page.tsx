'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/lib/api';
import { Sparkles, Baby, HelpCircle, MapPin, Check, Heart, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  
  const [userType, setUserType] = useState<'pregnant' | 'new_mom'>('pregnant');
  const [pregnancyWeek, setPregnancyWeek] = useState<number>(12);
  const [babyBirthDate, setBabyBirthDate] = useState<string>('');
  const [dietaryPref, setDietaryPref] = useState<'vegetarian' | 'non_vegetarian' | 'vegan'>('vegetarian');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('Maharashtra');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (profile) {
      router.push('/dashboard');
    }
  }, [user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.create({
        user_type: userType,
        pregnancy_week: userType === 'pregnant' ? pregnancyWeek : null,
        baby_birth_date: userType === 'new_mom' ? babyBirthDate : null,
        city: city || null,
        state: state || null,
        dietary_preference: dietaryPref,
        is_subscribed: !user?.isAnonymous,
      });
      toast.success('Profile created successfully! Welcome to MaMaVerse.');
      await refreshProfile();
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to complete profile creation');
    } finally {
      setLoading(false);
    }
  };

  if (!user || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
        <div className="skeleton w-12 h-12 rounded-full"></div>
      </div>
    );
  }

  return (
    <main className="min-h-[calc(100vh-40px)] flex flex-col items-center justify-center p-4 mesh-bg relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-rose-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg card-glass border-white/10 z-10">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow-brand mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Let's Personalize Your Journey</h1>
          <p className="text-sm text-white/60">
            Tell us about your current phase so we can tailor the medically curated insights just for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/80 block">Current Phase</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setUserType('pregnant')}
                className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border text-center transition-all ${
                  userType === 'pregnant'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow-brand'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Heart className="w-6 h-6 text-rose-400" />
                <span className="font-semibold text-sm">I am Pregnant</span>
              </button>

              <button
                type="button"
                onClick={() => setUserType('new_mom')}
                className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border text-center transition-all ${
                  userType === 'new_mom'
                    ? 'bg-brand-500/20 border-brand-500 text-white shadow-glow-brand'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <Baby className="w-6 h-6 text-brand-400" />
                <span className="font-semibold text-sm">I am a New Mom</span>
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          {userType === 'pregnant' ? (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-semibold text-white/80 block flex justify-between">
                <span>Pregnancy Week</span>
                <span className="text-brand-300 font-bold">Week {pregnancyWeek}</span>
              </label>
              <input
                type="range"
                min="1"
                max="42"
                value={pregnancyWeek}
                onChange={(e) => setPregnancyWeek(parseInt(e.target.value))}
                className="w-full accent-brand-500 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>Trimester 1 (W1-12)</span>
                <span>Trimester 2 (W13-26)</span>
                <span>Trimester 3 (W27+)</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-semibold text-white/80 block flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Baby's Date of Birth
              </label>
              <input
                type="date"
                required
                value={babyBirthDate}
                onChange={(e) => setBabyBirthDate(e.target.value)}
                className="input-glass"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Diet Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80 block">Dietary Preference</label>
            <div className="grid grid-cols-3 gap-2">
              {(['vegetarian', 'non_vegetarian', 'vegan'] as const).map((pref) => (
                <button
                  type="button"
                  key={pref}
                  onClick={() => setDietaryPref(pref)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    dietaryPref === pref
                      ? 'bg-brand-500/20 border-brand-500 text-white'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {pref.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* City / Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/80 block flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" /> City in India (Optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-glass"
              />
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="input-glass"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Telangana">Telangana</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Gujarat">Gujarat</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>
            <span className="text-xs text-white/40 block">Used to find nearby healthcare facilities and hospitals.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm font-semibold mt-4 shadow-glow-brand"
          >
            {loading ? 'Creating Profile...' : 'Save Profile & Enter MaMaVerse'}
          </button>
        </form>
      </div>
    </main>
  );
}
