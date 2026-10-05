import type { ScreenFactory } from '../app';
import type { Actor } from '../engine/world';
import { COUNTER_BONUS, pickAttack, superOf, tossOpener } from '../game/attacks';
import { CREATURES } from '../game/creatures';
import * as F from '../game/facts';
import { LEVELS, levelById } from '../game/levels';
import { MISTAKES_ALLOWED, matchup } from '../game/types';
import { announce, fill, h, type Child } from '../ui/dom';
import { FightHud } from '../ui/hud';
import { Announcer, pop } from '../ui/parts';
import { QuestionPlate } from '../ui/question';
import { guard, isWide, progressOf } from './kit';
import { explainBody, lostBody, pauseBox } from './luta-panels';

type Phase = 'intro' | 'ask' | 'busy' | 'explain' | 'lost' | 'over';

function battleVariant(...parts: (string | number)[]): number {
  let hash = 17;
  for (const part of parts) {
    for (const c of String(part)) hash = (hash * 31 + c.charCodeAt(0)) % 97;
  }
  return (hash + Math.floor(Math.random() * 31)) % 97;
}

export const luta: ScreenFactory<'luta'> = (app, { level, partner, stage }) => {
  const alive = guard(app);
  const L = levelById(level);
  const p = app.profile!;
  const lp = progressOf(p, L.id);
  const me = CREATURES[partner];
  const rv = CREATURES[L.rival];
  const maxLives = MISTAKES_ALLOWED[matchup(me.type, rv.type)];
  const song = L.table === null ? 'chefe' : 'luta';
  const variant = battleVariant(partner, L.rival, stage ?? L.stage);
  const rng = F.makeRng();
  const tw = app.world.tw;
  const hud = new FightHud(app, partner, L.rival);
  const ann = new Announcer(app);
  const plate = new QuestionPlate(app);
  const layer = h('div', { class: 'pops' });
  const side = h('section', { class: 'fightpanel plate plate--paper', hidden: true, 'aria-labelledby': 'fp-title' });
  let pauseEl: HTMLElement | null = null;

  let score = 0;
  let mistakes = 0;
  let correct = 0;
  let ms = 0;
  let maxCombo = 0;
  let perfect = 0;
  let snap = { score, mistakes, correct, ms, maxCombo, perfect };

  let queue: F.Slot[] = [];
  let pos = 0;
  let hp = 0;
  let hpMax = 0;
  let lives = maxLives;
  let combo = 0;
  let charge = 0;
  let roundMistakes = 0;
  let missed: F.Question[] = [];
  let qTime = 0;
  let limit: number | null = null;
  let lastSec = -1;
  let hinted = false;
  const attempted = new Set<string>();
  const firstTryFacts = new Set<string>();
  let firstTry = 0;
  let rewardEventId = '';
  let retype = 0;
  /** Points multiplier earned when the rival opens the round. */
  let counter = 1;
  /** How many hits the rival has landed, so its super move comes on a beat. */
  let rivalHits = 0;
  let phase: Phase = 'intro';
  let paused = false;
  let anim: Promise<unknown> = Promise.resolve();
  let hero!: Actor;
  let foe!: Actor;

  const el = h(
    'section',
    { 'aria-labelledby': 'luta-title', class: 'luta' },
    h('h1', { class: 'sr-only', id: 'luta-title' }, `${L.name}: ${me.name} contra ${rv.name}`),
    hud.el,
    layer,
    ann.el,
    side,
    plate.el,
  );
  el.addEventListener('pointerdown', (e) => {
    if ((phase === 'ask' || phase === 'explain') && !(e.target as Element).closest('input, button, a, label')) e.preventDefault();
  });

  function layout() {
    const open = !side.hidden;
    if (isWide()) app.world.setSafeArea(open ? { top: 0.17, bottom: 0.64, left: 0, right: 0.64 } : { top: 0.17, bottom: 0.64 });
    else app.world.setSafeArea(open ? { top: 0.13, bottom: 0.34 } : { top: 0.13, bottom: 0.52 });
    app.world.frameFight(false, { yaw: 0.1, pitch: 0.08, speed: 2.2 });
  }

  function showSide(kind: string, title: string, body: Child[]) {
    side.dataset.kind = kind;
    fill(side, h('h2', { class: 'fp__title', id: 'fp-title' }, title), body);
    side.hidden = false;
    layout();
    if (kind !== 'explain') app.focusStart(side);
  }

  function hideSide() {
    if (side.hidden) return;
    side.hidden = true;
    side.replaceChildren();
    layout();
  }

  async function startRound() {
    phase = 'intro';
    snap = { score, mistakes, correct, ms, maxCombo, perfect };
    queue = F.buildDuel(L, p.facts, rng).map((q) => ({ q, damage: true }));
    pos = 0;
    hp = hpMax = queue.length;
    lives = maxLives;
    combo = charge = roundMistakes = 0;
    counter = 1;
    rivalHits = 0;
    missed = [];
    attempted.clear();
    firstTryFacts.clear();
    firstTry = 0;
    rewardEventId = globalThis.crypto?.randomUUID?.() ?? `${p.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    hideSide();
    plate.hide();
    hud.setRound(1, 0, 'Duelo');
    hud.setHp(hp, hpMax);
    hud.setLives(lives, maxLives);
    hud.setScore(score);
    hud.setCombo(0);
    hud.setSuper(0);
    hud.setClock(null);
    hero.reset();
    foe.reset();
    await ann.show('Duelo único', { sub: L.table === null ? 'Todas as tabuadas misturadas' : 'Uma rodada para vencer este oponente', hold: 1.3 });
    if (!alive()) return;
    await opener();
    if (!alive()) return;
    app.sound.go();
    await ann.show('Lute!', { tone: 'brasa', hold: 0.45 });
    if (alive()) ask();
  }

  /**
   * Coin toss for who swings first. Winning gives the hero a free hit; losing only
   * costs a scare, and the first answer after it is worth double.
   */
  async function opener() {
    const first = tossOpener(rng);
    const name = first === 'heroi' ? me.name : rv.name;
    await ann.show(`${name} começa!`, { sub: first === 'heroi' ? 'Golpe de surpresa' : 'Revide valendo o dobro', tone: first === 'heroi' ? 'menta' : 'brasa', hold: 0.9 });
    if (!alive()) return;
    const atk = pickAttack(first === 'heroi' ? partner : L.rival, rng);
    if (first === 'heroi') {
      if (hp > 1) hp--;
      // The opener replaces one question's damage, but the child still answers every fact.
      queue[0].damage = false;
      const left = hp;
      await app.moves.strike(hero, foe, atk.type, {
        onHit: () => {
          app.sound.impact(atk.type, 1);
          pop(app, layer, foe.worldHead(), atk.name, 'pop pop--hit');
          hud.setHp(left, hpMax);
        },
      });
      announce(`${me.name} abriu com ${atk.name}.`);
    } else {
      counter = COUNTER_BONUS;
      await app.moves.strike(foe, hero, atk.type, { onHit: () => app.sound.impact(atk.type, 1) });
      announce(`${rv.name} abriu com ${atk.name}. O próximo acerto vale o dobro.`);
    }
  }

  function ask() {
    if (pos >= queue.length) return void roundWon();
    const q = queue[pos].q;
    phase = 'ask';
    qTime = 0;
    lastSec = -1;
    hinted = false;
    if (!attempted.has(F.keyOf(q)) && !hinted) { /* first response is tracked on submit */ }
    limit = null;
    hud.setClock(limit);
    plate.show(F.display(q), F.spoken(q), { hint: true });
    announce(F.spoken(q));
    if (app.settings.readAloud || app.canSpeak) void app.say(F.spoken(q));
  }

  plate.onSubmit = (v) => {
    if (paused) return;
    if (phase === 'explain') {
      if (v === retype) return void afterExplain();
      plate.flash('erro');
      app.sound.denied();
      plate.clear();
      return;
    }
    if (phase !== 'ask') return;
    if (v === F.answerOf(queue[pos].q)) void hit();
    else miss(false);
  };

  plate.onHint = () => {
    if (phase !== 'ask' || hinted || paused) return;
    hinted = true;
    const q = queue[pos].q;
    const text = q.reverse ? `Conte de ${q.a} em ${q.a} até chegar no ${q.a * q.b}.` : `Lembra do treino: ${F.trainingHint(q.a, q.b)}.`;
    plate.setHint(`${text} Com dica, o acerto vale menos pontos.`);
    plate.hintBtn.disabled = true;
    app.sound.sparkle();
    announce(text);
  };

  async function hit() {
    const slot = queue[pos];
    const q = slot.q;
    const key = F.keyOf(q);
    if (!attempted.has(key)) {
      attempted.add(key);
      if (!hinted) {
        firstTry++;
        firstTryFacts.add(key);
      }
    }
    const t = qTime * 1000;
    phase = 'busy';
    plate.lock(true);
    plate.flash('ok');
    app.sound.correct();
    F.record(p.facts, q, true, t);
    p.totals.answered++;
    p.totals.correct++;
    correct++;
    ms += t;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    charge++;
    const pts = F.pointsFor(t, combo, q.reverse, hinted) * counter;
    const doubled = counter > 1;
    counter = 1;
    score += pts;
    hud.setScore(score);
    hud.setCombo(combo);
    if (combo >= 2) app.sound.combo(combo);
    const big = charge >= 5;
    hud.setSuper(charge);
    if (big) charge = 0;
    if (slot.damage) hp--;
    const ko = hp <= 0;
    const left = hp;
    const ans = F.answerOf(q);
    const atk = big ? superOf(partner) : pickAttack(partner, rng);
    pop(app, layer, hero.worldHead(), `+${pts}`, 'pop pop--points');
    announce(`Certo! ${atk.name}. Mais ${pts} pontos${doubled ? ', em dobro pelo revide' : ''}.`);
    anim = anim.then(async () => {
      if (!alive()) return;
      let resultSpeech: Promise<void> = Promise.resolve();
      if (big) void ann.show(atk.name, { sub: 'Super golpe!', hold: 0.8, big: false });
      await app.moves.strike(hero, foe, atk.type, {
        power: atk.power,
        ko,
        onHit: () => {
          resultSpeech = app.say(String(ans), { rate: 0.92 });
          app.sound.impact(atk.type, atk.power);
          pop(app, layer, foe.worldHead(), String(ans), 'pop pop--hit');
          hud.setHp(left, hpMax);
          if (big) hud.setSuper(0);
          if (ko) app.sound.knockout();
        },
      });
      await resultSpeech;
    });
    if (ko) {
      await anim;
      if (alive()) void roundWon();
      return;
    }
    await anim;
    if (!alive()) return;
    pos++;
    ask();
  }

  function miss(timeout: boolean) {
    const q = queue[pos].q;
    attempted.add(F.keyOf(q));
    phase = 'busy';
    plate.lock(true);
    plate.flash('erro');
    app.sound.wrong();
    F.record(p.facts, q, false, qTime * 1000);
    p.totals.answered++;
    mistakes++;
    roundMistakes++;
    lives--;
    combo = charge = 0;
    hud.setCombo(0);
    hud.setSuper(0);
    hud.setLives(lives, maxLives);
    if (!missed.some((m) => F.keyOf(m) === F.keyOf(q))) missed.push(q);
    if (timeout) {
      hud.setClock(0);
      void ann.show('Tempo!', { tone: 'brasa', hold: 0.5, big: false });
    }
    const ko = lives <= 0;
    rivalHits++;
    const heavy = !ko && rivalHits % 3 === 0;
    const atk = heavy ? superOf(L.rival) : pickAttack(L.rival, rng);
    anim = anim.then(() => {
      if (!alive()) return undefined;
      if (heavy) void ann.show(atk.name, { sub: `${rv.name} revidou forte`, hold: 0.8, big: false });
      return app.moves.strike(foe, hero, atk.type, {
        power: atk.power,
        ko,
        onHit: () => {
          app.sound.impact(atk.type, atk.power);
          pop(app, layer, hero.worldHead(), atk.name, 'pop pop--hit');
          if (ko) app.sound.knockout();
        },
      });
    });
    if (ko) {
      void anim.then(() => {
        if (alive()) void roundLost();
      });
      return;
    }
    phase = 'explain';
    retype = F.answerOf(q);
    const e = explainBody(q, retype);
    showSide('explain', e.title, e.body);
    plate.lock(false);
    plate.clear();
    plate.hintBtn.hidden = true;
    plate.setHint(`Digite ${retype} para continuar.`, 'pedido');
    plate.focus();
    announce(`${timeout ? 'O tempo acabou.' : 'Não foi.'} ${rv.name} usou ${atk.name}. ${e.say}. Digite ${retype} para continuar.`);
    void app.say(e.say);
  }

  async function afterExplain() {
    phase = 'busy';
    plate.lock(true);
    plate.flash('ok');
    app.sound.ok();
    app.voice.stop();
    hideSide();
    F.requeue(queue, pos);
    pos++;
    await tw.wait(0.3);
    if (alive()) ask();
  }

  async function roundWon() {
    phase = 'over';
    plate.hide();
    app.voice.stop();
    hud.setRound(1, 1, 'Duelo');
    void hero.cheer(tw, 2);
    await ann.show('K.O.!', { tone: 'brasa', hold: 1 });
    if (!alive()) return;
    const clean = roundMistakes === 0;
    if (clean) {
      score += F.PERFECT_ROUND_BONUS;
      perfect++;
      hud.setScore(score);
      app.sound.sparkle();
      await ann.show('Perfeito!', { sub: `Mais ${F.PERFECT_ROUND_BONUS} pontos`, tone: 'menta', hold: 0.9 });
      if (!alive()) return;
    }
    void matchWon();
  }

  async function roundLost() {
    phase = 'lost';
    plate.hide();
    app.voice.stop();
    app.music.stop();
    app.music.jingle('derrota');
    void foe.cheer(tw, 2);
    void app.saveProfile();
    await ann.show('K.O.', { sub: `${rv.name} venceu o round`, tone: 'giz', hold: 1.1 });
    if (!alive()) return;
    showSide(
      'lost',
      'Não foi dessa vez',
      lostBody(rv.name, missed, {
        retry: () => {
          app.sound.ok();
          ({ score, mistakes, correct, ms, maxCombo, perfect } = snap);
          app.music.play(song, 0, variant);
          void startRound();
        },
        train: L.table === null ? null : () => app.go('treino', { level, partner }),
        torre: quit,
      }),
    );
  }

  async function matchWon() {
    phase = 'over';
    const stars = F.starsFor(mistakes);
    const prevBest = lp.best;
    const firstClear = !lp.cleared;
    const trained = L.table !== null && lp.trained;
    const allCleared = LEVELS.filter((level) => level.table !== null).every((level) => p.levels[level.id]?.cleared);
    const reward = await app.store.applyRewardSession(p.id, {
      eventId: rewardEventId,
      profileId: p.id,
      table: L.table ?? 'final',
      trained,
      firstClear,
      allTablesCleared: allCleared,
      won: true,
      firstTry,
      correctFacts: [...firstTryFacts],
      at: Date.now(),
    });
    const seals = reward.entry?.seals ?? 0;
    const rewardMessage = reward.reason === 'disabled'
      ? 'Recompensas desativadas pelo responsável.'
      : reward.reason === 'paused'
        ? 'As recompensas estão pausadas pelo responsável. Seu treino continua valendo.'
      : reward.reason === 'cap'
        ? 'O limite tranquilo de hoje ou da semana já foi alcançado. Continue treinando sem pressa.'
        : reward.reason === 'credited'
          ? firstTry < (reward.entry?.kind === 'novo' ? 8 : 9)
            ? 'Você concluiu a sessão; a precisão ainda não rendeu selos.'
            : 'Sessão registrada.'
          : 'Esta luta foi prática. Volte quando a revisão estiver disponível.';
    lp.cleared = true;
    lp.stars = Math.max(lp.stars, stars);
    lp.best = Math.max(lp.best, score);
    p.totals.wins++;
    const recruited = L.table !== null && !p.team.includes(L.rival);
    if (recruited) p.team.push(L.rival);
    const crowned = L.table === null && !p.champion;
    if (crowned) p.champion = true;
    await app.saveProfile();
    if (!alive()) return;
    let rank: number | null = null;
    try {
      const a = await app.store.addAttempt({ profileId: p.id, name: p.name, levelId: L.id, score, stars, mistakes, correct, ms: Math.round(ms), avgMs: correct ? Math.round(ms / correct) : 0, maxCombo, partner, at: Date.now() });
      const i = (await app.store.topAttempts(10)).findIndex((x) => x.id === a.id);
      rank = i >= 0 ? i + 1 : null;
    } catch (err) {
      console.error(err);
    }
    if (!alive()) return;
    app.music.stop();
    app.music.jingle('vitoria');
    await ann.show('Vitória!', { hold: 1.2 });
    if (!alive()) return;
    app.go('resultado', { level: L.id, partner, score, stars, mistakes, correct, ms: Math.round(ms), maxCombo, perfect, prevBest, rank, recruited, crowned, firstClear, firstTry, seals, rewardMessage });
  }

  function quit() {
    app.sound.back();
    app.go('torre', { level });
  }

  function pause() {
    if (paused || phase === 'over' || phase === 'lost') return;
    paused = true;
    app.world.paused = true;
    app.voice.stop();
    plate.lock(true);
    pauseEl = pauseBox(unpause, quit);
    for (const c of el.children) (c as HTMLElement).inert = true;
    el.append(pauseEl);
    app.focusStart(pauseEl);
  }

  function unpause() {
    if (!paused) return;
    paused = false;
    app.world.paused = false;
    pauseEl?.remove();
    pauseEl = null;
    for (const c of el.children) (c as HTMLElement).inert = false;
    app.sound.ok();
    if (phase === 'ask' || phase === 'explain') {
      plate.lock(false);
      plate.focus();
    }
  }

  let unsub = () => {};
  const mq = matchMedia('(min-width: 860px)');
  return {
    el,
    enter() {
      app.music.play(song, 0, variant);
      app.world.setStage(stage ?? L.stage);
      const [a, b] = app.world.setFighters(partner, L.rival);
      hero = a;
      foe = b!;
      layout();
      app.world.frameFight(true, { yaw: 0.1, pitch: 0.08 });
      mq.addEventListener('change', layout);
      lp.plays++;
      p.totals.matches++;
      void app.saveProfile();
      unsub = app.world.onFrame((gdt, dt) => {
        if (paused) return;
        if (phase !== 'lost' && phase !== 'over') p.totals.playMs += dt * 1000;
        if (phase !== 'ask') return;
        qTime += gdt;
        if (limit === null) return;
        const rest = limit - qTime;
        const sec = Math.max(0, Math.ceil(rest));
        if (sec !== lastSec) {
          lastSec = sec;
          hud.setClock(sec);
          if (sec > 0 && sec <= 5) app.sound.tick(sec <= 3);
        }
        if (rest <= 0) miss(true);
      });
      void startRound();
    },
    leave() {
      unsub();
      mq.removeEventListener('change', layout);
      app.world.paused = false;
      void app.saveProfile();
    },
    key(e) {
      if (paused || (phase !== 'ask' && phase !== 'explain')) return;
      if (/^\d$/.test(e.key) && document.activeElement !== plate.input) plate.focus();
    },
    back() {
      if (paused) return unpause();
      if (phase === 'lost') return quit();
      pause();
    },
    hidden: pause,
  };
};
