'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/firebase';
import { Heart, Baby, Calendar, Salad, Brain, MapPin, User, LogOut, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAdmin, isGuest } = useAuth();

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (err) {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Calendar },
    { href: '/nutrition', label: 'Nutrition', icon: Salad },
    { href: '/wellness', label: 'Wellness', icon: Brain },
    { href: '/healthcare', label: 'Healthcare', icon: MapPin },
  ];

  if (!profile) return null;

  return (
    <nav className="glass border-b border-white/10 px-4 md:px-8 py-3 sticky top-0 z-40 w-full flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-brand">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">
            MaMa<span className="text-gradient">Verse</span>
          </span>
        </Link>
        <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 capitalize border border-brand-500/30">
          {profile.user_type === 'pregnant' ? 'Pregnancy Phase' : 'New Mom Phase'}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all ${
                isActive ? 'text-brand-300' : 'text-white/60 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-300 hover:text-rose-200 border border-rose-500/20 rounded-lg bg-rose-500/10`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex flex-col text-right text-xs">
          <span className="font-semibold text-white/80">
            {isGuest ? 'Guest Parent' : profile.email?.split('@')[0]}
          </span>
          <span className="text-white/40">
            {profile.user_type === 'pregnant'
              ? `Week ${profile.pregnancy_week}`
              : `Baby ${profile.baby_age_months}M`}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all text-white/60 hover:text-rose-300"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
