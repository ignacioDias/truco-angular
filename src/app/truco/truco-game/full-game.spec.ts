import { afterEach, describe, expect, it, vi } from 'vitest';
import { Card, Suit } from '../card/card';
import { Deck } from '../deck';
import { Player } from '../player/player';
import { TurnTracker } from '../turn-tracker/turn-tracker';
import { EnvidoCall, PlayedCards, PlayerId, TrucoCall, opponentOf } from '../truco-types';
import { TrucoGame } from './truco-game';

type Hand = [Card, Card, Card];
type Deal = Record<PlayerId, Hand>;

// Read-only observation of state: actions and scoring still go through TrucoGame.
interface GameState {
  player1: Player;
  player2: Player;
  turnTracker: TurnTracker;
  currentPlayedCards: PlayedCards;
}

const card = (value: number, suit: Suit): Card => new Card(value, suit);

function winningDeal(winner: PlayerId): Deal {
  return {
    [winner]: [card(7, Suit.Swords), card(6, Suit.Swords), card(1, Suit.Cups)],
    [opponentOf(winner)]: [card(4, Suit.Coins), card(5, Suit.Coins), card(1, Suit.Clubs)],
  } as Deal;
}

function pardaDeal(thirdRoundWinner: PlayerId): Deal {
  return {
    [thirdRoundWinner]: [card(3, Suit.Cups), card(2, Suit.Cups), card(1, Suit.Swords)],
    [opponentOf(thirdRoundWinner)]: [card(3, Suit.Coins), card(2, Suit.Coins), card(4, Suit.Coins)],
  } as Deal;
}

/** A scripted match driver, not a second implementation of the game rules. */
class FullGameSimulation {
  readonly game: TrucoGame;
  readonly deals: Deal[];
  private readonly state: GameState;
  private readonly dealCard;
  private completedHands = 0;

  constructor(target: 15 | 30, deals: Deal[]) {
    // TrucoGame automatically deals the next hand even when the winning score was reached.
    this.deals = [...deals, winningDeal(PlayerId.Player0)];
    const cards = this.deals.flatMap((deal) => [...deal[PlayerId.Player1], ...deal[PlayerId.Player0]]);
    let index = 0;
    this.dealCard = vi.spyOn(Deck.prototype, 'deal').mockImplementation(() => {
      const next = cards[index++];
      if (!next) {
        throw new Error('Simulation exhausted its scripted deals');
      }
      return new Card(next.numericValue, next.suit);
    });
    this.game = new TrucoGame('Player 1', 'Player 0', target);
    this.state = this.game as unknown as GameState;
    this.game.newHand();
    this.expectDeal(0);
  }

  expectScore(player0: number, player1: number): void {
    expect([this.state.player2.points, this.state.player1.points]).toEqual([player0, player1]);
  }

  acceptTruco(call: TrucoCall, caller: PlayerId): void {
    this.ensurePlaying();
    expect(this.game.getOptionsForPlayer(caller)[0]).toContain(call);
    this.game.answerTruco(true, call, opponentOf(caller));
  }

  callEnvido(call: EnvidoCall, caller: PlayerId): void {
    this.ensurePlaying();
    expect(this.game.getOptionsForPlayer(caller)[1]).toContain(call);
    // The current Envido API registers the supplied player's call.
    this.game.answerEnvido(true, call, caller);
  }

  acceptEnvido(): void {
    this.ensurePlaying();
    this.game.setPointsFromEnvido();
  }

  declineEnvido(responder: PlayerId): void {
    this.ensurePlaying();
    this.game.answerEnvido(false, EnvidoCall.None, responder);
  }

  declineTruco(call: TrucoCall, responder: PlayerId): void {
    this.ensurePlaying();
    this.game.answerTruco(false, call, responder);
    this.expectNextHand();
  }

  surrender(player: PlayerId): void {
    this.ensurePlaying();
    this.game.giveUpHand(player);
    this.expectNextHand();
  }

  playBaza(): void {
    this.ensurePlaying();
    const first = this.state.turnTracker.getCurrentPlayer();
    const round = this.state.turnTracker.getRound();
    this.game.playCard(first, 0);
    this.game.playCard(opponentOf(first), 0);
    const cards = this.state.currentPlayedCards[round - 1];
    expect(cards[0]).not.toBeNull();
    expect(cards[1]).not.toBeNull();
    this.game.nextRound();
    if (this.state.currentPlayedCards.every((pair) => pair.every((played) => played === null))) {
      this.expectNextHand();
    }
  }

  expectRound(round: number, leader: PlayerId): void {
    expect(this.state.turnTracker.getRound()).toBe(round);
    expect(this.state.turnTracker.getCurrentPlayer()).toBe(leader);
  }

  expectWinner(winner: PlayerId | null): void {
    expect(this.game.getGameWinner()?.getId() ?? null).toBe(winner);
  }

  private ensurePlaying(): void {
    if (this.game.getGameWinner() !== null) {
      throw new Error('Simulation cannot continue after game over');
    }
  }

  private expectNextHand(): void {
    this.completedHands++;
    this.expectDeal(this.completedHands);
    expect(this.state.currentPlayedCards).toEqual([[null, null], [null, null], [null, null]]);
    expect(this.game.getOptionsForPlayer(PlayerId.Player0)).toEqual([
      [TrucoCall.Truco], [EnvidoCall.Envido, EnvidoCall.RealEnvido, EnvidoCall.FaltaEnvido],
    ]);
  }

  private expectDeal(index: number): void {
    const deal = this.deals[index];
    expect(this.state.player1.hand).toEqual(deal[PlayerId.Player1]);
    expect(this.state.player2.hand).toEqual(deal[PlayerId.Player0]);
    expect(this.dealCard).toHaveBeenCalledTimes((index + 1) * 6);
    this.expectRound(1, index % 2 === 0 ? PlayerId.Player1 : PlayerId.Player0);
  }
}

afterEach(() => vi.restoreAllMocks());

describe('full-game simulation', () => {
  it.each([PlayerId.Player0, PlayerId.Player1])(
    'plays a complete 15-point match won by player %s',
    (winner) => {
      const rival = opponentOf(winner);
      const simulation = new FullGameSimulation(15, [winningDeal(winner), pardaDeal(rival), winningDeal(winner), winningDeal(winner)]);
      const expectScores = (winnerPoints: number, rivalPoints: number) => {
        simulation.expectScore(winner === PlayerId.Player0 ? winnerPoints : rivalPoints,
          winner === PlayerId.Player1 ? winnerPoints : rivalPoints);
      };

      simulation.callEnvido(EnvidoCall.Envido, winner);
      simulation.callEnvido(EnvidoCall.Envido, rival);
      simulation.callEnvido(EnvidoCall.RealEnvido, winner);
      simulation.acceptEnvido();
      expectScores(7, 0);
      simulation.acceptTruco(TrucoCall.Truco, winner);
      simulation.acceptTruco(TrucoCall.ReTruco, rival);
      simulation.acceptTruco(TrucoCall.ValeCuatro, winner);
      simulation.playBaza();
      simulation.playBaza();
      expectScores(11, 0);
      simulation.expectWinner(null);

      // Both first bazas tie; only the third decides the hand.
      simulation.playBaza();
      simulation.expectRound(2, PlayerId.Player0);
      simulation.playBaza();
      simulation.expectRound(3, PlayerId.Player0);
      expectScores(11, 0);
      simulation.playBaza();
      expectScores(11, 1);

      // Declining an unaccepted first Truco is a mazo: one Envido + one Truco point.
      simulation.declineTruco(TrucoCall.Truco, rival);
      expectScores(13, 1);

      simulation.acceptTruco(TrucoCall.Truco, winner);
      simulation.playBaza();
      simulation.playBaza();
      expectScores(15, 1);
      simulation.expectWinner(winner);
      expect(() => simulation.playBaza()).toThrow('after game over');
      expectScores(15, 1);
    },
  );

  it('plays a 30-point match with alternating winners and independent hand state', () => {
    const winners: PlayerId[] = [0, 1, 0, 1, 0, 1, 0, 1, 0];
    const simulation = new FullGameSimulation(30, winners.map(winningDeal));
    const scores = [0, 0];
    for (const winner of winners) {
      simulation.expectWinner(null);
      simulation.callEnvido(EnvidoCall.Envido, winner);
      simulation.acceptEnvido();
      simulation.acceptTruco(TrucoCall.Truco, winner);
      simulation.acceptTruco(TrucoCall.ReTruco, opponentOf(winner));
      simulation.acceptTruco(TrucoCall.ValeCuatro, winner);
      simulation.playBaza();
      simulation.playBaza();
      scores[winner] += 6;
      simulation.expectScore(scores[0], scores[1]);
    }
    simulation.expectScore(30, 24);
    simulation.expectWinner(PlayerId.Player0);
  });

  it('keeps declined Envido, declined raises, and mazo points across a complete match', () => {
    const winner = PlayerId.Player1;
    const simulation = new FullGameSimulation(15, Array.from({ length: 5 }, () => winningDeal(winner)));

    // Four accepted-call points survive the rejection of the final Real Envido.
    simulation.callEnvido(EnvidoCall.Envido, winner);
    simulation.callEnvido(EnvidoCall.Envido, PlayerId.Player0);
    simulation.callEnvido(EnvidoCall.RealEnvido, winner);
    simulation.declineEnvido(PlayerId.Player0);
    simulation.expectScore(0, 4);
    simulation.surrender(PlayerId.Player0);
    simulation.expectScore(0, 5);

    simulation.acceptTruco(TrucoCall.Truco, PlayerId.Player0);
    simulation.declineTruco(TrucoCall.ReTruco, PlayerId.Player0);
    simulation.expectScore(0, 7);

    simulation.acceptTruco(TrucoCall.Truco, winner);
    simulation.acceptTruco(TrucoCall.ReTruco, PlayerId.Player0);
    simulation.declineTruco(TrucoCall.ValeCuatro, PlayerId.Player0);
    simulation.expectScore(0, 10);

    simulation.surrender(PlayerId.Player0);
    simulation.expectScore(0, 12);
    simulation.expectWinner(null);

    simulation.acceptTruco(TrucoCall.Truco, winner);
    simulation.acceptTruco(TrucoCall.ReTruco, PlayerId.Player0);
    simulation.playBaza();
    simulation.playBaza();
    simulation.expectScore(0, 15);
    simulation.expectWinner(winner);
  });

  it('ends the simulation immediately when Falta Envido wins the match, before any baza', () => {
    const simulation = new FullGameSimulation(15, [winningDeal(PlayerId.Player0)]);
    simulation.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0);
    simulation.acceptEnvido();

    simulation.expectScore(15, 0);
    simulation.expectWinner(PlayerId.Player0);
    expect(() => simulation.playBaza()).toThrow('after game over');
    expect(() => simulation.surrender(PlayerId.Player0)).toThrow('after game over');
    simulation.expectScore(15, 0);
  });
});
