// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Turkid FastFood - Lezzetli Hamburger ve Daha Fazlası',
  description: 'Türkiye\'nin en lezzetli fast food deneyimi. Hamburger, döner, kumru ve daha fazlası!',
  keywords: 'hamburger, fastfood, döner, kumru, yemek siparişi, online sipariş',
  authors: [{ name: 'Turkid Team' }],
  creator: 'Turkid',
  publisher: 'Turkid',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: 'https://turkid.com',
    title: 'Turkid FastFood',
    description: 'Türkiye\'nin en lezzetli fast food deneyimi',
    siteName: 'Turkid',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turkid FastFood',
    description: 'Türkiye\'nin en lezzetli fast food deneyimi',
    creator: '@turkid',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}