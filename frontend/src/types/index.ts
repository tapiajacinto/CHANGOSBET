export type Suit = 'clubs' | 'diamonds' | 'hearts' | 'spades' | 'back';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 0;

export interface Card {
  rank: Rank;
  suit: Suit;
  faceUp: boolean;
}

export interface PlayerInfo {
  socketId: string;
  alias: string;
  balance: number;
}

export interface ChatMessage {
  alias: string;
  message: string;
  timestamp: number;
}

export interface RoomInfo {
  code: string;
  name: string;
  game: GameType;
  hostId: string;
  status: 'lobby' | 'playing';
  players: PlayerInfo[];
  chat: ChatMessage[];
}

export type GameType = 'roulette' | 'blackjack' | 'poker' | 'horses' | 'football';

// ─── Roulette ─────────────────────────────────────────────────────────────────
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

// ─── Blackjack ────────────────────────────────────────────────────────────────
export type BJPlayerStatus = 'betting' | 'waiting' | 'playing' | 'standing' | 'bust' | 'blackjack' | 'done';

export interface BJPlayer {
  socketId: string;
  alias: string;
  balance: number;
  hand: Card[];
  bet: number;
  status: BJPlayerStatus;
  seatIndex: number;
}

export interface BlackjackState {
  phase: 'betting' | 'playing' | 'dealer' | 'results';
  bettingTimeLeft: number;
  dealerHand: Card[];
  currentPlayerSocketId: string | null;
  players: BJPlayer[];
}

// ─── Poker ────────────────────────────────────────────────────────────────────
export type PokerPhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface PokerPlayer {
  socketId: string;
  alias: string;
  balance: number;
  bet: number;
  folded: boolean;
  allIn: boolean;
  seatIndex: number;
  lastAction: string | null;
  holeCards: Card[];
  handSize: number;
}

export interface PokerWinner {
  socketId: string;
  alias: string;
  amount: number;
  handName: string;
}

export interface PokerState {
  phase: PokerPhase;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  minRaise: number;
  bigBlindAmount: number;
  currentPlayerSocketId: string | null;
  winners: PokerWinner[];
  players: PokerPlayer[];
}

// ─── Horses ───────────────────────────────────────────────────────────────────
export interface Horse {
  id: number;
  name: string;
  odds: number;
  color: string;
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
}

// ─── Football ─────────────────────────────────────────────────────────────────
export interface FootballTeam {
  name: string;
  shortName: string;
  strength: number;
  league: string;
}

export interface FootballEvent {
  minute: number;
  type: string;
  team: 'home' | 'away';
  description: string;
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

export interface FootballState {
  phase: 'betting' | 'live' | 'result';
  matches: FootballMatch[];
  bets: FootballBet[];
  bettingTimeLeft: number;
}
