import { Card, Suit } from './card/card';
import { RoundResult } from './truco-types';

const SPECIAL_POWERS = new Map<string, number>([
  [`1-${Suit.Swords}`, 14],
  [`1-${Suit.Clubs}`, 13],
  [`7-${Suit.Swords}`, 12],
  [`7-${Suit.Coins}`, 11],
]);

const RANK_POWERS = new Map<number, number>([
  [3, 10],
  [2, 9],
  [1, 8],
  [12, 7],
  [11, 6],
  [7, 5],
  [6, 4],
  [5, 3],
  [4, 2],
]);

export class RoundResolver {

  public static resolveRound(player0Card: Card, player1Card: Card): RoundResult {
    const result = RoundResolver.compareCards(player0Card, player1Card);
    return result > 0
      ? RoundResult.Player0
      : result < 0
        ? RoundResult.Player1
        : RoundResult.Parda;
  }

  private static compareCards(card1: Card, card2: Card): number {
    const power1 = RoundResolver.getTrucoPower(card1);
    const power2 = RoundResolver.getTrucoPower(card2);
    return power1 - power2;
  }

  private static getTrucoPower(card: Card): number {
    return (
      SPECIAL_POWERS.get(`${card.numericValue}-${card.suit}`) ??
      RANK_POWERS.get(card.numericValue) ??
      0
    );
  }
}
