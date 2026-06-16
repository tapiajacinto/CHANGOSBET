import { NextResponse } from 'next/server';

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUES = [
  { espnSport: 'soccer',     espnLeague: 'eng.1',  name: 'Premier League',  emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'esp.1',  name: 'La Liga',          emoji: '🇪🇸', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'ger.1',  name: 'Bundesliga',       emoji: '🇩🇪', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'ita.1',  name: 'Serie A',          emoji: '🇮🇹', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'fra.1',  name: 'Ligue 1',          emoji: '🇫🇷', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'arg.1',  name: 'Liga Argentina',   emoji: '🇦🇷', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'usa.1',  name: 'MLS',              emoji: '🇺🇸', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'bra.1',  name: 'Brasileirão',      emoji: '🇧🇷', sportId: 'football'   },
  { espnSport: 'soccer',     espnLeague: 'uefa.champions', name: 'Champions League', emoji: '⭐', sportId: 'football' },
  { espnSport: 'basketball', espnLeague: 'nba',    name: 'NBA',              emoji: '🏀', sportId: 'basketball' },
  { espnSport: 'baseball',   espnLeague: 'mlb',    name: 'MLB',              emoji: '⚾', sportId: 'baseball'   },
  { espnSport: 'hockey',     espnLeague: 'nhl',    name: 'NHL',              emoji: '🏒', sportId: 'hockey'     },
  { espnSport: 'football',   espnLeague: 'nfl',    name: 'NFL',              emoji: '🏈', sportId: 'nfl'        },
  { espnSport: 'tennis',     espnLeague: 'tennis', name: 'Tenis ATP/WTA',   emoji: '🎾', sportId: 'tennis'     },
];

type MatchStatus = 'live' | 'final' | 'scheduled' | 'halftime';

export interface RealMatch {
  id: string;
  home: string;
  homeShort: string;
  homeScore: string | null;
  away: string;
  awayShort: string;
  awayScore: string | null;
  status: MatchStatus;
  clock: string | null;
  period: number | null;
  date: string;
}

export interface RealLeague {
  id: string;         // e.g. "eng.1"
  name: string;
  emoji: string;
  sportId: string;
  matches: RealMatch[];
}

function parseStatus(name: string): MatchStatus {
  if (name.includes('IN_PROGRESS')) return 'live';
  if (name.includes('HALFTIME'))    return 'halftime';
  if (name.includes('FINAL'))       return 'final';
  return 'scheduled';
}

function parseEvent(event: any): RealMatch {
  const comp  = event.competitions?.[0] ?? {};
  const comps = comp.competitors ?? [];
  const home  = comps.find((c: any) => c.homeAway === 'home') ?? comps[0] ?? {};
  const away  = comps.find((c: any) => c.homeAway === 'away') ?? comps[1] ?? {};

  return {
    id:         event.id ?? String(Math.random()),
    home:       home.team?.displayName ?? home.team?.name ?? 'Local',
    homeShort:  home.team?.abbreviation ?? home.team?.shortDisplayName ?? '---',
    homeScore:  home.score ?? null,
    away:       away.team?.displayName ?? away.team?.name ?? 'Visitante',
    awayShort:  away.team?.abbreviation ?? away.team?.shortDisplayName ?? '---',
    awayScore:  away.score ?? null,
    status:     parseStatus(event.status?.type?.name ?? ''),
    clock:      event.status?.displayClock ?? null,
    period:     event.status?.period ?? null,
    date:       event.date ?? new Date().toISOString(),
  };
}

async function fetchLeague(espnSport: string, espnLeague: string): Promise<RealMatch[]> {
  try {
    const url = espnLeague === 'tennis'
      ? `${ESPN}/tennis/scoreboard`
      : `${ESPN}/${espnSport}/${espnLeague}/scoreboard`;

    const res = await fetch(url, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.events ?? []).slice(0, 12).map(parseEvent);
  } catch {
    return [];
  }
}

export async function GET() {
  const settled = await Promise.allSettled(
    LEAGUES.map(async (l): Promise<RealLeague> => {
      const matches = await fetchLeague(l.espnSport, l.espnLeague);
      return { id: l.espnLeague, name: l.name, emoji: l.emoji, sportId: l.sportId, matches };
    })
  );

  const leagues: RealLeague[] = (
    settled.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<RealLeague>[]
  ).map(r => r.value);

  const liveCount = leagues.reduce(
    (n, l) => n + l.matches.filter(m => m.status === 'live' || m.status === 'halftime').length,
    0
  );

  return NextResponse.json(
    { leagues, liveCount, updatedAt: Date.now() },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
  );
}
