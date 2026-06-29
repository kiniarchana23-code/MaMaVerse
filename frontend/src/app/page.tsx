'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white mesh-bg">
      <div className="flex flex-col items-center gap-2">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <span className="text-sm text-white/60">Connecting to MaMaVerse...</span>
      </div>
    </div>
  );
}
