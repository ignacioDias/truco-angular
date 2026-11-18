import { Card, Suit } from './card/card';
import { RoundResolver } from './round-resolver';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

describe('RoundResolver', () => {
  describe('resolveRound', () => {
    it('returns 0 when the first card is stronger', () => {
      expect(
        RoundResolver.resolveRound(card(3, Suit.Cups), card(2, Suit.Cups)),
      ).toBe(0);
    });

    it('returns 1 when the second card is stronger', () => {
      expect(
        RoundResolver.resolveRound(card(2, Suit.Cups), card(3, Suit.Cups)),
      ).toBe(1);
    });

    it('returns parda when both cards have the same power', () => {
      expect(
        RoundResolver.resolveRound(card(3, Suit.Cups), card(3, Suit.Coins)),
      ).toBe('parda');
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

        expect(RoundResolver.resolveRound(stronger, weaker)).toBe(0);
        expect(RoundResolver.resolveRound(weaker, stronger)).toBe(1);
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
        expect(RoundResolver.resolveRound(first, second)).toBe('parda');
      }
    });

    it('ranks the special 1s above the other 1s', () => {
      const oneOfSwords = card(1, Suit.Swords);
      const oneOfClubs = card(1, Suit.Clubs);
      const oneOfCoins = card(1, Suit.Coins);

      expect(RoundResolver.resolveRound(oneOfSwords, oneOfClubs)).toBe(0);
      expect(RoundResolver.resolveRound(oneOfClubs, oneOfCoins)).toBe(0);
      expect(RoundResolver.resolveRound(oneOfCoins, oneOfSwords)).toBe(1);
    });

    it('ranks the special 7s above the other 7s', () => {
      const sevenOfSwords = card(7, Suit.Swords);
      const sevenOfCoins = card(7, Suit.Coins);
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(sevenOfSwords, sevenOfCoins)).toBe(0);
      expect(RoundResolver.resolveRound(sevenOfCoins, sevenOfCups)).toBe(0);
      expect(RoundResolver.resolveRound(sevenOfCups, sevenOfSwords)).toBe(1);
    });

    it('places the special 7s below 3, 2, 1 and above 6', () => {
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(sevenOfCups, card(3, Suit.Coins))).toBe(1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(2, Suit.Coins))).toBe(1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(1, Suit.Coins))).toBe(1);
      expect(RoundResolver.resolveRound(sevenOfCups, card(6, Suit.Coins))).toBe(0);
    });

    it('places 12 and 11 between the 1s and the 7s', () => {
      const oneOfCups = card(1, Suit.Cups);
      const twelve = card(12, Suit.Swords);
      const eleven = card(11, Suit.Swords);
      const sevenOfCups = card(7, Suit.Cups);

      expect(RoundResolver.resolveRound(oneOfCups, twelve)).toBe(0);
      expect(RoundResolver.resolveRound(twelve, eleven)).toBe(0);
      expect(RoundResolver.resolveRound(eleven, sevenOfCups)).toBe(0);
    });
  });
});
