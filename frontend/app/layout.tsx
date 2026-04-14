import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: {
    default: "Richard's Garden Restaurant | Restaurante premium em Lisboa",
    template: "%s | Richard's Garden Restaurant"
  },
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png'
  },
  description:
    'Website premium do Richard\'s Restaurant Grill em Lisboa: menu completo, reservas online, reviews, contactos e experiência gastronómica sofisticada.',
  keywords: [
    'restaurante em Lisboa',
    'Richard\'s Restaurant Grill',
    'restaurante premium Lisboa',
    'sushi Lisboa',
    'grelhados Lisboa',
    'reserva restaurante Lisboa'
  ],
  openGraph: {
    title: "Richard's Garden Restaurant",
    description:
      'Cozinha europeia e portuguesa com grelhados, peixe, massas e sushi num ambiente contemporâneo em Lisboa.',
    images: ['/images/sushi-platter.jpg'],
    locale: 'pt_PT',
    type: 'website'
  },
  metadataBase: new URL('https://richards-restaurant-grill.example.com')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-PT"
      style={
        {
          '--font-inter': 'Inter, system-ui, sans-serif',
          '--font-playfair': '"Playfair Display", Georgia, serif'
        } as CSSProperties
      }
    >
      <body className="font-body antialiased">
        <Navbar />
        <main>
          <div className="content-shell py-8 sm:py-10">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
