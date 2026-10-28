// Storage & State Management Layer
// Handles local persistence (browser localStorage).
//
// Data is namespaced per owner ("guest" or "user:<id>") so a second person on
// the same browser never sees the previous account's projects or submissions.

const STORAGE_KEYS = {
  PROJECTS: 'seo_backlinks_projects',
  ACTIVE_PROJECT: 'seo_backlinks_active_project_id',
  SUBMISSIONS: 'seo_backlinks_submissions', // Record: { [projectId]: { [sourceId]: Submission } }
  EVENTS: 'seo_backlinks_events',
  USER_SESSION: 'seo_backlinks_user_session',
};

// Keys that hold per-owner data (the session key is global by design).
const SCOPED_KEYS = ['PROJECTS', 'ACTIVE_PROJECT', 'SUBMISSIONS', 'EVENTS'];

const DEFAULT_PROJECT = {
  id: 'proj-default',
  name: 'Primary SaaS Product',
  website_url: 'https://mycoolapp.com',
  created_at: new Date().toISOString(),
};

const MAX_EVENTS_PER_PROJECT = 100;

// A non-numeric env value used to become NaN, which made every limit check
// `>= NaN` (always false) and silently disabled the guest limit.
function parseFreeLimit(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return 5;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 5;
}

export const FREE_LIMIT = parseFreeLimit(process.env.NEXT_PUBLIC_FREE_TIER_SECURED_LIMIT);

// ---------------------------------------------------------------------------
// Safe localStorage helpers (blocked storage, corrupt JSON, wrong shapes)
// ---------------------------------------------------------------------------

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function readJson(key, fallback, isValid = () => true) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const value = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

export function safeGetItem(key) {
  try {
    return typeof window === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key, value) {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  } catch {
    // Non-critical (theme etc.)
  }
}

// ---------------------------------------------------------------------------
// Per-owner scoping
// ---------------------------------------------------------------------------

let storageScope = 'guest';

export function setStorageScope(userId) {
  storageScope = userId ? `user:${userId}` : 'guest';
}

const scopedKey = (name, scope = storageScope) => `${STORAGE_KEYS[name]}:${scope}`;

// Data saved before scoping existed lived under the bare keys. Move it into the
// guest scope once; it then follows the person into their account on sign-in.
export function migrateLegacyData() {
  if (typeof window === 'undefined') return;
  try {
    SCOPED_KEYS.forEach((name) => {
      const legacy = localStorage.getItem(STORAGE_KEYS[name]);
      if (legacy === null) return;
      const target = scopedKey(name, 'guest');
      if (localStorage.getItem(target) === null) localStorage.setItem(target, legacy);
      localStorage.removeItem(STORAGE_KEYS[name]);
    });
  } catch {
    // Nothing to migrate if storage is unavailable
  }
}

// First sign-in on this browser: carry the guest's work into the new account,
// but never overwrite an account that already has data.
export function adoptGuestData(userId) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const userScope = `user:${userId}`;
    if (localStorage.getItem(scopedKey('PROJECTS', userScope)) !== null) return;
    SCOPED_KEYS.forEach((name) => {
      const from = scopedKey(name, 'guest');
      const value = localStorage.getItem(from);
      if (value === null) return;
      localStorage.setItem(scopedKey(name, userScope), value);
      localStorage.removeItem(from);
    });
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export function getStoredSession() {
  const session = readJson(STORAGE_KEYS.USER_SESSION, null, isPlainObject);
  return session && typeof session.id === 'string' ? session : null;
}

export function saveStoredSession(session) {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
    }
  } catch {
    // Non-critical: the real session lives in Supabase cookies
  }
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const isProject = (p) => isPlainObject(p) && typeof p.id === 'string' && typeof p.name === 'string';

export function getProjects() {
  if (typeof window === 'undefined') return [DEFAULT_PROJECT];
  const projects = readJson(
    scopedKey('PROJECTS'),
    null,
    (v) => Array.isArray(v) && v.length > 0 && v.every(isProject)
  );
  if (projects) return projects;
  writeJson(scopedKey('PROJECTS'), [DEFAULT_PROJECT]);
  return [DEFAULT_PROJECT];
}

export function saveProjects(projects) {
  return writeJson(scopedKey('PROJECTS'), projects);
}

export function getActiveProjectId() {
  const stored = safeGetItem(scopedKey('ACTIVE_PROJECT'));
  return stored || DEFAULT_PROJECT.id;
}

export function setActiveProjectId(id) {
  safeSetItem(scopedKey('ACTIVE_PROJECT'), id);
}

// Removes a project's submissions and activity so deleting it leaves no orphans.
export function deleteProjectData(projectId) {
  const submissions = readJson(scopedKey('SUBMISSIONS'), {}, isPlainObject);
  if (projectId in submissions) {
    delete submissions[projectId];
    writeJson(scopedKey('SUBMISSIONS'), submissions);
  }
  const events = readJson(scopedKey('EVENTS'), [], Array.isArray);
  writeJson(
    scopedKey('EVENTS'),
    events.filter((e) => e.projectId !== projectId)
  );
}

// ---------------------------------------------------------------------------
// Submissions & events
// ---------------------------------------------------------------------------

function getAllSubmissions() {
  return readJson(scopedKey('SUBMISSIONS'), {}, isPlainObject);
}

export function getSubmissions(projectId) {
  const project = getAllSubmissions()[projectId];
  return isPlainObject(project) ? project : {};
}

export function getSecuredCount(projectId) {
  return Object.values(getSubmissions(projectId)).filter((s) => s.status === 'secured').length;
}

// Secured links across every project of the current owner. The guest limit is
// applied to this total, otherwise creating another project would reset it.
export function getTotalSecuredCount() {
  return Object.values(getAllSubmissions()).reduce(
    (sum, project) =>
      sum +
      (isPlainObject(project)
        ? Object.values(project).filter((s) => s?.status === 'secured').length
        : 0),
    0
  );
}

export function getEvents(projectId) {
  return readJson(scopedKey('EVENTS'), [], Array.isArray).filter(
    (e) => e && e.projectId === projectId
  );
}

/**
 * Update or record a submission transition
 * Returns { success: boolean, reason?: string, requiresAuth?: boolean, submission?: any }
 *
 * `liveUrl` / `notes` left undefined keep the existing values.
 */
export function recordSubmission({
  projectId,
  sourceId,
  sourceName,
  newStatus,
  liveUrl,
  notes,
  user = null,
}) {
  if (typeof window === 'undefined') return { success: false };

  const allSubmissions = getAllSubmissions();
  if (!isPlainObject(allSubmissions[projectId])) {
    allSubmissions[projectId] = {};
  }

  const existing = allSubmissions[projectId][sourceId] || {
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    projectId,
    sourceId,
    sourceName,
    status: 'unsubmitted',
    submitted_at: null,
    secured_at: null,
    live_url: '',
    notes: '',
  };

  // Gating: guests get FREE_LIMIT secured links in total, across all projects.
  if (newStatus === 'secured' && existing.status !== 'secured' && !user) {
    if (getTotalSecuredCount() >= FREE_LIMIT) {
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
  } else if (oldStatus === 'secured') {
    updated.secured_at = null;
  }

  if (newStatus === 'unsubmitted') {
    updated.submitted_at = null;
    updated.secured_at = null;
    updated.live_url = '';
  }

  allSubmissions[projectId][sourceId] = updated;
  if (!writeJson(scopedKey('SUBMISSIONS'), allSubmissions)) {
    return {
      success: false,
      reason: 'Could not save your changes. Browser storage is full or blocked.',
    };
  }

  // Activity log: best effort, and only for real status transitions so editing
  // notes on an already-secured link doesn't add "secured → secured" entries.
  if (oldStatus !== newStatus) {
    const allEvents = readJson(scopedKey('EVENTS'), [], Array.isArray);
    allEvents.unshift({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      sourceId,
      sourceName,
      oldStatus,
      newStatus,
      timestamp: now,
      liveUrl: updated.live_url,
    });

    // Cap per project so one busy project can't evict another's history.
    const seen = {};
    const trimmed = allEvents.filter((e) => {
      seen[e.projectId] = (seen[e.projectId] || 0) + 1;
      return seen[e.projectId] <= MAX_EVENTS_PER_PROJECT;
    });
    writeJson(scopedKey('EVENTS'), trimmed);
  }

  return { success: true, submission: updated };
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

// Quotes every cell and neutralises spreadsheet formulas: a cell starting with
// = + - @ (or tab / CR) is executed by Excel/Sheets when the file is opened.
function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportDataAsCsv(projectId, sources) {
  const submissions = getSubmissions(projectId);
  const rows = [
    ['Source Name', 'Domain', 'DR', 'Follow Status', 'Category', 'Workflow Status', 'Submitted At', 'Secured At', 'Live URL', 'Notes'],
  ];

  sources.forEach((s) => {
    const sub = submissions[s.id] || {};
    rows.push([
      s.name,
      s.domain || '',
      s.dr,
      s.source_follow_status,
      (s.categories || []).join(', '),
      sub.status || 'unsubmitted',
      sub.submitted_at || '',
      sub.secured_at || '',
      sub.live_url || '',
      sub.notes || '',
    ]);
  });

  // A Blob (not a data: URI) so '#', '%' or newlines in a note can't truncate the
  // file; the BOM makes Excel read non-ASCII notes as UTF-8.
  const csv = '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `seo-backlinks-export-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
