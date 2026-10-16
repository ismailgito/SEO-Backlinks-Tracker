// ─────────────────────────────────────────────────────────────────────────────
// CREATOR PROFILE — edit this file to fill in your details. Nothing else needs
// to change; the landing page "Built by" section reads everything from here.
//
// Profile picture:
//   1. Put your photo in the /public folder (e.g. public/creator.jpg)
//   2. Set  avatar: '/creator.jpg'
//   Until then, a placeholder circle is shown. A square image (400×400+) works best.
//
// Links:
//   - Fill in `url` for each link. Links with an empty `url` show as a greyed-out,
//     non-clickable chip. Delete an entry to remove it entirely.
//   - For email, either 'you@example.com' or 'mailto:you@example.com' works.
//   - To add another link, copy an entry and use one of these ids so the right
//     icon is used: github, linkedin, portfolio, twitter, email (anything else
//     gets a generic link icon).
// ─────────────────────────────────────────────────────────────────────────────

export const CREATOR = {
  name: 'MOHAMED ISMAIL',
  role: 'AI Powered Performance Marketer',
  bio: 'Performance Marketing professional with hands-on experience managing multi-channel ad spend across Google Ads, Meta Ads, SEO, Email, and Referral channels. Created a Meta Ads competitor creatives scraping automation using n8n to drive data-driven creative strategy. Skilled in conversion rate optimization (CRO), Google Analytics 4 (GA4), Google Tag Manager (GTM), UTM tracking standardization, and multi-touch attribution modeling. Identified a 6.1x ROAS channel and uncovered $2,700 in net budget reallocation opportunity through data-driven analysis.',
  avatar: '/profile.webp', // Place your photo as public/creator.jpg
  links: [
    { id: 'github', label: 'GitHub', url: 'https://github.com/ismailgito' },
    { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/mohamed-ismail-2700a2257/' },
    { id: 'portfolio', label: 'Portfolio', url: 'https://marketingportfolio7.netlify.app/' },
    { id: 'whatsapp', label: 'WhatsApp', url: 'https://wa.me/919384222784' },
    { id: 'email', label: 'Email', url: 'dadobeb553@gmail.com' },
  ],};

// Only http(s) and mailto links are rendered as clickable; anything else
// (e.g. a stray "javascript:" value) is treated as empty.
export function resolveCreatorLink(link) {
  const raw = String(link?.url || '').trim();
  if (!raw) return '';
  if (link.id === 'email' && !/^mailto:/i.test(raw) && raw.includes('@')) {
    return `mailto:${raw}`;
  }
  return /^(https?:\/\/|mailto:)/i.test(raw) ? raw : '';
}
