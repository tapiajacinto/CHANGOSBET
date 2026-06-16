import { Room, Player, GameType } from '../types';
import { v4 as uuidv4 } from 'uuid';

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateCode() : code;
}

export function createRoom(name: string, game: GameType, hostId: string): Room {
  const code = generateCode();
  const room: Room = {
    code,
    name,
    game,
    hostId,
    players: new Map(),
    chat: [],
    gameState: null,
    status: 'lobby',
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function addPlayerToRoom(
  code: string,
  socketId: string,
  alias: string,
  userId?: string
): Player | null {
  const room = rooms.get(code);
  if (!room) return null;

  const player: Player = {
    socketId,
    alias,
    balance: 100000,
    userId,
  };

  room.players.set(socketId, player);
  return player;
}

export function removePlayerFromRoom(code: string, socketId: string): void {
  const room = rooms.get(code);
  if (!room) return;
  room.players.delete(socketId);
  if (room.players.size === 0) {
    deleteRoom(code);
  }
}

export function getPlayerBalance(code: string, socketId: string): number {
  return rooms.get(code)?.players.get(socketId)?.balance ?? 0;
}

export function updatePlayerBalance(code: string, socketId: string, delta: number): number {
  const room = rooms.get(code);
  if (!room) return 0;
  const player = room.players.get(socketId);
  if (!player) return 0;
  player.balance = Math.max(0, player.balance + delta);
  return player.balance;
}

export function reloadPlayerBalance(code: string, socketId: string): number {
  const room = rooms.get(code);
  if (!room) return 0;
  const player = room.players.get(socketId);
  if (!player) return 0;
  player.balance = 100000;
  return player.balance;
}

export function addChatMessage(code: string, alias: string, message: string): void {
  const room = rooms.get(code);
  if (!room) return;
  room.chat.push({ alias, message, timestamp: Date.now() });
  if (room.chat.length > 100) room.chat.shift();
}

export function getRoomPublicState(room: Room) {
  return {
    code: room.code,
    name: room.name,
    game: room.game,
    hostId: room.hostId,
    status: room.status,
    players: [...room.players.values()].map((p) => ({
      socketId: p.socketId,
      alias: p.alias,
      balance: p.balance,
    })),
    chat: room.chat,
  };
}
