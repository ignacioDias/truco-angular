import { Card, Suit } from './card/card';
import { RoundResolver } from './round-resolver';
import { RoundResult } from './truco-types';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

describe('RoundResolver', () => {
  describe('resolveRound', () => {
    it('returns 0 when the first card is stronger', () => {
      expect(
        RoundResolver.resolveRound(card(3, Suit.Cups), card(2, Suit.Cups)),
      ).toBe(RoundResult.Player0);
    });

    it('returns 1 when the second card is stronger', () => {
      expect(
        RoundResolver.resolveRound(card(2, Suit.Cups), card(3, Suit.Cups)),
      ).toBe(RoundResult.Player1);
    });

    it('returns parda when both cards have the same power', () => {
      expect(
        RoundResolver.resolveRound(card(3, Suit.Cups), card(3, Suit.Coins)),
      ).toBe(RoundResult.Parda);
    });
  });

  describe('truco hierarchy', () => {
    const strongestToWeakest = [
      card(1, Suit.Swords),
      card(1, Suit.Clubs),
      card(7, Suit.Swords),
      card(7, Suit.Coins),
      card(3, Suit.Cups),
      card(2, Suit.Cups),
      card(1, Suit.Cups),
      card(12, Suit.Cups),
      card(11, Suit.Cups),
      card(7, Suit.Cups),
      card(6, Suit.Cups),
      card(5, Suit.Cups),
      card(4, Suit.Cups),
    ];

    it('orders every power level from strongest to weakest', () => {
      for (let index = 0; index < strongestToWeakest.length - 1; index++) {
        const stronger = strongestToWeakest[index];
        const weaker = strongestToWeakest[index + 1];

        expect(RoundResolver.resolveRound(stronger, weaker)).toBe(RoundResult.Player0);
        expect(RoundResolver.resolveRound(weaker, stronger)).toBe(RoundResult.Player1);
      }
    });

    it('gives the same power to cards of different suits with the same rank', () => {
      const samePowerPairs: [Card, Card][] = [
        [card(3, Suit.Swords), card(3, Suit.Clubs)],
        [card(3, Suit.Coins), card(3, Suit.Cups)],
        [card(2, Suit.Swords), card(2, Suit.Coins)],
        [card(1, Suit.Coins), card(1, Suit.Cups)],
        [card(7, Suit.Clubs), card(7, Suit.Cups)],
        [card(12, Suit.Swords), card(12, Suit.Coins)],
        [card(11, Suit.Swords), card(11, Suit.Cups)],
        [card(6, Suit.Clubs), card(6, Suit.Swords)],
        [card(5, Suit.Coins), card(5, Suit.Cups)],
        [card(4, Suit.Swords), card(4, Suit.Clubs)],
      ];

      for (const [first, second] of samePowerPairs) {
        expect(RoundResolver.resolveRound(first, second)).toBe(RoundResult.Parda);
      }
    });

    it('ranks the special 1s above the other 1s', () => {
      const oneOfSwords = card(1, Suit.Swords);
      const oneOfClubs = card(1, Suit.Clubs);
      const oneOfCoins = card(1, Suit.Coins);

      expect(RoundResolver.resolveRound(oneOfSwords, oneOfClubs)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(oneOfClubs, oneOfCoins)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(oneOfCoins, oneOfSwords)).toBe(RoundResult.Player1);
    });

    it('ranks the special 7s above the other 7s', () => {
      const sevenOfSwords = card(7, Suit.Swords);
      const sevenOfCoins = card(7, Suit.Coins);
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(sevenOfSwords, sevenOfCoins)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(sevenOfCoins, sevenOfCups)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(sevenOfCups, sevenOfSwords)).toBe(RoundResult.Player1);
    });

    it('places the special 7s below 3, 2, 1 and above 6', () => {
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(sevenOfCups, card(3, Suit.Coins))).toBe(RoundResult.Player1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(2, Suit.Coins))).toBe(RoundResult.Player1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(1, Suit.Coins))).toBe(RoundResult.Player1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(6, Suit.Coins))).toBe(RoundResult.Player0);
    });

    it('places 12 and 11 between the 1s and the 7s', () => {
      const oneOfCups = card(1, Suit.Cups);
      const twelve = card(12, Suit.Swords);
      const eleven = card(11, Suit.Swords);
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(oneOfCups, twelve)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(twelve, eleven)).toBe(RoundResult.Player0);
      expect(RoundResolver.resolveRound(eleven, sevenOfCups)).toBe(RoundResult.Player0);
    });
  });
});
