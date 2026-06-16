import { NextResponse } from 'next/server';

/* ─── ESPN World Cup 2026 ───────────────────────────────────────────── */
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';

/* ─── The Odds API ───────────────────────────────────────────────────── */
const ODDS_KEY  = process.env.ODDS_API_KEY ?? '';
const ODDS_BASE = 'https://api.the-odds-api.com/v4';
// Possible sport keys for World Cup 2026 (try in order)
const ODDS_SPORTS = ['soccer_fifa_world_cup', 'soccer_world_cup', 'soccer_international'];

/* ─── Public types ───────────────────────────────────────────────────── */
export type WCStatus = 'scheduled' | 'live' | 'halftime' | 'final';

export interface WCMatch {
  id: string;
  home: string;
  homeCode: string;
  homeLogo: string | null;
  homeScore: number | null;
  homeWinner: boolean;
  away: string;
  awayCode: string;
  awayLogo: string | null;
  awayScore: number | null;
  awayWinner: boolean;
  status: WCStatus;
  clock: string | null;
  period: number | null;
  date: string;
  venue: string | null;
  round: string | null;
  // real odds from The Odds API
  oddsHome: number | null;
  oddsDraw: number | null;
  oddsAway: number | null;
  oddsSource: string | null;
}

export interface WCStanding {
  name: string;
  code: string;
  logo: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
}

export interface WCGroup {
  name: string;
  teams: WCStanding[];
}

export interface WCData {
  matches: WCMatch[];
  groups: WCGroup[];
  hasOdds: boolean;
  liveCount: number;
  todayCount: number;
  updatedAt: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function toStatus(name: string): WCStatus {
  if (name.includes('IN_PROGRESS')) return 'live';
  if (name.includes('HALFTIME'))    return 'halftime';
  if (name.includes('FINAL'))       return 'final';
  return 'scheduled';
}

function isToday(dateStr: string): boolean {
  const d    = new Date(dateStr);
  const now  = new Date();
  return d.toDateString() === now.toDateString();
}

/* ─── ESPN fetch ─────────────────────────────────────────────────────── */
async function espnScoreboard(): Promise<WCMatch[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return [];
    const body = await res.json();

    return (body.events ?? []).map((ev: any): WCMatch => {
      const comp   = ev.competitions?.[0] ?? {};
      const comps  = comp.competitors ?? [];
      const home   = comps.find((c: any) => c.homeAway === 'home') ?? comps[0] ?? {};
      const away   = comps.find((c: any) => c.homeAway === 'away') ?? comps[1] ?? {};
      const st     = toStatus(ev.status?.type?.name ?? '');
      const scored = st === 'live' || st === 'halftime' || st === 'final';

      return {
        id:          ev.id,
        home:        home.team?.displayName ?? home.team?.name ?? 'Local',
        homeCode:    home.team?.abbreviation ?? '---',
        homeLogo:    home.team?.logo ?? null,
        homeScore:   scored ? parseInt(home.score ?? '0', 10) : null,
        homeWinner:  !!home.winner,
        away:        away.team?.displayName ?? away.team?.name ?? 'Visitante',
        awayCode:    away.team?.abbreviation ?? '---',
        awayLogo:    away.team?.logo ?? null,
        awayScore:   scored ? parseInt(away.score ?? '0', 10) : null,
        awayWinner:  !!away.winner,
        status:      st,
        clock:       ev.status?.displayClock ?? null,
        period:      ev.status?.period ?? null,
        date:        ev.date ?? new Date().toISOString(),
        venue:       comp.venue?.fullName ?? null,
        round:       ev.season?.type?.name ?? comp.series?.summary ?? null,
        oddsHome:    null,
        oddsDraw:    null,
        oddsAway:    null,
        oddsSource:  null,
      };
    });
  } catch {
    return [];
  }
}

async function espnStandings(): Promise<WCGroup[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/standings`, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const body = await res.json();

    return (body.standings ?? body.children ?? []).map((grp: any): WCGroup => {
      const teams: WCStanding[] = (grp.standings?.entries ?? grp.entries ?? []).map((entry: any) => {
        const stats: Record<string, number> = {};
        for (const s of entry.stats ?? []) stats[s.name] = s.value ?? 0;
        return {
          name:   entry.team?.displayName ?? entry.team?.name ?? '?',
          code:   entry.team?.abbreviation ?? '?',
          logo:   entry.team?.logo ?? null,
          played: stats.gamesPlayed ?? 0,
          won:    stats.wins        ?? 0,
          drawn:  stats.ties        ?? stats.draws ?? 0,
          lost:   stats.losses      ?? 0,
          gf:     stats.pointsFor   ?? stats.goalsFor   ?? 0,
          ga:     stats.pointsAgainst ?? stats.goalsAgainst ?? 0,
          gd:     stats.pointDifferential ?? stats.goalDifference ?? 0,
          pts:    stats.points      ?? 0,
        };
      });

      return { name: grp.name ?? grp.abbreviation ?? 'Grupo', teams };
    });
  } catch {
    return [];
  }
}

/* ─── Odds API fetch ──────────────────────────────────────────────────── */
type OddsEntry = { home: number; draw: number; away: number; source: string };

async function fetchOdds(matches: WCMatch[]): Promise<Map<string, OddsEntry>> {
  const map = new Map<string, OddsEntry>();
  if (!ODDS_KEY || matches.length === 0) return map;

  for (const sportKey of ODDS_SPORTS) {
    try {
      const url = `${ODDS_BASE}/sports/${sportKey}/odds?apiKey=${ODDS_KEY}&regions=eu&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url, {
        next: { revalidate: 300 },      // cache odds 5 min server-side
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 422 || res.status === 404) continue; // wrong sport key
      if (!res.ok) break;

      const games: any[] = await res.json();

      for (const game of games) {
        const homeNameOdds = (game.home_team ?? '').toLowerCase();
        const awayNameOdds = (game.away_team ?? '').toLowerCase();
        const gameDateOdds = new Date(game.commence_time ?? '');

        // fuzzy-match ESPN match to Odds API event (name + date within ±24h)
        const espnMatch = matches.find(m => {
          const hName = m.home.toLowerCase();
          const aName = m.away.toLowerCase();
          const mDate = new Date(m.date);
          const timeDiff = Math.abs(mDate.getTime() - gameDateOdds.getTime());
          const nameMatch =
            (hName.includes(homeNameOdds.split(' ')[0]) || homeNameOdds.includes(hName.split(' ')[0])) &&
            (aName.includes(awayNameOdds.split(' ')[0]) || awayNameOdds.includes(aName.split(' ')[0]));
          return nameMatch && timeDiff < 86_400_000;
        });

        if (!espnMatch) continue;

        const bm     = game.bookmakers?.[0];
        const market = bm?.markets?.find((mk: any) => mk.key === 'h2h');
        if (!market) continue;

        const outcomes: any[] = market.outcomes ?? [];
        const homeO = outcomes.find((o: any) =>
          o.name?.toLowerCase().includes(homeNameOdds.split(' ')[0]))?.price;
        const awayO = outcomes.find((o: any) =>
          o.name?.toLowerCase().includes(awayNameOdds.split(' ')[0]))?.price;
        const drawO = outcomes.find((o: any) => o.name === 'Draw')?.price;

        if (homeO && awayO) {
          map.set(espnMatch.id, {
            home:   +homeO.toFixed(2),
            draw:   +(drawO ?? 3.40).toFixed(2),
            away:   +awayO.toFixed(2),
            source: bm.title ?? 'Bookmaker',
          });
        }
      }

      if (map.size > 0) break; // found the right sport key
    } catch {
      break;
    }
  }

  return map;
}

/* ─── Route handler ──────────────────────────────────────────────────── */
export async function GET() {
  const [rawMatches, groups] = await Promise.all([espnScoreboard(), espnStandings()]);

  const oddsMap = await fetchOdds(rawMatches);

  const matches: WCMatch[] = rawMatches.map(m => {
    const odds = oddsMap.get(m.id);
    return odds ? { ...m, oddsHome: odds.home, oddsDraw: odds.draw, oddsAway: odds.away, oddsSource: odds.source } : m;
  });

  const liveCount  = matches.filter(m => m.status === 'live' || m.status === 'halftime').length;
  const todayCount = matches.filter(m => isToday(m.date)).length;

  return NextResponse.json(
    { matches, groups, hasOdds: !!ODDS_KEY, liveCount, todayCount, updatedAt: Date.now() } as WCData,
    { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=15' } }
  );
}
