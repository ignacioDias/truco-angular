import { Card } from './card/card';

export const PlayerId = {
  Player0: 0,
  Player1: 1,
} as const;

export type PlayerId = (typeof PlayerId)[keyof typeof PlayerId];

export const RoundResult = {
  Player0: PlayerId.Player0,
  Player1: PlayerId.Player1,
  Parda: 'parda',
} as const;

export type RoundResult = (typeof RoundResult)[keyof typeof RoundResult];

export const EnvidoCall = {
  None: 'none',
  Envido: 'envido',
  RealEnvido: 'realEnvido',
  FaltaEnvido: 'faltaEnvido',
} as const;

export type EnvidoCall = (typeof EnvidoCall)[keyof typeof EnvidoCall];

export const TrucoCall = {
  None: 'none',
  Truco: 'truco',
  ReTruco: 'reTruco',
  ValeCuatro: 'valeCuatro',
} as const;

export type TrucoCall = (typeof TrucoCall)[keyof typeof TrucoCall];

export type PlayedCards = [
  [Card | null, Card | null],
  [Card | null, Card | null],
  [Card | null, Card | null],
];

export const opponentOf = (playerId: PlayerId): PlayerId =>
  playerId === PlayerId.Player0 ? PlayerId.Player1 : PlayerId.Player0;
