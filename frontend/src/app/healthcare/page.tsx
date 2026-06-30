'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { healthcareApi } from '@/lib/api';
import { MapPin, Navigation2, Search, Star, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const MAJOR_CITIES = [
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat"
];

export default function HealthcarePage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  const [specialties, setSpecialties] = useState<any[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('gynecologist');
  const [city, setCity] = useState('');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [useGeo, setUseGeo] = useState(false);
  const [fallbackGuidance, setFallbackGuidance] = useState('');

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!profile) {
        router.push('/onboarding');
      }
    }
  }, [user, profile, isLoading, router]);

  // Load specialties and default profile city
  useEffect(() => {
    const init = async () => {
      try {
        const specRes = await healthcareApi.getSpecialties();
        setSpecialties(specRes.data.specialties || []);
      } catch (err) {
        console.error(err);
      }
      if (profile?.city) {
        setCity(profile.city);
        // We don't auto search on initial load to save API calls, they can click Search.
      }
    };
    if (profile) {
      init();
    }
  }, [profile]);

  // Auto search when a predefined city is selected from the dropdown
  useEffect(() => {
    if (city && MAJOR_CITIES.includes(city)) {
       handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  const handleSearch = async (e?: React.FormEvent, lat?: number, lng?: number) => {
    if (e) e.preventDefault();
    if (!city && !lat && !lng) {
      toast.error('Please select a city or share location');
      return;
    }

    setSearching(true);
    setFacilities([]);
    setFallbackGuidance('');

    try {
      const res = await healthcareApi.search({
        city: lat && lng ? undefined : city,
        latitude: lat,
        longitude: lng,
        specialty: selectedSpecialty,
        radius_km: 10,
      });

      if (res.data.facilities && res.data.facilities.length > 0) {
        setFacilities(res.data.facilities);
        toast.success(`Found ${res.data.facilities.length} resources nearby!`);
      } else if (res.data.gemini_guidance) {
        setFallbackGuidance(res.data.gemini_guidance);
      } else {
        toast.error('No facilities found for this specialty/location');
      }
    } catch (err) {
      console.error(err);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setUseGeo(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleSearch(undefined, latitude, longitude);
      },
      (error) => {
        console.error(error);
        toast.error('Permission denied or location unavailable. Please enter city manually.');
        setUseGeo(false);
      }
    );
  };

  if (isLoading || !profile) return null;

  return (
    <div className="min-h-screen bg-dark-900 pb-12">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Search controls card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card-glass space-y-4">
            <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-500" />
              <span>Location Search</span>
            </h2>

            <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
              {/* Specialty selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 font-semibold uppercase">Healthcare Specialty</label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="input-glass text-sm"
                >
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id} className="bg-dark-900 text-white">
                      {spec.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs text-white/60 font-semibold uppercase">Select City</label>
                <div className="relative">
                  <select
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setUseGeo(false);
                    }}
                    className="input-glass pr-10 text-sm appearance-none"
                  >
                    <option value="" disabled className="bg-dark-900">Choose a city...</option>
                    {MAJOR_CITIES.map((c) => (
                      <option key={c} value={c} className="bg-dark-900 text-white">{c}</option>
                    ))}
                  </select>
                  <Search className="w-4 h-4 text-white/40 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching || useGeo}
                className="w-full btn-primary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
              >
                {searching && !useGeo ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search City'}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-dark-700"></div>
                <span className="flex-shrink mx-3 text-[10px] text-white/40 uppercase tracking-widest">Or</span>
                <div className="flex-grow border-t border-dark-700"></div>
              </div>

              {/* Browser Geo Button */}
              <button
                type="button"
                onClick={handleGeolocation}
                disabled={searching}
                className="w-full btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm font-semibold"
              >
                {searching && useGeo ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation2 className="w-4 h-4 text-brand-500" />
                )}
                <span>Use Geolocation</span>
              </button>
            </form>
          </div>
        </div>

        {/* Results grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card-glass min-h-[400px] flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between border-b border-dark-700 pb-4 mb-6">
                <h3 className="text-lg font-bold font-display text-white">Nearby Healthcare Facilities</h3>
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Grounded Verification
                </span>
              </div>

              {searching ? (
                <div className="space-y-4">
                  <div className="skeleton h-24"></div>
                  <div className="skeleton h-24"></div>
                  <div className="skeleton h-24"></div>
                </div>
              ) : facilities.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {facilities.map((fac, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-dark-900 border border-dark-700 hover:border-brand-500/50 transition-all flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-base">{fac.name}</h4>
                        <p className="text-xs text-white/60 mt-1">{fac.address}</p>
                        {fac.rating && (
                          <div className="flex items-center gap-1 mt-2 text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="text-xs font-semibold text-white/80">{fac.rating} ({fac.user_ratings_total})</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-dark-700 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-brand-500">
                          {selectedSpecialty.replace('_', ' ')}
                        </span>
                        {fac.google_maps_url && (
                          <a
                            href={fac.google_maps_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-brand-500 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                          >
                            <span>Map Route</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : fallbackGuidance ? (
                <div className="p-5 rounded-xl bg-dark-900 border border-dark-700 space-y-4">
                  <div className="flex items-center gap-2 text-brand-500 font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>AI Location-Aware Guidance</span>
                  </div>
                  <div className="text-white/80 prose-mamaverse text-sm" dangerouslySetInnerHTML={{ __html: fallbackGuidance.replace(/\n/g, '<br />') }} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-white/40 py-16">
                  <MapPin className="w-12 h-12 text-dark-700 mb-2" />
                  <p className="text-sm font-semibold">No search results to display</p>
                  <p className="text-xs mt-1 max-w-xs text-white/40">Select a city from the dropdown to instantly search for hospitals or gynecologists.</p>
                </div>
              )}
            </div>

            <div className="border-t border-dark-700 pt-4 mt-6 text-xs text-white/40">
              Disclaimer: Facility location search is powered by Google Places API. Always call and check prior to emergency visits.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
