// Storage & State Management Layer
// Handles local persistence with automatic Supabase sync compatibility

const STORAGE_KEYS = {
  PROJECTS: 'seo_backlinks_projects',
  ACTIVE_PROJECT: 'seo_backlinks_active_project_id',
  SUBMISSIONS: 'seo_backlinks_submissions', // Record: { [projectId]: { [sourceId]: Submission } }
  EVENTS: 'seo_backlinks_events',
  USER_SESSION: 'seo_backlinks_user_session',
};

const DEFAULT_PROJECT = {
  id: 'proj-default',
  name: 'Primary SaaS Product',
  website_url: 'https://mycoolapp.com',
  created_at: new Date().toISOString(),
};

export const FREE_LIMIT = Number(process.env.NEXT_PUBLIC_FREE_TIER_SECURED_LIMIT || 5);

export function getStoredSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function saveStoredSession(session) {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  }
}

export function getProjects() {
  if (typeof window === 'undefined') return [DEFAULT_PROJECT];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify([DEFAULT_PROJECT]));
      return [DEFAULT_PROJECT];
    }
    const projects = JSON.parse(raw);
    return projects.length ? projects : [DEFAULT_PROJECT];
  } catch (e) {
    return [DEFAULT_PROJECT];
  }
}

export function saveProjects(projects) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
}

export function getActiveProjectId() {
  if (typeof window === 'undefined') return DEFAULT_PROJECT.id;
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT) || DEFAULT_PROJECT.id;
  } catch (e) {
    return DEFAULT_PROJECT.id;
  }
}

export function setActiveProjectId(id) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, id);
}

export function getSubmissions(projectId) {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    const all = raw ? JSON.parse(raw) : {};
    return all[projectId] || {};
  } catch (e) {
    return {};
  }
}

export function getSecuredCount(projectId) {
  const submissions = getSubmissions(projectId);
  return Object.values(submissions).filter((s) => s.status === 'secured').length;
}

export function getEvents(projectId) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((e) => e.projectId === projectId);
  } catch (e) {
    return [];
  }
}

/**
 * Update or record a submission transition
 * Returns { success: boolean, reason?: string, requiresAuth?: boolean, submission?: any }
 */
export function recordSubmission({
  projectId,
  sourceId,
  sourceName,
  newStatus,
  liveUrl = '',
  notes = '',
  user = null,
}) {
  if (typeof window === 'undefined') return { success: false };

  const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
  const allSubmissions = raw ? JSON.parse(raw) : {};
  if (!allSubmissions[projectId]) {
    allSubmissions[projectId] = {};
  }

  const existing = allSubmissions[projectId][sourceId] || {
    id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    projectId,
    sourceId,
    sourceName,
    status: 'unsubmitted',
    submitted_at: null,
    secured_at: null,
    live_url: '',
    notes: '',
  };

  const isGuest = !user;
  const currentSecuredCount = Object.values(allSubmissions[projectId]).filter(
    (s) => s.status === 'secured' && s.sourceId !== sourceId
  ).length;

  // Gating: 5-backlink rule for guests
  if (newStatus === 'secured' && existing.status !== 'secured') {
    if (isGuest && currentSecuredCount >= FREE_LIMIT) {
      return {
        success: false,
        requiresAuth: true,
        reason: `You have secured ${FREE_LIMIT} backlinks as a guest! Create a free account to secure unlimited backlinks.`,
      };
    }
  }

  const now = new Date().toISOString();
  const oldStatus = existing.status;

  const updated = {
    ...existing,
    status: newStatus,
    live_url: liveUrl !== undefined ? liveUrl : existing.live_url,
    notes: notes !== undefined ? notes : existing.notes,
    updated_at: now,
  };

  // Timestamps
  if (newStatus === 'submitted' || newStatus === 'secured') {
    if (!updated.submitted_at) {
      updated.submitted_at = now;
    }
  }
  if (newStatus === 'secured') {
    if (!updated.secured_at) {
      updated.secured_at = now;
    }
  } else if (newStatus !== 'secured' && oldStatus === 'secured') {
    updated.secured_at = null;
  }

  if (newStatus === 'unsubmitted') {
    updated.submitted_at = null;
    updated.secured_at = null;
    updated.live_url = '';
  }

  allSubmissions[projectId][sourceId] = updated;
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(allSubmissions));

  // Log Event
  const rawEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
  const allEvents = rawEvents ? JSON.parse(rawEvents) : [];
  const newEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    projectId,
    sourceId,
    sourceName,
    oldStatus,
    newStatus,
    timestamp: now,
    liveUrl: updated.live_url,
  };
  allEvents.unshift(newEvent);
  // Keep last 100 events
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(allEvents.slice(0, 100)));

  return { success: true, submission: updated };
}

export function exportDataAsCsv(projectId, sources) {
  const submissions = getSubmissions(projectId);
  const rows = [
    ['Source Name', 'Domain', 'DR', 'Follow Status', 'Category', 'Workflow Status', 'Submitted At', 'Secured At', 'Live URL', 'Notes'],
  ];

  sources.forEach((s) => {
    const sub = submissions[s.id] || {};
    rows.push([
      `"${s.name.replace(/"/g, '""')}"`,
      s.domain || '',
      s.dr,
      s.source_follow_status,
      `"${(s.categories || []).join(', ')}"`,
      sub.status || 'unsubmitted',
      sub.submitted_at || '',
      sub.secured_at || '',
      `"${(sub.live_url || '').replace(/"/g, '""')}"`,
      `"${(sub.notes || '').replace(/"/g, '""')}"`,
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `seo-backlinks-export-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
