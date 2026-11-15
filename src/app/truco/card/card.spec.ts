import { Card, Suit } from './card';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

const compare = (first: Card, second: Card): number =>
  first.compareCards(first, second);

describe('Card', () => {
  describe('constructor', () => {
    it('stores the numeric value and suit', () => {
      const created = new Card(3, Suit.Swords);

      expect(created.numericValue).toBe(3);
      expect(created.suit).toBe(Suit.Swords);
    });
  });

  describe('compareCards', () => {
    it('returns a positive number when the first card is stronger', () => {
      expect(compare(card(3, Suit.Cups), card(2, Suit.Cups))).toBeGreaterThan(
        0,
      );
    });

    it('returns a negative number when the first card is weaker', () => {
      expect(compare(card(2, Suit.Cups), card(3, Suit.Cups))).toBeLessThan(0);
    });

    it('returns zero when both cards have the same power', () => {
      expect(compare(card(3, Suit.Cups), card(3, Suit.Coins))).toBe(0);
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

        expect(compare(stronger, weaker)).toBeGreaterThan(0);
        expect(compare(weaker, stronger)).toBeLessThan(0);
      }
    });

    it('gives the same power to cards of different suits with the same rank', () => {
      expect(compare(card(3, Suit.Swords), card(3, Suit.Clubs))).toBe(0);
      expect(compare(card(3, Suit.Coins), card(3, Suit.Cups))).toBe(0);
      expect(compare(card(2, Suit.Swords), card(2, Suit.Coins))).toBe(0);
      expect(compare(card(1, Suit.Coins), card(1, Suit.Cups))).toBe(0);
      expect(compare(card(7, Suit.Clubs), card(7, Suit.Cups))).toBe(0);
      expect(compare(card(12, Suit.Swords), card(12, Suit.Coins))).toBe(0);
      expect(compare(card(11, Suit.Swords), card(11, Suit.Cups))).toBe(0);
      expect(compare(card(6, Suit.Clubs), card(6, Suit.Swords))).toBe(0);
      expect(compare(card(5, Suit.Coins), card(5, Suit.Cups))).toBe(0);
      expect(compare(card(4, Suit.Swords), card(4, Suit.Clubs))).toBe(0);
    });

    it('ranks the special 1s above the other 1s', () => {
      const oneOfSwords = card(1, Suit.Swords);
      const oneOfClubs = card(1, Suit.Clubs);
      const oneOfCoins = card(1, Suit.Coins);

      expect(compare(oneOfSwords, oneOfClubs)).toBeGreaterThan(0);
      expect(compare(oneOfClubs, oneOfCoins)).toBeGreaterThan(0);
      expect(compare(oneOfCoins, oneOfSwords)).toBeLessThan(0);
    });

    it('ranks the special 7s above the other 7s', () => {
      const sevenOfSwords = card(7, Suit.Swords);
      const sevenOfCoins = card(7, Suit.Coins);
      const sevenOfCups = card(7, Suit.Cups);

      expect(compare(sevenOfSwords, sevenOfCoins)).toBeGreaterThan(0);
      expect(compare(sevenOfCoins, sevenOfCups)).toBeGreaterThan(0);
      expect(compare(sevenOfCups, sevenOfSwords)).toBeLessThan(0);
    });

    it('places the special 7s below 3, 2, 1 and above 6', () => {
      const sevenOfCups = card(7, Suit.Cups);

      expect(compare(sevenOfCups, card(3, Suit.Coins))).toBeLessThan(0);
      expect(compare(sevenOfCups, card(2, Suit.Coins))).toBeLessThan(0);
      expect(compare(sevenOfCups, card(1, Suit.Coins))).toBeLessThan(0);
      expect(compare(sevenOfCups, card(6, Suit.Coins))).toBeGreaterThan(0);
    });

    it('places 12 and 11 between the 1s and the 7s', () => {
      const oneOfCups = card(1, Suit.Cups);
      const twelve = card(12, Suit.Swords);
      const eleven = card(11, Suit.Swords);
      const sevenOfCups = card(7, Suit.Cups);

      expect(compare(oneOfCups, twelve)).toBeGreaterThan(0);
      expect(compare(twelve, eleven)).toBeGreaterThan(0);
      expect(compare(eleven, sevenOfCups)).toBeGreaterThan(0);
    });
  });
});
