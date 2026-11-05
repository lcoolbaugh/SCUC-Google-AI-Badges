import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { ApiResponse, BadgeRecord, DashboardStats, EarnerProfile } from '../types';
import { CAT_CODING, CAT_EDU, CAT_NOTEBOOK, DEFAULT_SHEET_CSV_URL, FALLBACK_RECORDS } from './constants';

export async function fetchDashboardData(
  sheetUrl = DEFAULT_SHEET_CSV_URL,
  forceRefresh = false
): Promise<ApiResponse> {
  const query = new URLSearchParams();
  if (forceRefresh) query.set('force', 'true');
  if (sheetUrl && sheetUrl !== DEFAULT_SHEET_CSV_URL) query.set('sheetUrl', sheetUrl);

  try {
    const res = await fetch(`/api/badges?${query.toString()}`);
    if (res.ok) {
      const data: ApiResponse = await res.json();
      if (data && data.records && data.records.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch failed, falling back to client-side parse:', err);
  }

  // Client-side direct fallback attempt
  try {
    const clientRes = await fetch(
      sheetUrl + (sheetUrl.includes('?') ? '&' : '?') + 'nocache=' + Date.now(),
      { redirect: 'follow' }
    );
    if (clientRes.ok) {
      const text = await clientRes.text();
      const parsed = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: 'greedy'
      });
      if (parsed.data && parsed.data.length > 0) {
        const records = clientNormalize(parsed.data);
        if (records.length > 0) {
          return buildApiResponse(records, true, sheetUrl);
        }
      }
    }
  } catch (clientErr) {
    console.warn('Client-side direct fetch also failed, using fallback dataset:', clientErr);
  }

  return buildApiResponse(FALLBACK_RECORDS, false, sheetUrl, 'Using cached baseline dataset');
}

function clientNormalize(rows: Record<string, string>[]): BadgeRecord[] {
  return rows
    .map((r, index) => {
      const keys = Object.keys(r);
      const vals = Object.values(r);

      const findKey = (terms: string[]) =>
        keys.find((k) => {
          const lk = k.toLowerCase();
          return terms.some((t) => lk.includes(t.toLowerCase()));
        });

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

      let rawBadge = vals[6] !== undefined && vals[6] !== '' ? String(vals[6]).trim() : '';
      if (!rawBadge || rawBadge.startsWith('http') || rawBadge.includes('/')) {
        const badgeKey = findKey(['badge', 'earned', 'which', 'course', 'credential', 'category']);
        if (badgeKey) rawBadge = String(r[badgeKey] || '').trim();
      }

      if (!rawBadge) {
        for (const v of vals) {
          const sv = String(v).trim();
          if (sv.toLowerCase().includes('gemini') || sv.toLowerCase().includes('vibe')) {
            rawBadge = sv;
            break;
          }
        }
      }

      // Ignore empty template rows (no person name or badge title)
      if (!firstName && !lastName && !rawBadge) {
        return null;
      }
      if (!firstName && !lastName) {
        return null;
      }

      // Clean up names
      const cleanWord = (w: string) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : '');
      const cleanFirst = firstName.replace(/[`"'\\]/g, '').replace(/\s+/g, ' ').trim();
      const cleanLast = lastName.replace(/[`"'\\]/g, '').replace(/\s+/g, ' ').trim();

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

      const lower = (rawBadge || '').toLowerCase();
      let badge = CAT_EDU;
      if (lower.includes('notebook') || lower.includes('note')) {
        badge = CAT_NOTEBOOK;
      } else if (lower.includes('vibe') || lower.includes('coding') || lower.includes('code') || lower.includes('dev')) {
        badge = CAT_CODING;
      }

      let timestamp = vals[0] !== undefined && vals[0] !== '' ? String(vals[0]).trim() : '';
      if (!timestamp || (!timestamp.includes('/') && !timestamp.includes('-') && !timestamp.includes(':'))) {
        const tsKey = findKey(['timestamp', 'date', 'time']);
        timestamp = tsKey ? String(r[tsKey]).trim() : new Date().toLocaleDateString();
      }

      let dept = vals[3] !== undefined && vals[3] !== '' ? String(vals[3]).trim() : '';
      if (!dept || dept.startsWith('http')) {
        const deptKey = findKey(['campus', 'department', 'dept', 'school', 'faculty', 'unit']);
        dept = deptKey ? String(r[deptKey]).trim() : 'General Campus';
      }

      let role = vals[4] !== undefined && vals[4] !== '' ? String(vals[4]).trim() : '';
      if (!role || role.startsWith('http')) {
        const roleKey = findKey(['position', 'role', 'title', 'job']);
        role = roleKey ? String(r[roleKey]).trim() : 'Staff Member';
      }

      let credUrl = vals[5] !== undefined && vals[5] !== '' ? String(vals[5]).trim() : '';
      if (!credUrl || !credUrl.startsWith('http')) {
        const urlKey = findKey(['link', 'credential', 'url', 'wallet', 'accredible']);
        credUrl = urlKey ? String(r[urlKey]).trim() : '';
      }

      const record: BadgeRecord = {
        id: `client-${index + 1}-${encodeURIComponent(fullName)}`,
        timestamp: timestamp || new Date().toLocaleDateString(),
        firstName: finalFirst,
        lastName: finalLast,
        fullName,
        department: dept || 'General Campus',
        role: role || 'Staff Member',
        credentialUrl: credUrl || '',
        badge,
        rawBadge: rawBadge || 'Introduction to Gemini'
      };
      return record;
    })
    .filter((r): r is BadgeRecord => r !== null && Boolean(r.fullName && r.badge));
}

function buildApiResponse(
  records: BadgeRecord[],
  isLive: boolean,
  sheetUrl: string,
  error?: string,
  celebrations?: Record<string, number>
): ApiResponse {
  const totalBadges = records.length;
  const uniqueCampuses = Array.from(new Set(records.map((r) => r.department))).filter(Boolean);
  const uniqueEarners = Array.from(new Set(records.map((r) => r.fullName)));

  const getTop4 = (catName: string) => {
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

  const earnerProfilesMap: Record<string, EarnerProfile> = {};
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

  const stats: DashboardStats = {
    totalBadges,
    activeCampusesCount: uniqueCampuses.length,
    totalEarnersCount: uniqueEarners.length,
    categories: {
      edu: {
        name: CAT_EDU,
        count: records.filter((r) => r.badge === CAT_EDU).length,
        top4: getTop4(CAT_EDU)
      },
      notebook: {
        name: CAT_NOTEBOOK,
        count: records.filter((r) => r.badge === CAT_NOTEBOOK).length,
        top4: getTop4(CAT_NOTEBOOK)
      },
      coding: {
        name: CAT_CODING,
        count: records.filter((r) => r.badge === CAT_CODING).length,
        top4: getTop4(CAT_CODING)
      }
    },
    campusLeaderboard
  };

  return {
    success: true,
    isLive,
    error,
    lastUpdated: new Date().toISOString(),
    sheetUrl,
    stats,
    records,
    earnerProfiles,
    celebrations: celebrations || {}
  };
}

export async function fetchCelebrationsApi(): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/celebrations?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.celebrations) {
        return data.celebrations;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch celebrations from server:', err);
  }
  return {};
}

export function triggerCelebration(originX = 0.5, originY = 0.6) {
  confetti({
    particleCount: 70,
    spread: 65,
    origin: { x: originX, y: originY },
    colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#A142F4']
  });
}

export async function sendCelebrationApi(earnerName: string): Promise<Record<string, number> | null> {
  try {
    const res = await fetch('/api/celebrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ earnerName: earnerName.trim() })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.celebrations) {
        return data.celebrations;
      }
    }
  } catch (err) {
    console.warn('Failed to send celebration to server, using local fallback:', err);
  }
  return null;
}
