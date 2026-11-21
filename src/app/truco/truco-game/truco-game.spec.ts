import { Card, Suit } from '../card/card';
import { Deck } from '../deck';
import { Player } from '../player/player';
import { TrucoGame } from './truco-game';
import { TurnTracker } from '../turn-tracker/turn-tracker';
import { TrucoCallState } from '../truco-call-state/truco-call-state';
import { EnvidoCallState } from '../envido-call-state/envido-call-state';
import { EnvidoCall, PlayerId, TrucoCall, opponentOf } from '../truco-types';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

// The deck deals six cards per hand: the first three to Player1 and the next three to Player0.
// Player1 is the mano of the first hand, and the mano alternates in every following hand.
// Every player plays the card at the same position of their hand in every round
// (first card in round 1, second card in round 2, ...).
const hands = (player1: Card[], player0: Card[]): Card[] => [...player1, ...player0];

// Cards power: 1 of swords > 7 of swords > 3 > 2 > 12 > 7 of cups > 6 > 5 > 4.
const defaultDeck = (): Card[] => [
  // First hand: Player1 = 33 envido, Player0 = 29 envido.
  // Round 1: 7 of swords beats 4. Round 2: 6 beats 5, so Player1 wins the hand in two rounds.
  card(7, Suit.Swords),
  card(6, Suit.Swords),
  card(1, Suit.Cups),
  card(4, Suit.Coins),
  card(5, Suit.Coins),
  card(1, Suit.Clubs),
  // Second hand (mano is Player0): Player1 wins rounds 1 and 2.
  card(2, Suit.Cups),
  card(3, Suit.Cups),
  card(4, Suit.Cups),
  card(5, Suit.Clubs),
  card(6, Suit.Clubs),
  card(7, Suit.Clubs),
];

// The first hand is replaced and the second hand is the one of the default deck.
const withNextHand = (firstHand: Card[]): Card[] => [...firstHand, ...defaultDeck().slice(6)];

// Player1 wins rounds 1 and 2.
const player1WinsInTwoRounds = (): Card[] =>
  hands(
    [card(1, Suit.Swords), card(7, Suit.Swords), card(3, Suit.Cups)],
    [card(4, Suit.Coins), card(5, Suit.Coins), card(6, Suit.Coins)],
  );

// Player1 wins round 1, Player0 wins round 2 and Player1 wins round 3.
const player1WinsInThreeRounds = (): Card[] =>
  hands(
    [card(1, Suit.Swords), card(4, Suit.Cups), card(6, Suit.Cups)],
    [card(4, Suit.Coins), card(3, Suit.Coins), card(5, Suit.Coins)],
  );

// Player0 wins round 1, Player1 wins round 2 and Player0 wins round 3.
const player0WinsInThreeRounds = (): Card[] =>
  hands(
    [card(4, Suit.Cups), card(1, Suit.Swords), card(6, Suit.Cups)],
    [card(3, Suit.Coins), card(2, Suit.Coins), card(3, Suit.Swords)],
  );

// Every round is a parda.
const allPardas = (): Card[] =>
  hands(
    [card(3, Suit.Cups), card(2, Suit.Cups), card(4, Suit.Cups)],
    [card(3, Suit.Coins), card(2, Suit.Coins), card(4, Suit.Coins)],
  );

// Round 1 is a parda and Player0 wins round 2.
const pardaThenPlayer0Wins = (): Card[] =>
  hands(
    [card(3, Suit.Cups), card(4, Suit.Cups), card(1, Suit.Swords)],
    [card(3, Suit.Coins), card(2, Suit.Coins), card(4, Suit.Coins)],
  );

// Player0 wins round 1 and round 2 is a parda. Player1 would win round 3 with the 1 of swords.
const player0WinsThenParda = (): Card[] =>
  hands(
    [card(4, Suit.Cups), card(3, Suit.Cups), card(1, Suit.Swords)],
    [card(3, Suit.Coins), card(3, Suit.Swords), card(4, Suit.Coins)],
  );

// Player1 wins round 1, Player0 wins round 2 and round 3 is a parda.
const splitThenParda = (): Card[] =>
  hands(
    [card(1, Suit.Swords), card(4, Suit.Cups), card(4, Suit.Swords)],
    [card(4, Suit.Coins), card(3, Suit.Coins), card(4, Suit.Clubs)],
  );

interface TrucoGameInternals {
  player1: Player;
  player2: Player;
  turnTracker: TurnTracker;
  trucoCallState: TrucoCallState;
  envidoCallState: EnvidoCallState;
  currentPlayedCards: (Card | null)[][];
  playedCardsThisRound: boolean[];
}

const internals = (game: TrucoGame): TrucoGameInternals =>
  game as unknown as TrucoGameInternals;

// TrucoGame.player1 has id Player1 and TrucoGame.player2 has id Player0.
const pointsOf = (game: TrucoGame, playerId: PlayerId): number =>
  playerId === PlayerId.Player0
    ? internals(game).player2.points
    : internals(game).player1.points;

function mockDeck(cards: Card[] = defaultDeck()): void {
  let index = 0;
  vi.spyOn(Deck.prototype, 'deal').mockImplementation(
    // Once the scripted cards run out, any card will do.
    () => cards[index++] ?? card(4, Suit.Clubs),
  );
}

function startGame(cards: Card[] = defaultDeck(), pointsRequiredToWin: 15 | 30 = 30): TrucoGame {
  const game = new TrucoGame('Nos', 'Ellos', pointsRequiredToWin);
  mockDeck(cards);
  game.newHand();
  return game;
}

// A new hand has just been dealt when nothing is on the table.
const isNewHand = (game: TrucoGame): boolean =>
  internals(game).currentPlayedCards.every(([first, second]) => first === null && second === null);

// Both players play the card at `index` of their hand, starting with whoever is on turn.
function playRound(game: TrucoGame, index = 0): void {
  const first = internals(game).turnTracker.getCurrentPlayer();
  game.playCard(first, index);
  game.playCard(opponentOf(first), index);
}

function playRoundAndMoveOn(game: TrucoGame): void {
  playRound(game);
  game.nextRound();
}

// Plays rounds until the hand is over (at most three).
function playFullHand(game: TrucoGame): void {
  for (let round = 0; round < 3; round++) {
    playRoundAndMoveOn(game);
    if (isNewHand(game)) {
      return;
    }
  }
}

// `asker` calls the truco and the opponent accepts without raising.
function askTruco(game: TrucoGame, call: TrucoCall, asker: PlayerId): void {
  game.answerTruco(true, call, opponentOf(asker));
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
      const game = startGame();
      const cards = defaultDeck();

      expect(internals(game).player1.hand).toEqual(cards.slice(0, 3));
      expect(internals(game).player2.hand).toEqual(cards.slice(3, 6));
    });

    it('never deals the same card twice in a hand', () => {
      const game = new TrucoGame('Nos', 'Ellos', 30);

      for (let hand = 0; hand < 10; hand++) {
        game.newHand();
        const cards = [...internals(game).player1.hand, ...internals(game).player2.hand];
        const keys = cards.map((c) => `${c.suit}-${c.numericValue}`);

        expect(cards).toHaveLength(6);
        expect(new Set(keys).size).toBe(6);
      }
    });

    it('makes player 1 the mano and the first player of the first hand', () => {
      const game = startGame();

      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player1);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
      expect(internals(game).turnTracker.getRound()).toBe(1);
    });

    it('alternates the mano between hands', () => {
      const game = startGame();

      game.newHand();

      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player0);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);

      game.newHand();

      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player1);
    });

    it('resets the state of the table', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);
      game.playCard(PlayerId.Player1, 0);

      game.newHand();

      expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.None);
      expect(internals(game).turnTracker.getRound()).toBe(1);
      expect(internals(game).currentPlayedCards).toEqual([
        [null, null],
        [null, null],
        [null, null],
      ]);
      expect(internals(game).playedCardsThisRound).toEqual([false, false]);
      expect(internals(game).player1.hand).toHaveLength(3);
      expect(internals(game).player2.hand).toHaveLength(3);
    });
  });

  describe('playCard', () => {
    it('removes the card from the hand and puts it on the table', () => {
      const game = startGame();
      const playedCard = internals(game).player1.hand[0];

      game.playCard(PlayerId.Player1, 0);

      expect(internals(game).player1.hand).toHaveLength(2);
      expect(internals(game).player1.hand).not.toContain(playedCard);
      expect(internals(game).currentPlayedCards[0][PlayerId.Player1]).toBe(playedCard);
    });

    it('plays the card that was chosen', () => {
      const game = startGame();
      const chosen = internals(game).player1.hand[2];

      game.playCard(PlayerId.Player1, 2);

      expect(internals(game).currentPlayedCards[0][PlayerId.Player1]).toBe(chosen);
    });

    it('gives the turn to the opponent after a card is played', () => {
      const game = startGame();

      game.playCard(PlayerId.Player1, 0);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);

      game.playCard(PlayerId.Player0, 0);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
    });

    it('lets the opponent play after the first card of the round', () => {
      const game = startGame();
      game.playCard(PlayerId.Player1, 0);

      expect(() => game.playCard(PlayerId.Player0, 0)).not.toThrow();
    });

    it('throws when a player plays out of turn', () => {
      const game = startGame();

      expect(() => game.playCard(PlayerId.Player0, 0)).toThrow("It's not your turn");
    });

    it('throws when the player who already played tries again before the opponent', () => {
      const game = startGame();
      game.playCard(PlayerId.Player1, 0);

      expect(() => game.playCard(PlayerId.Player1, 0)).toThrow("It's not your turn");
    });

    it.each([-1, 3])('throws when the card index is %s', (index) => {
      const game = startGame();

      expect(() => game.playCard(PlayerId.Player1, index)).toThrow('Invalid card index');
    });

    it('rejects a second card in the same round', () => {
      const game = startGame();
      playRound(game);

      expect(() => game.playCard(PlayerId.Player1, 0)).toThrow(
        'You have already played a card this round',
      );
    });

    it('records the cards in the slot of the current round', () => {
      const game = startGame();
      playRoundAndMoveOn(game);

      game.playCard(PlayerId.Player1, 0);

      expect(internals(game).currentPlayedCards[1][PlayerId.Player1]).not.toBeNull();
      expect(internals(game).currentPlayedCards[1][PlayerId.Player0]).toBeNull();
    });

    it('does not end the hand by itself', () => {
      const game = startGame();

      playRoundAndMoveOn(game);
      // Player1 wins both rounds, but the hand is only scored when nextRound is called.
      playRound(game);

      expect(pointsOf(game, PlayerId.Player0) + pointsOf(game, PlayerId.Player1)).toBe(0);
      expect(isNewHand(game)).toBe(false);
    });
  });

  describe('nextRound', () => {
    it('advances the round and lets both players play again', () => {
      const game = startGame();
      playRound(game);

      game.nextRound();

      expect(internals(game).turnTracker.getRound()).toBe(2);
      expect(internals(game).playedCardsThisRound).toEqual([false, false]);
      expect(internals(game).currentPlayedCards[0][0]).not.toBeNull();
      expect(internals(game).currentPlayedCards[0][1]).not.toBeNull();
    });

    it('lets the winner of the round play first in the next one', () => {
      // Player0 wins round 1.
      const game = startGame(player0WinsInThreeRounds());
      playRound(game);

      game.nextRound();

      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);
      expect(() => game.playCard(PlayerId.Player1, 0)).toThrow("It's not your turn");
      expect(() => game.playCard(PlayerId.Player0, 0)).not.toThrow();
    });

    it('lets the mano play first again when the mano wins the round', () => {
      const game = startGame(player1WinsInThreeRounds());
      playRound(game);

      game.nextRound();

      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
    });

    it('lets the mano play first in the second round after a parda', () => {
      const game = startGame(allPardas());
      playRound(game);

      game.nextRound();

      expect(internals(game).turnTracker.getRound()).toBe(2);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
    });

    it('lets player 0 play first in the second round after a parda when they are the mano', () => {
      const game = startGame([...defaultDeck().slice(0, 6), ...allPardas()]);
      game.giveUpHand(PlayerId.Player0);
      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player0);
      playRound(game);

      game.nextRound();

      expect(internals(game).turnTracker.getRound()).toBe(2);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);
    });

    it('goes to the third round when each player won a round', () => {
      const game = startGame(player1WinsInThreeRounds());

      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);

      expect(internals(game).turnTracker.getRound()).toBe(3);
      expect(isNewHand(game)).toBe(false);
      expect(pointsOf(game, PlayerId.Player0) + pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('lets the winner of the second round start the third one', () => {
      // Player0 wins round 2.
      const game = startGame(player1WinsInThreeRounds());

      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);

      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);
    });

    it('goes to the third round after two pardas', () => {
      const game = startGame(allPardas());

      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);

      expect(internals(game).turnTracker.getRound()).toBe(3);
      expect(isNewHand(game)).toBe(false);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
    });

    it('ends the hand after the second round when the same player wins both rounds', () => {
      const game = startGame(withNextHand(player1WinsInTwoRounds()));
      const nextHand = defaultDeck().slice(6);

      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);

      expect(isNewHand(game)).toBe(true);
      expect(internals(game).turnTracker.getRound()).toBe(1);
      expect(internals(game).player1.hand).toEqual(nextHand.slice(0, 3));
      expect(internals(game).player2.hand).toEqual(nextHand.slice(3, 6));
    });

    it('ends the hand after the second round when it is a parda after a won first round', () => {
      const game = startGame(withNextHand(player0WinsThenParda()));

      playRoundAndMoveOn(game);
      expect(isNewHand(game)).toBe(false);
      playRoundAndMoveOn(game);

      expect(isNewHand(game)).toBe(true);
      expect(internals(game).turnTracker.getRound()).toBe(1);
    });

    it('ends the hand after the second round when it is won after a parda in the first', () => {
      const game = startGame(withNextHand(pardaThenPlayer0Wins()));

      playRoundAndMoveOn(game);
      expect(isNewHand(game)).toBe(false);
      playRoundAndMoveOn(game);

      expect(isNewHand(game)).toBe(true);
      expect(internals(game).turnTracker.getRound()).toBe(1);
    });

    it('ends the hand and deals a new one after the third round', () => {
      const game = startGame(withNextHand(player1WinsInThreeRounds()));
      const nextHand = defaultDeck().slice(6);

      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);
      playRoundAndMoveOn(game);

      expect(isNewHand(game)).toBe(true);
      expect(internals(game).turnTracker.getRound()).toBe(1);
      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player0);
      expect(internals(game).player1.hand).toEqual(nextHand.slice(0, 3));
      expect(internals(game).player2.hand).toEqual(nextHand.slice(3, 6));
    });
  });

  describe('winning a hand', () => {
    it('gives 1 point to the player who wins the first two rounds', () => {
      const game = startGame(player1WinsInTwoRounds());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives 1 point to the player who wins rounds 1 and 3', () => {
      const game = startGame(player0WinsInThreeRounds());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player0)).toBe(1);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('gives 1 point to the player who wins rounds 2 and 3', () => {
      const game = startGame(player1WinsInThreeRounds());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives the points of the accepted truco to the winner', () => {
      const game = startGame(player1WinsInTwoRounds());
      askTruco(game, TrucoCall.Truco, PlayerId.Player0);
      askTruco(game, TrucoCall.ReTruco, PlayerId.Player1);

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(3);
    });

    it('gives the hand to the mano when every round is a parda', () => {
      const game = startGame(allPardas());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives the hand to the new mano when every round is a parda in a later hand', () => {
      const game = startGame([...defaultDeck().slice(0, 6), ...allPardas()]);
      game.giveUpHand(PlayerId.Player0);

      playFullHand(game);

      expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(1);
    });

    it('gives the hand to the winner of the second round after a parda in the first', () => {
      const game = startGame(pardaThenPlayer0Wins());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player0)).toBe(1);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('gives the hand to the winner of the third round after two pardas', () => {
      const game = startGame(
        hands(
          [card(3, Suit.Cups), card(2, Suit.Cups), card(1, Suit.Swords)],
          [card(3, Suit.Coins), card(2, Suit.Coins), card(4, Suit.Coins)],
        ),
      );

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives the hand to the winner of the first round when the second is a parda', () => {
      const game = startGame(player0WinsThenParda());

      playFullHand(game);

      // The third round is not played: the 1 of swords of Player1 doesn't matter.
      expect(pointsOf(game, PlayerId.Player0)).toBe(1);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('gives the hand to the winner of the first round when the third is a parda', () => {
      const game = startGame(splitThenParda());

      playFullHand(game);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });
  });

  describe('getGameWinner', () => {
    it('returns null while nobody reached the required points', () => {
      const game = startGame();
      internals(game).player1.points = 29;
      internals(game).player2.points = 29;

      expect(game.getGameWinner()).toBeNull();
    });

    it('returns player 1 when they reach the required points', () => {
      const game = startGame();
      internals(game).player1.points = 30;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });

    it('returns player 2 when they reach the required points', () => {
      const game = startGame();
      internals(game).player2.points = 30;

      expect(game.getGameWinner()).toBe(internals(game).player2);
    });

    it('respects the points required to win chosen in the constructor', () => {
      const game = startGame(defaultDeck(), 15);
      internals(game).player1.points = 15;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });

    it('can change the points required to win', () => {
      const game = startGame();
      game.setPointsRequiredToWin(15);
      internals(game).player1.points = 15;

      expect(game.getGameWinner()).toBe(internals(game).player1);
    });
  });

  describe('addPointsToPlayer', () => {
    it('adds the points to player 2 when the id is Player0', () => {
      const game = startGame();

      game.addPointsToPlayer(PlayerId.Player0, 5);

      expect(internals(game).player2.points).toBe(5);
      expect(internals(game).player1.points).toBe(0);
    });

    it('adds the points to player 1 when the id is Player1', () => {
      const game = startGame();

      game.addPointsToPlayer(PlayerId.Player1, 3);

      expect(internals(game).player1.points).toBe(3);
      expect(internals(game).player2.points).toBe(0);
    });

    it('throws when the player id is invalid', () => {
      const game = startGame();

      expect(() => game.addPointsToPlayer(2 as PlayerId, 1)).toThrow('Invalid player ID');
    });
  });

  describe('answerTruco', () => {
    it.each([PlayerId.Player0, PlayerId.Player1])(
      'registers the truco of the opponent when player %s accepts',
      (answerer) => {
        const game = startGame();

        game.answerTruco(true, TrucoCall.Truco, answerer);

        expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.Truco);
        expect(internals(game).trucoCallState.getPlayerToCall()).toBe(answerer);
      },
    );

    it('keeps the hand going when the truco is accepted', () => {
      const game = startGame();
      const hand = [...internals(game).player1.hand];

      game.answerTruco(true, TrucoCall.Truco, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
      expect(internals(game).player1.hand).toEqual(hand);
      expect(() => game.playCard(PlayerId.Player1, 0)).not.toThrow();
    });

    it('lets either player call the truco at any moment', () => {
      const game = startGame();
      game.playCard(PlayerId.Player1, 0);

      // It is the turn of Player0 but Player1 sings truco.
      expect(() => game.answerTruco(true, TrucoCall.Truco, PlayerId.Player0)).not.toThrow();
      expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.Truco);
    });

    it('lets the player who accepted raise the bet even when it is not their turn', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);

      game.answerTruco(true, TrucoCall.ReTruco, PlayerId.Player1);

      expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.ReTruco);
    });

    it('does not let the player who raised raise again', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(() => game.answerTruco(true, TrucoCall.ReTruco, PlayerId.Player0)).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('rejects a call that skips a level', () => {
      const game = startGame();

      expect(() => game.answerTruco(true, TrucoCall.ReTruco, PlayerId.Player0)).toThrow(
        'Invalid Truco call',
      );
      expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.None);
    });

    it('does not close the envido when the truco call is rejected', () => {
      const game = startGame();

      expect(() => game.answerTruco(true, TrucoCall.ReTruco, PlayerId.Player0)).toThrow();

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).not.toThrow();
    });

    it('closes the envido when the truco is accepted', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).toThrow();
    });

    it('ends the hand and deals a new one when the truco is declined', () => {
      const game = startGame();
      const cards = defaultDeck();

      game.answerTruco(false, TrucoCall.Truco, PlayerId.Player0);

      expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.None);
      expect(internals(game).turnTracker.getRound()).toBe(1);
      expect(internals(game).player1.hand).toEqual(cards.slice(6, 9));
      expect(internals(game).player2.hand).toEqual(cards.slice(9, 12));
    });

    // Declining a truco is treated like irse al mazo: in the first round, before the
    // envido was called, the rival gets 1 point for the envido and 1 for the truco.
    it('gives 2 points to the caller when the first truco is declined in the first round', () => {
      const game = startGame();

      game.answerTruco(false, TrucoCall.Truco, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives 2 points to the non-mano caller when the first truco is declined in the first round', () => {
      const game = startGame();

      game.answerTruco(false, TrucoCall.Truco, PlayerId.Player1);

      expect(pointsOf(game, PlayerId.Player0)).toBe(2);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('gives 1 point to the caller when the envido was already called', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      game.answerTruco(false, TrucoCall.Truco, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
    });

    it('gives 1 point to the caller when the first truco is declined after the first round', () => {
      const game = startGame();
      playRoundAndMoveOn(game);

      game.answerTruco(false, TrucoCall.Truco, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives the points of the accepted truco when a retruco is declined', () => {
      const game = startGame();
      playRoundAndMoveOn(game);
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      game.answerTruco(false, TrucoCall.ReTruco, PlayerId.Player1);

      expect(pointsOf(game, PlayerId.Player0)).toBe(2);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('gives the points of the accepted retruco when a vale cuatro is declined', () => {
      const game = startGame();
      playRoundAndMoveOn(game);
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);
      askTruco(game, TrucoCall.ReTruco, PlayerId.Player0);

      game.answerTruco(false, TrucoCall.ValeCuatro, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(3);
    });
  });

  describe('irse al mazo (giveUpHand)', () => {
    describe('before the envido was called', () => {
      it.each([
        { giver: PlayerId.Player0, winner: PlayerId.Player1 },
        { giver: PlayerId.Player1, winner: PlayerId.Player0 },
      ])(
        'costs 1 point for envido and 1 for truco to player $giver',
        ({ giver, winner }) => {
          const game = startGame();

          game.giveUpHand(giver);

          expect(pointsOf(game, winner)).toBe(2);
          expect(pointsOf(game, giver)).toBe(0);
        },
      );

      it('still costs 2 points when the mano already played their first card', () => {
        const game = startGame();
        game.playCard(PlayerId.Player1, 0);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      });
    });

    describe('after the envido turn has passed', () => {
      it('costs only 1 point for truco once the envido was called', () => {
        const game = startGame();
        game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      });

      it('costs only 1 point for truco once the envido was declined', () => {
        const game = startGame();
        game.answerEnvido(false, EnvidoCall.None, PlayerId.Player0);
        const pointsFromEnvido = pointsOf(game, PlayerId.Player1);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsFromEnvido).toBe(1);
        expect(pointsOf(game, PlayerId.Player1)).toBe(pointsFromEnvido + 1);
      });

      it.each([PlayerId.Player0, PlayerId.Player1])(
        'costs only 1 point for truco in the second round (player %s gives up)',
        (giver) => {
          const game = startGame();
          playRoundAndMoveOn(game);

          game.giveUpHand(giver);

          expect(pointsOf(game, opponentOf(giver))).toBe(1);
          expect(pointsOf(game, giver)).toBe(0);
        },
      );

      it.each([PlayerId.Player0, PlayerId.Player1])(
        'costs only 1 point for truco in the third round (player %s gives up)',
        (giver) => {
          const game = startGame(player1WinsInThreeRounds());
          playRoundAndMoveOn(game);
          playRoundAndMoveOn(game);
          expect(internals(game).turnTracker.getRound()).toBe(3);

          game.giveUpHand(giver);

          expect(pointsOf(game, opponentOf(giver))).toBe(1);
          expect(pointsOf(game, giver)).toBe(0);
        },
      );

      // Rule: once truco is called the envido can no longer be played.
      it('costs only the points of the truco when it was accepted in the first round', () => {
        const game = startGame();
        askTruco(game, TrucoCall.Truco, PlayerId.Player1);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      });
    });

    describe('with an accepted truco', () => {
      it('costs the points of the truco', () => {
        const game = startGame();
        playRoundAndMoveOn(game);
        askTruco(game, TrucoCall.Truco, PlayerId.Player1);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      });

      it('costs the points of the retruco', () => {
        const game = startGame();
        playRoundAndMoveOn(game);
        askTruco(game, TrucoCall.Truco, PlayerId.Player1);
        askTruco(game, TrucoCall.ReTruco, PlayerId.Player0);

        game.giveUpHand(PlayerId.Player1);

        expect(pointsOf(game, PlayerId.Player0)).toBe(3);
      });

      it('costs the points of the vale cuatro', () => {
        const game = startGame();
        playRoundAndMoveOn(game);
        askTruco(game, TrucoCall.Truco, PlayerId.Player1);
        askTruco(game, TrucoCall.ReTruco, PlayerId.Player0);
        askTruco(game, TrucoCall.ValeCuatro, PlayerId.Player1);

        game.giveUpHand(PlayerId.Player0);

        expect(pointsOf(game, PlayerId.Player1)).toBe(4);
      });
    });

    describe('after giving up', () => {
      it('starts a new hand', () => {
        const game = startGame();
        const cards = defaultDeck();
        askTruco(game, TrucoCall.Truco, PlayerId.Player1);
        game.playCard(PlayerId.Player1, 0);

        game.giveUpHand(PlayerId.Player0);

        expect(internals(game).trucoCallState.getCall()).toBe(TrucoCall.None);
        expect(internals(game).turnTracker.getRound()).toBe(1);
        expect(internals(game).turnTracker.getMano()).toBe(PlayerId.Player0);
        expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player0);
        expect(internals(game).player1.hand).toEqual(cards.slice(6, 9));
        expect(internals(game).player2.hand).toEqual(cards.slice(9, 12));
        expect(internals(game).currentPlayedCards).toEqual([
          [null, null],
          [null, null],
          [null, null],
        ]);
        expect(internals(game).playedCardsThisRound).toEqual([false, false]);
      });

      it('does not treat the next hand as a surrender', () => {
        const game = startGame();
        game.giveUpHand(PlayerId.Player0);
        expect(pointsOf(game, PlayerId.Player1)).toBe(2);

        // Second hand (default deck): Player1 wins rounds 1 and 2 with the 2 and the 3.
        // It is resolved by the cards, so it is worth 1 point, not 2.
        playFullHand(game);

        expect(pointsOf(game, PlayerId.Player1)).toBe(3);
        expect(pointsOf(game, PlayerId.Player0)).toBe(0);
      });

      it('can end the game', () => {
        const game = startGame();
        internals(game).player1.points = 28;

        game.giveUpHand(PlayerId.Player0);

        expect(game.getGameWinner()).toBe(internals(game).player1);
      });
    });
  });

  describe('answerEnvido', () => {
    it('gives 1 point to the caller when an unraised envido is declined', () => {
      const game = startGame();

      game.answerEnvido(false, EnvidoCall.None, PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(1);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('gives the points before the last raise when a raise is declined', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.answerEnvido(true, EnvidoCall.RealEnvido, PlayerId.Player0);

      game.answerEnvido(false, EnvidoCall.None, PlayerId.Player1);

      expect(pointsOf(game, PlayerId.Player0)).toBe(2);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('lets the opponent raise an envido even when it is not their turn to play', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);

      expect(() => game.answerEnvido(true, EnvidoCall.RealEnvido, PlayerId.Player0)).not.toThrow();
    });

    it('does not end the hand when the envido is declined', () => {
      const game = startGame();
      const hand = [...internals(game).player1.hand];

      game.answerEnvido(false, EnvidoCall.None, PlayerId.Player0);

      expect(internals(game).player1.hand).toEqual(hand);
      expect(internals(game).turnTracker.getRound()).toBe(1);
    });

    it('cannot be called again after it was declined', () => {
      const game = startGame();
      game.answerEnvido(false, EnvidoCall.None, PlayerId.Player0);

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).toThrow(
        'Envido has already been resolved',
      );
    });

    it('rejects an envido after the first round', () => {
      const game = startGame();
      playRoundAndMoveOn(game);

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).toThrow(
        'You cannot call Envido after the first round',
      );
    });

    it('rejects an envido after the truco was called', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).toThrow(
        'Envido cannot be called after Truco',
      );
    });

    it('rejects an envido from a player who already played a card', () => {
      const game = startGame();
      playRound(game);

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1)).toThrow(
        'You cannot call Envido after playing a card',
      );
    });
  });

  describe('getOptionsForPlayer', () => {
    const ALL_ENVIDO = [EnvidoCall.Envido, EnvidoCall.RealEnvido, EnvidoCall.FaltaEnvido];

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'offers truco and every envido call to player %s at the start of the hand',
      (playerId) => {
        const game = startGame();

        expect(game.getOptionsForPlayer(playerId)).toEqual([[TrucoCall.Truco], ALL_ENVIDO]);
      },
    );

    it('offers the raise only to the player who accepted the truco', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[0]).toEqual([TrucoCall.ReTruco]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[0]).toEqual([]);
    });

    it('offers the raise to the player who accepted even when it is not their turn', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(internals(game).turnTracker.getCurrentPlayer()).toBe(PlayerId.Player1);
      expect(game.getOptionsForPlayer(PlayerId.Player0)[0]).toEqual([TrucoCall.ReTruco]);
    });

    it('follows the truco levels up to vale cuatro', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);
      askTruco(game, TrucoCall.ReTruco, PlayerId.Player0);

      expect(game.getOptionsForPlayer(PlayerId.Player1)[0]).toEqual([TrucoCall.ValeCuatro]);

      askTruco(game, TrucoCall.ValeCuatro, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[0]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[0]).toEqual([]);
    });

    it('offers no envido once the truco was called', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
    });

    it('offers the envido raise only to the player who has to answer', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual(ALL_ENVIDO);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
    });

    it('follows the envido hierarchy', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player0);

      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([
        EnvidoCall.RealEnvido,
        EnvidoCall.FaltaEnvido,
      ]);

      game.answerEnvido(true, EnvidoCall.RealEnvido, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual([EnvidoCall.FaltaEnvido]);

      game.answerEnvido(true, EnvidoCall.FaltaEnvido, PlayerId.Player0);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
    });

    it('still offers the truco while an envido is pending', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[0]).toEqual([TrucoCall.Truco]);
    });

    it('offers no envido after it was declined', () => {
      const game = startGame();
      game.answerEnvido(false, EnvidoCall.None, PlayerId.Player0);

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
    });

    it('offers no envido after its points were awarded', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.setPointsFromEnvido();

      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
    });

    it('offers no envido to a player who already played a card, but still to the other one', () => {
      const game = startGame();
      game.playCard(PlayerId.Player1, 0);

      expect(game.getOptionsForPlayer(PlayerId.Player1)[1]).toEqual([]);
      expect(game.getOptionsForPlayer(PlayerId.Player0)[1]).toEqual(ALL_ENVIDO);
    });

    it('offers no envido after the first round, but still the truco', () => {
      const game = startGame();
      playRoundAndMoveOn(game);

      expect(game.getOptionsForPlayer(PlayerId.Player0)).toEqual([[TrucoCall.Truco], []]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)).toEqual([[TrucoCall.Truco], []]);
    });

    it('offers the options of a new hand after the previous one ended', () => {
      const game = startGame();
      askTruco(game, TrucoCall.Truco, PlayerId.Player1);
      game.giveUpHand(PlayerId.Player0);

      expect(game.getOptionsForPlayer(PlayerId.Player0)).toEqual([[TrucoCall.Truco], ALL_ENVIDO]);
      expect(game.getOptionsForPlayer(PlayerId.Player1)).toEqual([[TrucoCall.Truco], ALL_ENVIDO]);
    });
  });

  describe('setPointsFromEnvido', () => {
    it('awards the envido to the player with more points', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('awards the envido to player 0 when they have more points', () => {
      const game = startGame(
        hands(
          [card(4, Suit.Cups), card(1, Suit.Coins), card(12, Suit.Swords)],
          [card(7, Suit.Coins), card(6, Suit.Coins), card(1, Suit.Clubs)],
        ),
      );
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player0)).toBe(2);
      expect(pointsOf(game, PlayerId.Player1)).toBe(0);
    });

    it('awards a tie to the mano', () => {
      const game = startGame(
        hands(
          [card(7, Suit.Cups), card(3, Suit.Cups), card(1, Suit.Coins)],
          [card(7, Suit.Coins), card(3, Suit.Coins), card(1, Suit.Swords)],
        ),
      );
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player1)).toBe(2);
      expect(pointsOf(game, PlayerId.Player0)).toBe(0);
    });

    it('awards the stakes of the whole chain of calls', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player0);
      game.answerEnvido(true, EnvidoCall.RealEnvido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player1)).toBe(7);
    });

    it('awards the points the loser is missing for falta envido', () => {
      const game = startGame();
      internals(game).player2.points = 12;
      game.answerEnvido(true, EnvidoCall.FaltaEnvido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player1)).toBe(18);
    });

    it('awards the whole game for falta envido with the winner at zero', () => {
      const game = startGame(defaultDeck(), 15);
      game.answerEnvido(true, EnvidoCall.FaltaEnvido, PlayerId.Player1);

      game.setPointsFromEnvido();

      expect(pointsOf(game, PlayerId.Player1)).toBe(15);
      expect(game.getGameWinner()).toBe(internals(game).player1);
    });

    it('resolves the envido so it cannot be called again', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.setPointsFromEnvido();

      expect(() => game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player0)).toThrow(
        'Envido has already been resolved',
      );
    });

    it('costs only 1 point to give up a hand after the envido was resolved', () => {
      const game = startGame();
      game.answerEnvido(true, EnvidoCall.Envido, PlayerId.Player1);
      game.setPointsFromEnvido();

      game.giveUpHand(PlayerId.Player0);

      expect(pointsOf(game, PlayerId.Player1)).toBe(2 + 1);
    });
  });
});
