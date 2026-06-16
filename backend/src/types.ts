export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  rank: Rank;
  suit: Suit;
  faceUp: boolean;
}

export interface Player {
  socketId: string;
  alias: string;
  balance: number;
  userId?: string;
}

export interface ChatMessage {
  alias: string;
  message: string;
  timestamp: number;
}

export type GameType = 'roulette' | 'blackjack' | 'poker' | 'horses' | 'football';

export interface Room {
  code: string;
  name: string;
  game: GameType;
  hostId: string;
  players: Map<string, Player>;
  chat: ChatMessage[];
  gameState: RouletteState | BlackjackState | PokerState | HorsesState | FootballState | null;
  status: 'lobby' | 'playing';
}

// ─── Roulette ────────────────────────────────────────────────────────────────
export type RouletteBetType =
  | 'straight' | 'red' | 'black' | 'odd' | 'even'
  | 'low' | 'high' | 'dozen1' | 'dozen2' | 'dozen3'
  | 'col1' | 'col2' | 'col3' | 'split' | 'street'
  | 'corner' | 'sixline';

export interface RouletteBet {
  playerId: string;
  type: RouletteBetType;
  numbers: number[];
  amount: number;
}

export interface RouletteState {
  phase: 'betting' | 'spinning' | 'result';
  bets: RouletteBet[];
  winningNumber: number | null;
  bettingTimeLeft: number;
}

// ─── Blackjack ───────────────────────────────────────────────────────────────
export type BlackjackPlayerStatus = 'betting' | 'waiting' | 'playing' | 'standing' | 'bust' | 'blackjack' | 'done';

export interface BlackjackPlayer {
  socketId: string;
  alias: string;
  balance: number;
  hand: Card[];
  bet: number;
  status: BlackjackPlayerStatus;
  seatIndex: number;
}

export interface BlackjackState {
  phase: 'betting' | 'playing' | 'dealer' | 'results';
  deck: Card[];
  dealerHand: Card[];
  players: Map<string, BlackjackPlayer>;
  currentPlayerSocketId: string | null;
  bettingTimeLeft: number;
}

// ─── Poker ───────────────────────────────────────────────────────────────────
export type PokerPhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type PokerAction = 'fold' | 'check' | 'call' | 'raise' | 'allin';

export interface PokerPlayer {
  socketId: string;
  alias: string;
  balance: number;
  holeCards: Card[];
  bet: number;
  totalBetThisHand: number;
  folded: boolean;
  allIn: boolean;
  seatIndex: number;
  isActive: boolean;
  lastAction: PokerAction | null;
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[];
}

export interface PokerState {
  phase: PokerPhase;
  deck: Card[];
  communityCards: Card[];
  pot: number;
  sidePots: SidePot[];
  currentBet: number;
  minRaise: number;
  currentPlayerSocketId: string | null;
  dealerIndex: number;
  smallBlindAmount: number;
  bigBlindAmount: number;
  players: Map<string, PokerPlayer>;
  actionsThisRound: number;
  lastRaiserSocketId: string | null;
  winners: { socketId: string; alias: string; amount: number; handName: string }[];
}

// ─── Horses ──────────────────────────────────────────────────────────────────
export interface Horse {
  id: number;
  name: string;
  odds: number;
  color: string;
  speed: number;
  position: number;
}

export interface HorseBet {
  playerId: string;
  horseId: number;
  amount: number;
}

export interface HorsesState {
  phase: 'betting' | 'racing' | 'result';
  horses: Horse[];
  bets: HorseBet[];
  winnerId: number | null;
  bettingTimeLeft: number;
  raceProgress: number[];
}

// ─── Football ─────────────────────────────────────────────────────────────────
export interface FootballTeam {
  name: string;
  shortName: string;
  strength: number;
  league: string;
}

export interface FootballMatch {
  id: string;
  home: FootballTeam;
  away: FootballTeam;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  overOdds: number;
  underOdds: number;
  bttsYesOdds: number;
  bttsNoOdds: number;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: 'upcoming' | 'live' | 'finished';
  events: FootballEvent[];
}

export type FootballBetType = '1' | 'X' | '2' | 'over' | 'under' | 'bttsYes' | 'bttsNo';

export interface FootballBet {
  playerId: string;
  matchId: string;
  betType: FootballBetType;
  amount: number;
  odds: number;
}

export interface FootballEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'penalty' | 'var';
  team: 'home' | 'away';
  description: string;
}

export interface FootballState {
  phase: 'betting' | 'live' | 'result';
  matches: FootballMatch[];
  bets: FootballBet[];
  bettingTimeLeft: number;
}
