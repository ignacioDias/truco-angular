import { Card, Suit } from '../card/card';
import { PlayerId } from '../truco-types';
import { Player } from './player';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

describe('Player', () => {
  describe('getEnvidoPoints', () => {
    const cases: Array<{ name: string; hand: Card[]; expected: number }> = [
      {
        name: 'returns the highest card when no two cards share a suit',
        hand: [
          card(1, Suit.Swords),
          card(7, Suit.Coins),
          card(3, Suit.Cups),
        ],
        expected: 7,
      },
      {
        name: 'ignores figures when no two cards share a suit',
        hand: [
          card(4, Suit.Clubs),
          card(5, Suit.Coins),
          card(12, Suit.Cups),
        ],
        expected: 5,
      },
      {
        name: 'returns the highest card when all suits differ',
        hand: [
          card(1, Suit.Clubs),
          card(2, Suit.Swords),
          card(3, Suit.Coins),
        ],
        expected: 3,
      },
      {
        name: 'counts two figures of the same suit as 20',
        hand: [
          card(12, Suit.Cups),
          card(11, Suit.Cups),
          card(10, Suit.Swords),
        ],
        expected: 20,
      },
      {
        name: 'adds 20 to the two highest cards of the same suit',
        hand: [
          card(7, Suit.Swords),
          card(6, Suit.Coins),
          card(5, Suit.Coins),
        ],
        expected: 31,
      },
      {
        name: 'counts a figure as 0 when paired with another card of its suit',
        hand: [
          card(7, Suit.Swords),
          card(12, Suit.Coins),
          card(5, Suit.Coins),
        ],
        expected: 25,
      },
    ];

    it.each(cases)('$name', ({ hand, expected }) => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand(hand);

      expect(player.getEnvidoPoints()).toBe(expected);
    });

    it('returns 0 when the hand is empty', () => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([]);

      expect(player.getEnvidoPoints()).toBe(0);
    });
  });
});
