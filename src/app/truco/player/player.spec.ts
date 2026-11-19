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
          card(12, Suit.Swords),
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

  describe('getEnvidoPoints - scoring table', () => {
    const FACE = 'face';
    const FACE_VALUES = [11, 12];

    // Every pair of same-suit cards from the envido scoring table.
    const table: Array<[number, Array<[number | typeof FACE, number | typeof FACE]>]> = [
      [33, [[7, 6]]],
      [32, [[7, 5]]],
      [31, [[7, 4], [6, 5]]],
      [30, [[7, 3], [6, 4]]],
      [29, [[7, 2], [6, 3], [5, 4]]],
      [28, [[7, 1], [6, 2], [5, 3]]],
      [27, [[7, FACE], [6, 1], [5, 2], [4, 3]]],
      [26, [[6, FACE], [5, 1], [4, 2]]],
      [25, [[5, FACE], [4, 1], [3, 2]]],
      [24, [[4, FACE], [3, 1]]],
      [23, [[3, FACE], [2, 1]]],
      [22, [[2, FACE]]],
      [21, [[1, FACE]]],
      [20, [[FACE, FACE]]],
    ];

    const expand = (value: number | typeof FACE): number[] =>
      value === FACE ? FACE_VALUES : [value];

    const cases = table.flatMap(([score, pairs]) =>
      pairs.flatMap(([first, second]) =>
        expand(first).flatMap((a) =>
          expand(second)
            .filter((b) => first !== second || a !== b)
            .map((b) => ({ score, a, b })),
        ),
      ),
    );

    it.each(cases)('scores $score with $a and $b of the same suit', ({ score, a, b }) => {
      const player = new Player(PlayerId.Player1, 'Test');
      // The third card has another suit, so it can't form a pair.
      player.setHand([card(a, Suit.Cups), card(b, Suit.Cups), card(1, Suit.Coins)]);

      expect(player.getEnvidoPoints()).toBe(score);
    });

    it('is independent of the order of the cards in the hand', () => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([card(6, Suit.Swords), card(1, Suit.Coins), card(7, Suit.Swords)]);

      expect(player.getEnvidoPoints()).toBe(33);
    });

    it('is worth 33 at most', () => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([card(7, Suit.Cups), card(6, Suit.Cups), card(5, Suit.Cups)]);

      expect(player.getEnvidoPoints()).toBe(33);
    });

    it.each([11, 12])('treats the %s as 0 when it is alone in its suit', (face) => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([card(face, Suit.Cups), card(face, Suit.Coins), card(face, Suit.Swords)]);

      expect(player.getEnvidoPoints()).toBe(0);
    });

    it('scores 0 with three different face cards of different suits', () => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([card(12, Suit.Coins), card(11, Suit.Cups), card(12, Suit.Swords)]);

      expect(player.getEnvidoPoints()).toBe(0);
    });

    it.each([
      { name: '1', value: 1, expected: 1 },
      { name: '4', value: 4, expected: 4 },
      { name: '7', value: 7, expected: 7 },
    ])('scores $expected with a single $name and no pair', ({ value, expected }) => {
      const player = new Player(PlayerId.Player1, 'Test');
      player.setHand([
        card(value, Suit.Cups),
        card(12, Suit.Coins),
        card(11, Suit.Swords),
      ]);

      expect(player.getEnvidoPoints()).toBe(expected);
    });

    it('has no possible score between 8 and 19', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 11, 12];
      const suits = [Suit.Clubs, Suit.Coins, Suit.Cups, Suit.Swords];

      for (const a of values) {
        for (const b of values) {
          for (const c of values) {
            if (a === b || a === c || b === c) {
              continue;
            }
            for (const suitA of suits) {
              for (const suitB of suits) {
                for (const suitC of suits) {
                  const player = new Player(PlayerId.Player1, 'Test');
                  player.setHand([card(a, suitA), card(b, suitB), card(c, suitC)]);
                  const points = player.getEnvidoPoints();

                  expect(points < 8 || points >= 20).toBe(true);
                  expect(points).toBeLessThanOrEqual(33);
                }
              }
            }
          }
        }
      }
    });

    describe('three cards of the same suit', () => {
      it.each([
        { hand: [7, 6, 5], expected: 33 },
        { hand: [5, 4, 1], expected: 29 },
        { hand: [1, 2, 3], expected: 25 },
        { hand: [12, 3, 2], expected: 25 },
        { hand: [12, 11, 1], expected: 21 },

        { hand: [7, 12, 1], expected: 28 },
      ])('uses the two highest cards of $hand', ({ hand, expected }) => {
        const player = new Player(PlayerId.Player1, 'Test');
        player.setHand(hand.map((value) => card(value, Suit.Clubs)));

        expect(player.getEnvidoPoints()).toBe(expected);
      });
    });
  });
});
