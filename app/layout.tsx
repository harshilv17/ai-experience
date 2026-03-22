// app/layout.tsx — Root layout
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Experience — Live Generative Installation',
  description: 'Real-time audience-driven generative AI visual installation for live events',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-black text-white">
      <body className={`${inter.className} bg-black text-white antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
