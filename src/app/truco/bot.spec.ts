import { describe, expect, it } from 'vitest';
import { Bot } from './bot';
import { Card, Suit } from './card/card';
import { Player } from './player/player';
import { EnvidoCall, PlayerId, TrucoCall } from './truco-types';

const card = (numericValue: number, suit: Suit): Card =>
  new Card(numericValue, suit);

describe('Bot', () => {
  it('makes deterministic Envido decisions', () => {
    const weak = new Player(PlayerId.Player1, 'Bot');
    weak.setHand([
      card(1, Suit.Coins),
      card(1, Suit.Clubs),
      card(7, Suit.Cups),
    ]);
    expect(new Bot(weak).getAnswerToEnvido()).toBe(EnvidoCall.None);

    const strong = new Player(PlayerId.Player1, 'Bot');
    strong.setHand([
      card(7, Suit.Swords),
      card(6, Suit.Swords),
      card(1, Suit.Cups),
    ]);
    expect(new Bot(strong).getAnswerToEnvido()).toBe(EnvidoCall.FaltaEnvido);
  });

  it('plays the weakest card when it cannot beat the opponent card', () => {
    const player = new Player(PlayerId.Player1, 'Bot');
    player.setHand([
      card(3, Suit.Cups),
      card(4, Suit.Coins),
      card(5, Suit.Cups),
    ]);
    const bot = new Bot(player);
    const playedCards = [
      [card(7, Suit.Swords), null],
      [null, null],
      [null, null],
    ] as never;

    expect(bot.getCardToPlay(playedCards, 1)).toBe(1);
  });

  it('plays the weakest winning card when it can beat the opponent', () => {
    const player = new Player(PlayerId.Player1, 'Bot');
    player.setHand([
      card(1, Suit.Swords),
      card(3, Suit.Cups),
      card(4, Suit.Coins),
    ]);
    const bot = new Bot(player);
    const playedCards = [
      [card(5, Suit.Coins), null],
      [null, null],
      [null, null],
    ] as never;

    expect(bot.getCardToPlay(playedCards, 1)).toBe(1);
  });

  it('calls and answers Truco according to hand strength', () => {
    const player = new Player(PlayerId.Player1, 'Bot');
    player.setHand([
      card(1, Suit.Swords),
      card(1, Suit.Clubs),
      card(7, Suit.Swords),
    ]);
    const bot = new Bot(player);

    expect(bot.getTrucoCall([
      TrucoCall.Truco,
      TrucoCall.ReTruco,
      TrucoCall.ValeCuatro,
    ])).toBe(TrucoCall.ValeCuatro);
    expect(bot.shouldAcceptTruco(TrucoCall.ReTruco)).toBe(true);
  });
});
