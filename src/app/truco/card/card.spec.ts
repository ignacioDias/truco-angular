import { Card, Suit } from './card';

describe('Card', () => {
  describe('constructor', () => {
    it('stores the numeric value and suit', () => {
      const created = new Card(3, Suit.Swords);

      expect(created.numericValue).toBe(3);
      expect(created.suit).toBe(Suit.Swords);
    });
  });
});
