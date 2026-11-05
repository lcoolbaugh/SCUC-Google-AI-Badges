import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const DEFAULT_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/14RGvXzzk9M0_7DdcaDB_4jcI7ubWijgKzQjnrNtJd98/export?format=csv';

export const CAT_EDU = 'Introduction to Gemini for Education';
export const CAT_NOTEBOOK = 'Introduction to Gemini for Notebook';
export const CAT_CODING = 'Introduction to Vibe Coding with Gemini';

export interface BadgeRecord {
  id: string;
  timestamp: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  role: string;
  credentialUrl: string;
  badge: string;
  rawBadge: string;
}

let cachedData: BadgeRecord[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

// Persistent celebrations store across server restarts and shared link views
const CELEBRATIONS_FILE = path.resolve(__dirname, 'celebrations-store.json');

function loadCelebrationsFromDisk(): Record<string, number> {
  try {
    if (fs.existsSync(CELEBRATIONS_FILE)) {
      const data = fs.readFileSync(CELEBRATIONS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read celebrations from disk:', err);
  }
  return {};
}

function saveCelebrationsToDisk(store: Record<string, number>) {
  try {
    fs.writeFileSync(CELEBRATIONS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save celebrations to disk:', err);
  }
}

let celebrationsStore: Record<string, number> = loadCelebrationsFromDisk();

const fallbackDataset: BadgeRecord[] = [
  {
    id: 'rec-1',
    timestamp: '10/1/2026 12:11:26',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_EDU,
    rawBadge: 'Introduction to Gemini'
  },
  {
    id: 'rec-2',
    timestamp: '10/2/2026 10:27:52',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_NOTEBOOK,
    rawBadge: 'Introduction to Gemini Notebook'
  },
  {
    id: 'rec-3',
    timestamp: '10/2/2026 10:34:17',
    firstName: 'Linda',
    lastName: 'Coolbaugh',
    fullName: 'Linda Coolbaugh',
    department: 'Technology',
    role: 'Lead Instructional Technology Coordinator',
    credentialUrl: 'https://edu.google.accredible.com/profile/lindacoolbaugh323788/wallet',
    badge: CAT_CODING,
    rawBadge: 'Introduction to Vibe Coding with Gemini'
  },
  {
    id: 'rec-4',
    timestamp: '10/2/2026 10:51:42',
    firstName: 'Devin',
    lastName: 'Hewer',
    fullName: 'Devin Hewer',
    department: 'Technology',
    role: 'ITC',
    credentialUrl: 'https://edu.google.accredible.com/a7c8217f-d770-4f42-816d-8b7cc2eef533',
    badge: CAT_EDU,
    rawBadge: 'Introduction to Gemini for Education'
  }
];

function classifyBadgeCategory(rawBadge: string): string {
  const lower = (rawBadge || '').toLowerCase().trim();
  if (lower.includes('notebook') || lower.includes('note')) {
    return CAT_NOTEBOOK;
  }
  if (lower.includes('vibe') || lower.includes('coding') || lower.includes('code') || lower.includes('dev')) {
    return CAT_CODING;
  }
  return CAT_EDU;
}

function normalizeRows(rows: Record<string, string>[]): BadgeRecord[] {
  if (!rows || rows.length === 0) return [];

  return rows
    .map((r, index) => {
      const keys = Object.keys(r);
      const vals = Object.values(r);

      const findKey = (terms: string[]) =>
        keys.find((k) => {
          const lk = k.toLowerCase();
          return terms.some((t) => lk.includes(t.toLowerCase()));
        });

      // 1. First Name (Index 1) & Last Name (Index 2)
      let firstName = vals[1] !== undefined && vals[1] !== '' ? String(vals[1]).trim() : '';
      let lastName = vals[2] !== undefined && vals[2] !== '' ? String(vals[2]).trim() : '';
      if (!firstName || firstName.startsWith('http')) {
        const fnKey = findKey(['first name', 'first', 'fname']);
        firstName = fnKey ? String(r[fnKey]).trim() : '';
      }
      if (!lastName || lastName.startsWith('http')) {
        const lnKey = findKey(['last name', 'surname', 'lname']);
        lastName = lnKey ? String(r[lnKey]).trim() : '';
      }

      if (!firstName && !lastName) {
        const nameKey = findKey(['full name', 'name', 'earner', 'participant']);
        if (nameKey && r[nameKey]) {
          const parts = String(r[nameKey]).trim().split(/\s+/);
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }
      }

      // 2. Badge (Index 6 or key match)
      let rawBadge = vals[6] !== undefined && vals[6] !== '' ? String(vals[6]).trim() : '';
      if (!rawBadge || rawBadge.startsWith('http') || rawBadge.includes('/')) {
        const badgeKey = findKey(['badge', 'earned', 'which', 'course', 'credential', 'category']);
        if (badgeKey) rawBadge = String(r[badgeKey] || '').trim();
      }

      // If still empty, check any value containing "Introduction" or "Gemini"
      if (!rawBadge) {
        for (const v of vals) {
          const sv = String(v).trim();
          if (sv.toLowerCase().includes('gemini') || sv.toLowerCase().includes('vibe')) {
            rawBadge = sv;
            break;
          }
        }
      }

      // DISCARD empty spreadsheet rows:
      // If a row has neither a staff member name nor a badge submission (e.g. template formula rows with just FALSE checkboxes), skip it!
      if (!firstName && !lastName && !rawBadge) {
        return null;
      }

      // If there is no person name at all on this row, ignore it to prevent artificial dummy earners
      if (!firstName && !lastName) {
        return null;
      }

      // 3. Clean up and normalize names (e.g. remove stray backticks, extra whitespace, normalize capitalization)
      const cleanWord = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '');
      const cleanFirst = firstName.replace(/[`"'\\]/g, '').replace(/\s+/g, ' ').trim();
      const cleanLast = lastName.replace(/[`"'\\]/g, '').replace(/\s+/g, ' ').trim();

      // Normalize all-caps names (like "HOLLOWELL" -> "Hollowell")
      let finalFirst =
        cleanFirst === cleanFirst.toUpperCase() && cleanFirst.length > 2
          ? cleanFirst.split(' ').map(cleanWord).join(' ')
          : cleanFirst;
      let finalLast =
        cleanLast === cleanLast.toUpperCase() && cleanLast.length > 2
          ? cleanLast.split(' ').map(cleanWord).join(' ')
          : cleanLast;

      // Unify nickname variations for accurate earner profiling & credential wallet aggregation
      if (finalFirst.toLowerCase() === 'christopher' && finalLast.toLowerCase() === 'hicks') {
        finalFirst = 'Chris';
      }

      const fullName = `${finalFirst} ${finalLast}`.trim();
      if (!fullName) {
        return null;
      }

      // 4. Timestamp (Index 0 or key match)
      let timestamp = vals[0] !== undefined && vals[0] !== '' ? String(vals[0]).trim() : '';
      if (!timestamp || (!timestamp.includes('/') && !timestamp.includes('-') && !timestamp.includes(':'))) {
        const tsKey = findKey(['timestamp', 'date', 'time']);
        timestamp = tsKey ? String(r[tsKey]).trim() : '';
      }

      // 5. Campus / Department (Index 3)
      let dept = vals[3] !== undefined && vals[3] !== '' ? String(vals[3]).trim() : '';
      if (!dept || dept.startsWith('http')) {
        const deptKey = findKey(['campus', 'department', 'dept', 'school', 'faculty', 'unit', 'select']);
        dept = deptKey ? String(r[deptKey]).trim() : 'General Campus';
      }

      // 6. Position / Role (Index 4)
      let role = vals[4] !== undefined && vals[4] !== '' ? String(vals[4]).trim() : '';
      if (!role || role.startsWith('http')) {
        const roleKey = findKey(['position', 'role', 'title', 'job']);
        role = roleKey ? String(r[roleKey]).trim() : 'Staff Member';
      }

      // 7. Credential Link (Index 5)
      let credUrl = vals[5] !== undefined && vals[5] !== '' ? String(vals[5]).trim() : '';
      if (!credUrl || !credUrl.startsWith('http')) {
        const urlKey = findKey(['link', 'credential', 'url', 'wallet', 'accredible', 'site', 'badge site']);
        credUrl = urlKey ? String(r[urlKey]).trim() : '';
      }

      return {
        id: `rec-${index + 1}-${encodeURIComponent(fullName)}-${encodeURIComponent(rawBadge || 'badge')}`,
        timestamp: timestamp || new Date().toLocaleDateString(),
        firstName: finalFirst,
        lastName: finalLast,
        fullName,
        department: dept || 'General Campus',
        role: role || 'Staff Member',
        credentialUrl: credUrl || '',
        badge: classifyBadgeCategory(rawBadge),
        rawBadge: rawBadge || 'Introduction to Gemini'
      };
    })
    .filter((r): r is BadgeRecord => Boolean(r && r.fullName && r.badge));
}

async function fetchGoogleSheetData(sheetUrl = DEFAULT_SHEET_CSV_URL, force = false): Promise<{
  records: BadgeRecord[];
  isLive: boolean;
  error?: string;
}> {
  const now = Date.now();
  if (!force && cachedData.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    return { records: cachedData, isLive: true };
  }

  try {
    const res = await fetch(sheetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      redirect: 'follow'
    });

    if (!res.ok) {
      throw new Error(`Google Sheet returned HTTP ${res.status}: ${res.statusText}`);
    }

    const csvText = await res.text();
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Google Sheet returned empty CSV');
    }

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy'
    });

    if (parsed.data && parsed.data.length > 0) {
      const records = normalizeRows(parsed.data);
      if (records.length > 0) {
        cachedData = records;
        lastFetchTime = now;
        return { records, isLive: true };
      }
    }

    throw new Error('No valid records parsed from CSV');
  } catch (err: any) {
    console.warn('Failed to fetch/parse Google Sheet live, serving cache or fallback:', err?.message || err);
    if (cachedData.length > 0) {
      return { records: cachedData, isLive: false, error: err?.message };
    }
    return { records: fallbackDataset, isLive: false, error: err?.message };
  }
}

// API Routes
app.get('/api/badges', async (req: Request, res: Response) => {
  const force = req.query.force === 'true' || req.query.refresh === '1';
  const customUrl = typeof req.query.sheetUrl === 'string' ? req.query.sheetUrl : DEFAULT_SHEET_CSV_URL;

  const result = await fetchGoogleSheetData(customUrl, force);
  const records = result.records;

  // Compute statistics
  const totalBadges = records.length;
  const uniqueCampuses = Array.from(new Set(records.map((r) => r.department))).filter(Boolean);
  const uniqueEarners = Array.from(new Set(records.map((r) => r.fullName)));

  // Category counts
  const categoryCounts = {
    [CAT_EDU]: records.filter((r) => r.badge === CAT_EDU).length,
    [CAT_NOTEBOOK]: records.filter((r) => r.badge === CAT_NOTEBOOK).length,
    [CAT_CODING]: records.filter((r) => r.badge === CAT_CODING).length
  };

  // Top 4 per category
  const getTop4ForCat = (catName: string) => {
    const deptMap: Record<string, number> = {};
    records
      .filter((r) => r.badge === catName)
      .forEach((r) => {
        deptMap[r.department] = (deptMap[r.department] || 0) + 1;
      });
    return Object.entries(deptMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  // Campus Leaderboard
  const campusMap: Record<
    string,
    {
      name: string;
      totalBadges: number;
      uniqueEarners: Set<string>;
      eduCount: number;
      notebookCount: number;
      codingCount: number;
    }
  > = {};

  records.forEach((r) => {
    if (!campusMap[r.department]) {
      campusMap[r.department] = {
        name: r.department,
        totalBadges: 0,
        uniqueEarners: new Set(),
        eduCount: 0,
        notebookCount: 0,
        codingCount: 0
      };
    }
    const c = campusMap[r.department];
    c.totalBadges += 1;
    c.uniqueEarners.add(r.fullName);
    if (r.badge === CAT_EDU) c.eduCount += 1;
    if (r.badge === CAT_NOTEBOOK) c.notebookCount += 1;
    if (r.badge === CAT_CODING) c.codingCount += 1;
  });

  const campusLeaderboard = Object.values(campusMap)
    .map((c) => ({
      name: c.name,
      totalBadges: c.totalBadges,
      earnersCount: c.uniqueEarners.size,
      eduCount: c.eduCount,
      notebookCount: c.notebookCount,
      codingCount: c.codingCount
    }))
    .sort((a, b) => b.totalBadges - a.totalBadges);

  // Earner profiles (multi-badge achievers)
  const earnerProfilesMap: Record<
    string,
    {
      fullName: string;
      firstName: string;
      lastName: string;
      department: string;
      role: string;
      badges: { badge: string; rawBadge: string; timestamp: string; credentialUrl: string }[];
    }
  > = {};

  records.forEach((r) => {
    if (!earnerProfilesMap[r.fullName]) {
      earnerProfilesMap[r.fullName] = {
        fullName: r.fullName,
        firstName: r.firstName,
        lastName: r.lastName,
        department: r.department,
        role: r.role,
        badges: []
      };
    }
    earnerProfilesMap[r.fullName].badges.push({
      badge: r.badge,
      rawBadge: r.rawBadge,
      timestamp: r.timestamp,
      credentialUrl: r.credentialUrl
    });
  });

  const earnerProfiles = Object.values(earnerProfilesMap).sort(
    (a, b) => b.badges.length - a.badges.length || a.fullName.localeCompare(b.fullName)
  );

  res.json({
    success: true,
    isLive: result.isLive,
    error: result.error,
    lastUpdated: new Date().toISOString(),
    sheetUrl: customUrl,
    celebrations: celebrationsStore,
    stats: {
      totalBadges,
      activeCampusesCount: uniqueCampuses.length,
      totalEarnersCount: uniqueEarners.length,
      categories: {
        edu: {
          name: CAT_EDU,
          count: categoryCounts[CAT_EDU],
          top4: getTop4ForCat(CAT_EDU)
        },
        notebook: {
          name: CAT_NOTEBOOK,
          count: categoryCounts[CAT_NOTEBOOK],
          top4: getTop4ForCat(CAT_NOTEBOOK)
        },
        coding: {
          name: CAT_CODING,
          count: categoryCounts[CAT_CODING],
          top4: getTop4ForCat(CAT_CODING)
        }
      },
      campusLeaderboard
    },
    records,
    earnerProfiles
  });
});

app.get('/api/celebrations', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const current = loadCelebrationsFromDisk();
  celebrationsStore = { ...celebrationsStore, ...current };
  res.json({ success: true, celebrations: celebrationsStore, timestamp: Date.now() });
});

app.post('/api/celebrations', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const { earnerName } = req.body || {};
  if (!earnerName || typeof earnerName !== 'string') {
    return res.status(400).json({ error: 'earnerName is required' });
  }
  const name = earnerName.trim();
  const current = loadCelebrationsFromDisk();
  celebrationsStore = { ...celebrationsStore, ...current };
  celebrationsStore[name] = (celebrationsStore[name] || 0) + 1;
  saveCelebrationsToDisk(celebrationsStore);
  res.json({
    success: true,
    earnerName: name,
    count: celebrationsStore[name],
    celebrations: celebrationsStore,
    timestamp: Date.now()
  });
});

app.post('/api/celebrations/reset', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  celebrationsStore = {};
  saveCelebrationsToDisk(celebrationsStore);
  res.json({ success: true, message: 'All cheers have been reset to 0.', celebrations: {}, reset: true, timestamp: Date.now() });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
