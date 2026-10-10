import './globals.css';

export const metadata = {
  title: 'Awesome Free SEO Backlinks — 195+ Curated Directory Submission Sites (2026)',
  description:
    'A curated catalog of 195+ free high Domain Rating backlink sources, directory submission sites, AI tool directories, and startup launch sites. Track submissions and secure live links.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
