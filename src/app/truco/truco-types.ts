import { Card } from './card/card';

export type PlayerId = 0 | 1;
export type RoundResult = 0 | 1 | 'parda';

export type EnvidoCall = 'none' | 'envido' | 'realEnvido' | 'faltaEnvido';
export type TrucoCall = 'none' | 'truco' | 'reTruco' | 'valeCuatro';
export type PlayedCards = [
  [Card | null, Card | null],
  [Card | null, Card | null],
  [Card | null, Card | null],
];

export const opponentOf = (playerId: PlayerId): PlayerId =>
  playerId === 0 ? 1 : 0;
