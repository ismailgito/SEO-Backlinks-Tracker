import './globals.css';
import { INITIAL_SOURCES } from '@/lib/data/sources';

const SOURCE_COUNT = INITIAL_SOURCES.length;
const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TITLE = `Awesome Free SEO Backlinks — ${SOURCE_COUNT} Free Submission Sites (2026)`;
const DESCRIPTION = `A curated catalog of ${SOURCE_COUNT} free high Domain Rating backlink sources, directory submission sites, AI tool directories, and startup launch sites. Track submissions and secure live links.`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Awesome Free SEO Backlinks',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: TITLE,
    description: DESCRIPTION,
  },
};

// Runs before first paint so dark-mode visitors don't see a light flash while
// React hydrates and applies the saved theme.
const THEME_SCRIPT = `try{var t=localStorage.getItem('seo_theme');var d=t?t==='dark':window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
