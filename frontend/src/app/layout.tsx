import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import { MedicalDisclaimer } from '@/components/MedicalDisclaimer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'MaMaVerse — AI Pregnancy & Early Parenthood Platform',
    template: '%s | MaMaVerse',
  },
  description:
    'Your trusted AI companion from pregnancy to parenthood. Medically curated, admin-validated information for pregnant women and new mothers in India.',
  keywords: [
    'pregnancy app india', 'pregnancy tracker', 'new mom guide india',
    'baby care india', 'prenatal nutrition', 'fetal development week by week',
    'postpartum care', 'breastfeeding guide', 'ICMR pregnancy guidelines',
  ],
  authors: [{ name: 'MaMaVerse' }],
  metadataBase: new URL('https://mamaverse.app'),
  openGraph: {
    title: 'MaMaVerse — AI Pregnancy & Parenthood Platform',
    description: 'Medically curated AI companion from pregnancy to parenthood',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-dark-900 text-white min-h-screen antialiased">
        <AuthProvider>
          <MedicalDisclaimer />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#220f3d',
                color: '#fff',
                border: '1px solid rgba(196, 79, 237, 0.3)',
                borderRadius: '12px',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
