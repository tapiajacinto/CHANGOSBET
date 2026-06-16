import { FootballState, FootballMatch, FootballTeam, FootballBet, FootballEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TEAMS: FootballTeam[] = [
  { name: 'Real Madrid', shortName: 'RMA', strength: 96, league: 'La Liga' },
  { name: 'Manchester City', shortName: 'MCI', strength: 95, league: 'Premier League' },
  { name: 'Bayern Munich', shortName: 'BAY', strength: 93, league: 'Bundesliga' },
  { name: 'PSG', shortName: 'PSG', strength: 91, league: 'Ligue 1' },
  { name: 'Barcelona', shortName: 'BAR', strength: 90, league: 'La Liga' },
  { name: 'Arsenal', shortName: 'ARS', strength: 89, league: 'Premier League' },
  { name: 'Inter Milan', shortName: 'INT', strength: 88, league: 'Serie A' },
  { name: 'Liverpool', shortName: 'LIV', strength: 88, league: 'Premier League' },
  { name: 'Atletico Madrid', shortName: 'ATL', strength: 85, league: 'La Liga' },
  { name: 'Borussia Dortmund', shortName: 'BVB', strength: 85, league: 'Bundesliga' },
  { name: 'Chelsea', shortName: 'CHE', strength: 82, league: 'Premier League' },
  { name: 'AC Milan', shortName: 'ACM', strength: 82, league: 'Serie A' },
  { name: 'Juventus', shortName: 'JUV', strength: 81, league: 'Serie A' },
  { name: 'Manchester United', shortName: 'MUN', strength: 78, league: 'Premier League' },
  { name: 'Tottenham', shortName: 'TOT', strength: 75, league: 'Premier League' },
  { name: 'Monaco', shortName: 'MON', strength: 74, league: 'Ligue 1' },
  { name: 'Sevilla', shortName: 'SEV', strength: 72, league: 'La Liga' },
  { name: 'Marseille', shortName: 'MAR', strength: 71, league: 'Ligue 1' },
];

function pickTeams(n: number): FootballTeam[] {
  const shuffled = [...TEAMS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function calcOdds(home: FootballTeam, away: FootballTeam): { home: number; draw: number; away: number } {
  const diff = home.strength - away.strength;
  const homeBase = 1 / (0.45 + diff * 0.004);
  const awayBase = 1 / (0.3 - diff * 0.004);
  const drawBase = 1 / 0.27;

  const total = 1 / homeBase + 1 / awayBase + 1 / drawBase;
  const margin = 1.05;

  return {
    home: Math.round((homeBase * total * margin) * 100) / 100,
    draw: Math.round((drawBase * total * margin) * 100) / 100,
    away: Math.round((awayBase * total * margin) * 100) / 100,
  };
}

function generateMatches(count: number): FootballMatch[] {
  const teams = pickTeams(count * 2);
  const matches: FootballMatch[] = [];

  for (let i = 0; i < count; i++) {
    const home = teams[i * 2];
    const away = teams[i * 2 + 1];
    const odds = calcOdds(home, away);

    matches.push({
      id: uuidv4(),
      home,
      away,
      homeOdds: odds.home,
      drawOdds: odds.draw,
      awayOdds: odds.away,
      overOdds: 1.85,
      underOdds: 1.95,
      bttsYesOdds: 1.72,
      bttsNoOdds: 2.0,
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      status: 'upcoming',
      events: [],
    });
  }
  return matches;
}

export function createFootballState(): FootballState {
  return {
    phase: 'betting',
    matches: generateMatches(6),
    bets: [],
    bettingTimeLeft: 25,
  };
}

export function simulateMatch(match: FootballMatch): FootballEvent[] {
  const events: FootballEvent[] = [];
  const homeStrength = match.home.strength;
  const awayStrength = match.away.strength;
  const total = homeStrength + awayStrength;

  const expectedGoals = 2.5 + (Math.random() - 0.5) * 1.5;
  const goals = Math.round(Math.random() * expectedGoals + 0.5);

  const minutes = Array.from({ length: goals }, () => Math.floor(Math.random() * 90) + 1).sort((a, b) => a - b);

  for (const minute of minutes) {
    const isHome = Math.random() < homeStrength / total;
    const team = isHome ? 'home' : 'away';
    const scorer = isHome ? match.home.shortName : match.away.shortName;

    events.push({
      minute,
      type: 'goal',
      team,
      description: `⚽ GOAL! ${scorer} scores at ${minute}'`,
    });

    if (isHome) match.homeScore++;
    else match.awayScore++;
  }

  if (Math.random() < 0.3) {
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type: 'yellow_card',
      team: Math.random() < 0.5 ? 'home' : 'away',
      description: '🟨 Yellow card',
    });
  }

  match.status = 'finished';
  match.minute = 90;
  return events.sort((a, b) => a.minute - b.minute);
}

export function resolveFootballBets(
  bets: FootballBet[],
  matches: FootballMatch[]
): Map<string, number> {
  const winnings = new Map<string, number>();

  for (const bet of bets) {
    const match = matches.find(m => m.id === bet.matchId);
    if (!match || match.status !== 'finished') continue;

    const { homeScore, awayScore } = match;
    let won = false;

    switch (bet.betType) {
      case '1': won = homeScore > awayScore; break;
      case 'X': won = homeScore === awayScore; break;
      case '2': won = awayScore > homeScore; break;
      case 'over': won = homeScore + awayScore > 2.5; break;
      case 'under': won = homeScore + awayScore < 2.5; break;
      case 'bttsYes': won = homeScore > 0 && awayScore > 0; break;
      case 'bttsNo': won = homeScore === 0 || awayScore === 0; break;
    }

    if (won) {
      const payout = Math.round(bet.amount * bet.odds);
      winnings.set(bet.playerId, (winnings.get(bet.playerId) ?? 0) + payout);
    }
  }

  return winnings;
}

export function resetFootballState(state: FootballState): void {
  state.phase = 'betting';
  state.matches = generateMatches(6);
  state.bets = [];
  state.bettingTimeLeft = 25;
}
