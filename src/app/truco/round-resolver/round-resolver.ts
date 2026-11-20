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

  /**
   * Returns a positive number when player 0 wins the hand, a negative number when
   * player 1 wins it, and 0 when every round was a parda (the mano wins).
   *
   * The player with more rounds wins. On a tie (one round each, the other being a
   * parda) the winner of the first decided round wins the hand.
   */
  public static resolveHand(playedCards: PlayedCards): number {
    let player0Rounds = 0;
    let player1Rounds = 0;
    let firstDecidedRound = 0;
    for (let i = 0; i < 3; i++) {
      const roundResult = Math.sign(RoundResolver.compareCards(playedCards[i][0], playedCards[i][1]));
      if (roundResult > 0) {
        player0Rounds++;
      } else if (roundResult < 0) {
        player1Rounds++;
      }
      if (firstDecidedRound === 0) {
        firstDecidedRound = roundResult;
      }
    }
    if (player0Rounds !== player1Rounds) {
      return player0Rounds - player1Rounds;
    }
    return firstDecidedRound;
  }

  /**
   * Tells whether the hand is over once `completedRounds` rounds have been played.
   * After the second round the hand is over when:
   * - the first round was a parda and the second one was not,
   * - the first round was won and the second one was a parda or won by the same player.
   * Otherwise the third round decides it.
   */
  public static isHandResolved(playedCards: PlayedCards, completedRounds: number): boolean {
    if (completedRounds >= 3) {
      return true;
    }
    if (completedRounds < 2) {
      return false;
    }
    const firstRound = Math.sign(RoundResolver.compareCards(playedCards[0][0], playedCards[0][1]));
    const secondRound = Math.sign(RoundResolver.compareCards(playedCards[1][0], playedCards[1][1]));
    if (firstRound === 0) {
      return secondRound !== 0;
    }
    return secondRound === 0 || secondRound === firstRound;
  }

  public static resolveRound(player0Card: Card | null, player1Card: Card | null): RoundResult {
    const result = RoundResolver.compareCards(player0Card, player1Card);
    return result > 0 ? RoundResult.Player0 : result < 0 ? RoundResult.Player1 : RoundResult.Parda;
  }

  public static compareCards(card1: Card | null, card2: Card | null): number {
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
