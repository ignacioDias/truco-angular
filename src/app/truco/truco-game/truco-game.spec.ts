import { Card, Suit } from '../card';
import { Deck } from '../deck';
import { Player } from '../player/player';
import { TrucoGame } from './truco-game';

const card = (numericValue: number, suit: Suit): Card => ({
  numericValue,
  suit,
});

const deckCards = (): Card[] => [
  // First hand: player 1 = 33 envido, player 2 = 29 envido.
  card(7, Suit.Swords),
  card(6, Suit.Swords),
  card(1, Suit.Cups),
  card(4, Suit.Coins),
  card(5, Suit.Coins),
  card(1, Suit.Clubs),
  // Second hand.
  card(2, Suit.Cups),
  card(3, Suit.Cups),
  card(4, Suit.Cups),
  card(5, Suit.Clubs),
  card(6, Suit.Clubs),
  card(7, Suit.Clubs),
  // Extra cards for tests that deal more hands.
  card(1, Suit.Swords),
  card(2, Suit.Coins),
  card(3, Suit.Coins),
  card(4, Suit.Swords),
  card(5, Suit.Swords),
  card(6, Suit.Coins),
  card(2, Suit.Swords),
  card(3, Suit.Swords),
  card(7, Suit.Coins),
  card(1, Suit.Clubs),
  card(2, Suit.Clubs),
  card(3, Suit.Clubs),
];

interface TrucoGameInternals {
  player1: Player;
  player2: Player;
  currentTurn: number;
  currentPlayedCards: (Card | null)[][];
  currentEnvidoCall: string;
  currentEnvidoPoints: number;
  currentTruco: string;
  currentPlayerWithEnvido: number;
  currentPlayerWithTrucoCall: number;
  currentRound: number;
  playedCards: boolean[];
  mano: number;
  player1EnvidoPoints: number;
  player2EnvidoPoints: number;
  envidoPlayed: boolean;
  envidoResolved: boolean;
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

function deal(pointsRequiredToWin: 15 | 30 = 30): TrucoGame {
  const game = new TrucoGame('Nos', 'Ellos', pointsRequiredToWin);
  mockDeck();
  game.newHand();
  return game;
}

function playRound(game: TrucoGame, firstIndex = 0, secondIndex = 0): void {
  game.playCard(1, firstIndex);
  game.playCard(0, secondIndex);
}

describe('TrucoGame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('sets the player names and the points required to win', () => {
      const game = new TrucoGame('Nos', 'Ellos', 15);

      expect(internals(game).player1.name).toBe('Nos');
      expect(internals(game).player2.name).toBe('Ellos');

      internals(game).player1.points = 15;
      expect(game.getGameWinner()).toBe(internals(game).player1);
    });
  });

  describe('newHand', () => {
    it('deals three cards to each player', () => {
      const game = deal();
      const cards = deckCards();

      expect(internals(game).player1.hand).toEqual(cards.slice(0, 3));
      expect(internals(game).player2.hand).toEqual(cards.slice(3, 6));
    });

    it('makes player 1 the mano and the first player on the first hand', () => {
      const game = deal();

      expect(internals(game).mano).toBe(1);
      expect(internals(game).currentTurn % 2).toBe(1);
      expect(internals(game).currentPlayerWithEnvido).toBe(1);
      expect(internals(game).currentPlayerWithTrucoCall).toBe(1);
    });

    it('alternates the mano between hands', () => {
      const game = deal();

      game.newHand();

      expect(internals(game).mano).toBe(0);
      expect(internals(game).currentTurn % 2).toBe(0);
    });

    it('snapshots each player envido points when the hand is dealt', () => {
      const game = deal();

      expect(internals(game).player1EnvidoPoints).toBe(33);
      expect(internals(game).player2EnvidoPoints).toBe(29);
    });

    it('resets the table state', () => {
      const game = deal();
      game.callEnvido('envido', 1);
      game.callTruco('truco', 0);
      game.playCard(1, 0);

      game.newHand();

      expect(internals(game).currentEnvidoCall).toBe('none');
      expect(internals(game).currentTruco).toBe('none');
      expect(internals(game).currentEnvidoPoints).toBe(0);
      expect(internals(game).envidoPlayed).toBe(false);
      expect(internals(game).envidoResolved).toBe(false);
      expect(internals(game).currentPlayedCards).toEqual([
        [null, null],
        [null, null],
        [null, null],
      ]);
      expect(internals(game).playedCards).toEqual([false, false]);
      expect(internals(game).player1.hand).toHaveLength(3);
      expect(internals(game).player2.hand).toHaveLength(3);
    });
  });

  describe('nextRound', () => {
    it('advances to the next round and resets which players have played', () => {
      const game = deal();
      playRound(game);

      game.nextRound();

      expect(internals(game).currentRound).toBe(2);
      expect(internals(game).playedCards).toEqual([false, false]);
      expect(internals(game).currentPlayedCards[0][0]).not.toBeNull();
      expect(internals(game).currentPlayedCards[0][1]).not.toBeNull();
    });

    it('goes from round 3 to a new hand', () => {
      const game = deal();
      const cards = deckCards();

      game.nextRound();
      expect(internals(game).currentRound).toBe(2);

      game.nextRound();
      expect(internals(game).currentRound).toBe(3);

      game.nextRound();

      expect(internals(game).currentRound).toBe(1);
      expect(internals(game).player1.hand).toEqual(cards.slice(6, 9));
      expect(internals(game).player2.hand).toEqual(cards.slice(9, 12));
      expect(internals(game).currentPlayedCards).toEqual([
        [null, null],
        [null, null],
        [null, null],
      ]);
    });
  });

  describe('playCard', () => {
    it('plays the first card of player 1', () => {
      const game = deal();
      const playedCard = internals(game).player1.hand[0];

      game.playCard(1, 0);

      expect(internals(game).player1.hand).toHaveLength(2);
      expect(internals(game).player1.hand).not.toContain(playedCard);
      expect(internals(game).currentPlayedCards[0][1]).toBe(playedCard);
    });

    it('alternates turns between players', () => {
      const game = deal();

      playRound(game);

      expect(internals(game).player1.hand).toHaveLength(2);
      expect(internals(game).player2.hand).toHaveLength(2);
      expect(internals(game).currentPlayedCards[0][0]).not.toBeNull();
      expect(internals(game).currentPlayedCards[0][1]).not.toBeNull();
    });

    it('throws when a player plays out of turn', () => {
      const game = deal();

      expect(() => game.playCard(0, 0)).toThrow("It's not your turn");
    });

    it('throws when the card index is out of range', () => {
      const game = deal();

      expect(() => game.playCard(1, 3)).toThrow('Invalid card index');
    });

    it('rejects playing a second card in the same round', () => {
      const game = deal();
      playRound(game);

      expect(() => game.playCard(1, 0)).toThrow(
        'You have already played a card this round',
      );
    });

    it('records cards in the slot of the current round', () => {
      const game = deal();
      playRound(game);
      game.nextRound();

      game.playCard(1, 0);

      expect(internals(game).currentPlayedCards[1][1]).not.toBeNull();
    });

    it('gives the envido call to the next player after the first card', () => {
      const game = deal();

      game.playCard(1, 0);

      expect(internals(game).currentPlayerWithEnvido).toBe(0);
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
      const game = deal(15);
      internals(game).player1.points = 15;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });

    it('can change the amount of points required to win', () => {
      const game = deal();
      game.setPointsRequiredToWin(15);
      internals(game).player1.points = 15;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });
  });

  describe('callTruco', () => {
    it('allows player 1 to call the first truco', () => {
      const game = deal();

      game.callTruco('truco', 1);

      expect(internals(game).currentTruco).toBe('truco');
      expect(internals(game).currentPlayerWithTrucoCall).toBe(0);
    });

    it('allows player 2 to call the first truco', () => {
      const game = deal();

      game.callTruco('truco', 0);

      expect(internals(game).currentTruco).toBe('truco');
      expect(internals(game).currentPlayerWithTrucoCall).toBe(1);
    });

    it('only allows the opponent to answer the first truco', () => {
      const game = deal();
      game.callTruco('truco', 0);

      expect(() => game.callTruco('reTruco', 0)).toThrow(
        "It's not your turn to call Truco",
      );
      game.callTruco('reTruco', 1);
    });

    it('accepts the escalating calls in order', () => {
      const game = deal();

      game.callTruco('truco', 0);
      game.callTruco('reTruco', 1);
      game.callTruco('valeCuatro', 0);

      expect(internals(game).currentTruco).toBe('valeCuatro');
      expect(internals(game).currentPlayerWithTrucoCall).toBe(1);
    });

    it('rejects reTruco and valeCuatro before truco', () => {
      const game = deal();

      expect(() => game.callTruco('reTruco', 1)).toThrow(
        'Invalid Truco call',
      );
      expect(() => game.callTruco('valeCuatro', 1)).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects skipping a level', () => {
      const game = deal();
      game.callTruco('truco', 0);

      expect(() => game.callTruco('valeCuatro', 1)).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects repeating or lowering the current call', () => {
      const game = deal();
      game.callTruco('truco', 0);

      expect(() => game.callTruco('truco', 1)).toThrow('Invalid Truco call');
    });
  });

  describe('callEnvido', () => {
    it('allows the mano to call envido before playing', () => {
      const game = deal();

      game.callEnvido('envido', 1);

      expect(internals(game).currentEnvidoCall).toBe('envido');
      expect(internals(game).currentEnvidoPoints).toBe(2);
      expect(internals(game).currentPlayerWithEnvido).toBe(0);
    });

    it('rejects envido from the non-mano before the first card', () => {
      const game = deal();

      expect(() => game.callEnvido('envido', 0)).toThrow(
        "It's not your turn to call Envido",
      );
    });

    it('allows the non-mano to call envido after the first card', () => {
      const game = deal();
      game.playCard(1, 0);

      game.callEnvido('envido', 0);

      expect(internals(game).currentEnvidoCall).toBe('envido');
      expect(internals(game).currentEnvidoPoints).toBe(2);
    });

    it('allows a player who already played to answer envido', () => {
      const game = deal();
      game.playCard(1, 0);
      game.callEnvido('envido', 0);

      game.callEnvido('realEnvido', 1);

      expect(internals(game).currentEnvidoCall).toBe('realEnvido');
      expect(internals(game).currentEnvidoPoints).toBe(5);
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

    it('accepts real envido as the first envido call', () => {
      const game = deal();

      game.callEnvido('realEnvido', 1);

      expect(internals(game).currentEnvidoPoints).toBe(3);
    });

    it('rejects repeating the same call', () => {
      const game = deal();
      game.callEnvido('envido', 1);

      expect(() => game.callEnvido('envido', 0)).toThrow('Invalid Envido call');
    });

    it('rejects envido after the first round', () => {
      const game = deal();
      playRound(game);
      game.nextRound();

      expect(() => game.callEnvido('envido', 1)).toThrow(
        'You cannot call Envido after the first round',
      );
    });

    it('rejects envido from a player who already played', () => {
      const game = deal();
      playRound(game);

      expect(() => game.callEnvido('envido', 1)).toThrow(
        'You cannot call Envido after playing a card',
      );
    });

    it('rejects envido after it was resolved', () => {
      const game = deal();
      game.callEnvido('envido', 1);
      game.setEnvidoPoints();

      expect(() => game.callEnvido('envido', 0)).toThrow(
        'Envido has already been resolved',
      );
    });
  });

  describe('setEnvidoPoints', () => {
    it('awards the envido points to player 1 when they have more', () => {
      const game = deal();
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(2);
      expect(internals(game).player2.points).toBe(0);
      expect(internals(game).envidoResolved).toBe(true);
    });

    it('awards the envido points to player 2 when they have more', () => {
      const game = deal();
      internals(game).player1EnvidoPoints = 20;
      internals(game).player2EnvidoPoints = 30;
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(0);
      expect(internals(game).player2.points).toBe(2);
    });

    it('awards a tie to the mano', () => {
      const game = deal();
      internals(game).player1EnvidoPoints = 30;
      internals(game).player2EnvidoPoints = 30;
      game.callEnvido('envido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(2);
      expect(internals(game).player2.points).toBe(0);
    });

    it('awards a tie to player 2 when they are the mano', () => {
      const game = deal();
      game.newHand();
      internals(game).player1EnvidoPoints = 30;
      internals(game).player2EnvidoPoints = 30;
      game.callEnvido('envido', 0);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(0);
      expect(internals(game).player2.points).toBe(2);
    });

    it('uses the envido points from when the hand was dealt', () => {
      const cards = [
        card(7, Suit.Swords),
        card(6, Suit.Swords),
        card(1, Suit.Cups),
        card(7, Suit.Coins),
        card(3, Suit.Coins),
        card(1, Suit.Clubs),
      ];
      const game = new TrucoGame('Nos', 'Ellos', 30);
      mockDeck(cards);
      game.newHand();

      // After playing the 7 of swords, player 1 would have only 6 envido
      // points left in hand, but the dealt hand was worth 33 against 30.
      game.playCard(1, 0);
      game.callEnvido('envido', 0);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(2);
      expect(internals(game).player2.points).toBe(0);
    });

    it('adds the points the opponent needs for falta envido', () => {
      const game = deal();
      internals(game).player2.points = 10;
      game.callEnvido('faltaEnvido', 1);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(20);
      expect(internals(game).player2.points).toBe(10);
    });

    it('clears the accumulated envido points after awarding them', () => {
      const game = deal();
      game.callEnvido('envido', 1);
      game.setEnvidoPoints();

      expect(internals(game).currentEnvidoPoints).toBe(0);

      game.setEnvidoPoints();

      expect(internals(game).player1.points).toBe(2);
    });
  });

  describe('addPointsToPlayer', () => {
    it('adds points to player 2 when the id is 0', () => {
      const game = new TrucoGame('Nos', 'Ellos', 30);

      game.addPointsToPlayer(0, 5);

      expect(internals(game).player2.points).toBe(5);
      expect(internals(game).player1.points).toBe(0);
    });

    it('adds points to player 1 when the id is 1', () => {
      const game = new TrucoGame('Nos', 'Ellos', 30);

      game.addPointsToPlayer(1, 3);

      expect(internals(game).player1.points).toBe(3);
      expect(internals(game).player2.points).toBe(0);
    });

    it('throws when the player id is invalid', () => {
      const game = new TrucoGame('Nos', 'Ellos', 30);

      expect(() => game.addPointsToPlayer(2, 1)).toThrow('Invalid player ID');
    });
  });
});
