import { Card } from './card/card';

export type EnvidoCall = 'none' | 'envido' | 'dobleEnvido' | 'realEnvido' | 'faltaEnvido';
export type TrucoCall = 'none' | 'truco' | 'reTruco' | 'valeCuatro';
export type PlayedCards = [
  [Card | null, Card | null],
  [Card | null, Card | null],
  [Card | null, Card | null],
];
