import rawSources from '@/data/backlinks.json';

export const INITIAL_SOURCES = rawSources;

export const DR_BANDS = [
  'All',
  '90+',
  '80–89',
  '70–79',
  '60–69',
  '50–59',
  '40–49',
  '30–39',
  '20–29',
  '10–19',
  '<10',
];

export const FOLLOW_STATUSES = [
  'All',
  'dofollow',
  'nofollow',
  'unverified',
];

export const WORKFLOW_STATUSES = [
  'All',
  'unsubmitted',
  'on_progress',
  'submitted',
  'secured',
  'rejected',
  'unable',
];

export const STATUS_LABELS = {
  unsubmitted: 'Unsubmitted',
  on_progress: 'On Progress',
  submitted: 'Submitted',
  secured: 'Secured',
  rejected: 'Rejected',
  unable: 'Unable',
};

export const STATUS_COLORS = {
  secured: {
    bg: '#E8F3EE',
    text: '#0B6B4F',
    border: '#0B6B4F',
    dot: '#0B6B4F',
  },
  submitted: {
    bg: '#EFF6FF',
    text: '#1D4ED8',
    border: '#93C5FD',
    dot: '#2563EB',
  },
  on_progress: {
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#FCD34D',
    dot: '#F59E0B',
  },
  unsubmitted: {
    bg: '#F3F4F6',
    text: '#4B5563',
    border: '#E5E7EB',
    dot: '#9CA3AF',
  },
  rejected: {
    bg: '#FEE2E2',
    text: '#B91C1C',
    border: '#FCA5A5',
    dot: '#EF4444',
  },
  unable: {
    bg: '#F3F4F6',
    text: '#6B7280',
    border: '#D1D5DB',
    dot: '#6B7280',
  },
};

export function getAllCategories() {
  const set = new Set();
  rawSources.forEach((s) => {
    (s.categories || []).forEach((c) => set.add(c));
  });
  return ['All', ...Array.from(set).sort()];
}
