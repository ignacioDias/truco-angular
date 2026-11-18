import { Card, Suit } from '../card/card';
import { PlayedCards, RoundResult, TrucoCall } from '../truco-types';

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

  public static resolveHand(playedCards: PlayedCards): number {
    var player0Points = 0;
    var player1Points = 0;
    for (let i = 0; i < 3; i++) {
      const cardsComparation = RoundResolver.compareCards(playedCards[i][0], playedCards[i][1]);
      if (cardsComparation > 0) {
        player0Points++;
      } else if (cardsComparation < 0) {
        player1Points++;
      }
    }
    return player0Points - player1Points;
  }

  public static resolveRound(player0Card: Card | null, player1Card: Card | null): RoundResult {
    const result = RoundResolver.compareCards(player0Card, player1Card);
    return result > 0 ? RoundResult.Player0 : result < 0 ? RoundResult.Player1 : RoundResult.Parda;
  }

  private static compareCards(card1: Card | null, card2: Card | null): number {
    if (card1 === null && card2 === null) return 0;
    if (card1 === null) return -1;
    if (card2 === null) return 1;

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
