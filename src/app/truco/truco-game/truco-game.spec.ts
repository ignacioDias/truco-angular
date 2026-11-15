import { Card, Suit } from '../card';
import { Deck } from '../deck';
import { Player } from '../player/player';
import { TrucoGame } from './truco-game';

const card = (numericValue: number, suit: Suit): Card => ({
  numericValue,
  suit,
});

const deckCards = (): Card[] => [
  card(1, Suit.Swords),
  card(2, Suit.Swords),
  card(3, Suit.Swords),
  card(4, Suit.Coins),
  card(5, Suit.Coins),
  card(6, Suit.Coins),
  card(7, Suit.Cups),
  card(8, Suit.Cups),
  card(9, Suit.Cups),
  card(11, Suit.Clubs),
  card(12, Suit.Clubs),
];

interface TrucoGameInternals {
  player1: Player;
  player2: Player;
  currentPlayedCards: (Card | null)[][];
  currentEnvidoCall: string;
  currentTruco: string;
  currentEnvidoPoints: number;
  currentRound: number;
}

const internals = (game: TrucoGame): TrucoGameInternals =>
  game as unknown as TrucoGameInternals;

function mockDeck(cards: Card[] = deckCards()): void {
  let index = 0;
  vi.spyOn(Deck.prototype, 'getRandomCard').mockImplementation(() => {
    const next = cards[index++];
    if (!next) {
      throw new Error('The mocked deck is empty');
    }
    return next;
  });
}

function deal(): TrucoGame {
  const game = new TrucoGame("Nos", "Ellos", 30);
  mockDeck();
  game.newHand();
  return game;
}

describe('TrucoGame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('newHand', () => {
    it('deals three cards to each player', () => {
      const game = deal();
      const cards = deckCards();

      expect(internals(game).player1.hand).toEqual(cards.slice(0, 3));
      expect(internals(game).player2.hand).toEqual(cards.slice(3, 6));
    });

    it('resets the table state', () => {
      const game = deal();
      game.playCard(0, 0);

      game.newHand();

      expect(internals(game).currentEnvidoCall).toBe('none');
      expect(internals(game).currentTruco).toBe('none');
      expect(internals(game).currentEnvidoPoints).toBe(0);
      expect(internals(game).currentPlayedCards).toEqual([
        [null, null],
        [null, null],
        [null, null],
      ]);
      expect(internals(game).player1.hand).toHaveLength(3);
      expect(internals(game).player2.hand).toHaveLength(3);
    });
  });

  describe('nextRound', () => {
    it('starts a new hand and goes back to the first round', () => {
      const game = deal();
      const firstHand = [
        ...internals(game).player1.hand,
        ...internals(game).player2.hand,
      ];
      game.playCard(0, 0);

      game.nextRound();

      const newHand = [
        ...internals(game).player1.hand,
        ...internals(game).player2.hand,
      ];
      expect(internals(game).currentRound).toBe(1);
      expect(newHand).toHaveLength(6);
      expect(newHand).not.toEqual(firstHand);
      expect(internals(game).currentPlayedCards).toEqual([
        [null, null],
        [null, null],
        [null, null],
      ]);
    });
  });

  describe('playCard', () => {
    it('plays the card of the player whose turn it is', () => {
      const game = deal();
      const playedCard = internals(game).player2.hand[0];

      game.playCard(0, 0);

      expect(internals(game).player2.hand).toHaveLength(2);
      expect(internals(game).player2.hand).not.toContain(playedCard);
      expect(internals(game).currentPlayedCards[0][0]).toBe(playedCard);
    });

    it('alternates turns between players', () => {
      const game = deal();

      game.playCard(0, 0);
      game.playCard(1, 0);

      expect(internals(game).player2.hand).toHaveLength(2);
      expect(internals(game).player1.hand).toHaveLength(2);
      expect(internals(game).currentPlayedCards[0][0]).not.toBeNull();
      expect(internals(game).currentPlayedCards[0][1]).not.toBeNull();
    });

    it('throws when a player plays out of turn', () => {
      const game = deal();

      expect(() => game.playCard(1, 0)).toThrow("It's not your turn");
    });

    it('throws when the card index is out of range', () => {
      const game = deal();

      expect(() => game.playCard(0, 3)).toThrow('Invalid card index');
    });
  });

  describe('getGameWinner', () => {
    it('returns null while nobody reached the required points', () => {
      const game = deal();
      internals(game).player1.points = 29;

      expect(game.getGameWinner()).toBeNull();
    });

    it('returns player 1 when they reach the required points', () => {
      const game = deal();
      internals(game).player1.points = 30;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });

    it('returns player 2 when they reach the required points', () => {
      const game = deal();
      internals(game).player2.points = 30;

      expect(game.getGameWinner()).toBe(internals(game).player2);
    });

    it('respects a custom amount of points required to win', () => {
      const game = deal();
      game.setPointsRequiredToWin(15);
      internals(game).player1.points = 15;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });
  });

  describe('callTruco', () => {
    it('accepts a call from the player whose turn it is to call', () => {
      const game = deal();

      game.callTruco('truco', 1);

      expect(internals(game).currentTruco).toBe('truco');
    });

    it('throws when a player calls out of turn', () => {
      const game = deal();

      expect(() => game.callTruco('truco', 0)).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('accepts the escalating calls in order', () => {
      const game = deal();

      game.callTruco('truco', 1);
      game.callTruco('reTruco', 0);
      game.callTruco('valeCuatro', 0);

      expect(internals(game).currentTruco).toBe('valeCuatro');
    });

    it('rejects repeating or lowering the current call', () => {
      const game = deal();
      game.callTruco('truco', 1);

      expect(() => game.callTruco('truco', 0)).toThrow('Invalid Truco call');
    });
  });

  describe('callEnvido', () => {
    it('accepts an envido call from the player whose turn it is', () => {
      const game = deal();

      game.callEnvido('envido', 1);

      expect(internals(game).currentEnvidoCall).toBe('envido');
      expect(internals(game).currentEnvidoPoints).toBe(2);
    });

    it('throws when a player calls out of turn', () => {
      const game = deal();

      expect(() => game.callEnvido('envido', 0)).toThrow(
        "It's not your turn to call Envido",
      );
    });

    it('only allows doble envido after envido', () => {
      const game = deal();

      expect(() => game.callEnvido('dobleEnvido', 1)).toThrow(
        'Invalid Envido call',
      );
    });

    it('accepts envido followed by doble envido', () => {
      const game = deal();

      game.callEnvido('envido', 1);
      game.callEnvido('dobleEnvido', 0);

      expect(internals(game).currentEnvidoCall).toBe('dobleEnvido');
      expect(internals(game).currentEnvidoPoints).toBe(4);
    });

    it('adds three points for a real envido', () => {
      const game = deal();

      game.callEnvido('realEnvido', 1);

      expect(internals(game).currentEnvidoPoints).toBe(3);
    });

    it('rejects repeating or lowering the current call', () => {
      const game = deal();
      game.callEnvido('envido', 1);

      expect(() => game.callEnvido('envido', 0)).toThrow('Invalid Envido call');
    });

    it('only allows envido during the first round', () => {
      const game = deal();
      internals(game).currentRound = 2;

      expect(() => game.callEnvido('envido', 1)).toThrow(
        'Envido can only be called in the first round',
      );
    });
  });

  describe('addPointsToPlayer', () => {
    it('adds points to player 2 when the id is 0', () => {
      const game = new TrucoGame("Nos", "Ellos", 30);

      game.addPointsToPlayer(0, 5);

      expect(internals(game).player2.points).toBe(5);
      expect(internals(game).player1.points).toBe(0);
    });

    it('adds points to player 1 when the id is 1', () => {
      const game = new TrucoGame("Nos", "Ellos", 30);

      game.addPointsToPlayer(1, 3);

      expect(internals(game).player1.points).toBe(3);
      expect(internals(game).player2.points).toBe(0);
    });

    it('throws when the player id is invalid', () => {
      const game = new TrucoGame("Nos", "Ellos", 30);

      expect(() => game.addPointsToPlayer(2, 1)).toThrow('Invalid player ID');
    });
  });

  describe('setEnvidoPoints', () => {
    it('awards the envido points to player 1 when they have more', () => {
      const game = deal();
      internals(game).player1.setHand([
        card(7, Suit.Swords),
        card(6, Suit.Swords),
        card(1, Suit.Cups),
      ]);
      internals(game).player2.setHand([
        card(4, Suit.Coins),
        card(5, Suit.Coins),
        card(1, Suit.Clubs),
      ]);
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(2);
      expect(internals(game).player2.points).toBe(0);
    });

    it('awards the envido points to player 2 when they have more', () => {
      const game = deal();
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(0);
      expect(internals(game).player2.points).toBe(2);
    });

    it('awards no points when both players are tied', () => {
      const game = deal();
      internals(game).player1.setHand([
        card(7, Suit.Swords),
        card(6, Suit.Swords),
        card(1, Suit.Cups),
      ]);
      internals(game).player2.setHand([
        card(7, Suit.Coins),
        card(6, Suit.Coins),
        card(1, Suit.Clubs),
      ]);
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(0);
      expect(internals(game).player2.points).toBe(0);
    });

    it('adds the remaining points to the winner for falta envido', () => {
      const game = deal();
      internals(game).player1.setHand([
        card(7, Suit.Swords),
        card(6, Suit.Swords),
        card(1, Suit.Cups),
      ]);
      internals(game).player2.setHand([
        card(4, Suit.Coins),
        card(5, Suit.Coins),
        card(1, Suit.Clubs),
      ]);
      game.callEnvido('faltaEnvido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(30);
      expect(internals(game).player2.points).toBe(0);
    });
  });
});
