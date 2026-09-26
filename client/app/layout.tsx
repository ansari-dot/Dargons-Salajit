import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/components/providers/StoreProvider';
import LayoutContent from '@/components/layout/LayoutContent';

export const metadata: Metadata = {
  title: 'Palses — Premium Himalayan Salajeet',
  description:
    'Sourced from the highest mountains, pure Salajeet is a natural powerhouse of minerals and nutrients crafted for strength, energy and peak wellness.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body>
        <StoreProvider>
          <LayoutContent>{children}</LayoutContent>
        </StoreProvider>
      </body>
    </html>
  );
}
