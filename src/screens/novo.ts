import type { ScreenFactory } from '../app';
import { NAME_MAX, cleanName } from '../data/store';
import { CREATURES, STARTERS, type CreatureId } from '../game/creatures';
import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait, typeChip } from '../ui/parts';
import { backButton, guard, lineup, safeAreas } from './kit';

export const novo: ScreenFactory<'novo'> = (app) => {
  const alive = guard(app);
  let starter: CreatureId = STARTERS[0];
  let hasProfiles = false;
  let busy = false;

  const input = h('input', {
    id: 'novo-nome',
    type: 'text',
    maxlength: NAME_MAX,
    autocomplete: 'off',
    autocapitalize: 'words',
    enterkeyhint: 'done',
    'aria-describedby': 'novo-ajuda novo-erro',
    'data-autofocus': '',
  });
  const err = h('p', { class: 'error', id: 'novo-erro', hidden: true });
  const submit = h('button', { type: 'submit', class: 'btn btn--primary btn--big' }, 'Começar a torre', icon('right'));

  const show = (id: CreatureId, cheer: boolean) => {
    const cast = lineup(app, 'treino', [id], 1.5, { yaw: -0.25 }, false);
    if (cheer) void cast[0].cheer(app.world.tw, 2);
  };

  const picks = STARTERS.map((id) => {
    const c = CREATURES[id];
    const radio = h('input', { type: 'radio', name: 'parceiro', value: id, class: 'sr-only', checked: id === starter });
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      starter = id;
      app.sound.move();
      show(id, true);
    });
    return h(
      'label',
      { class: 'pick' },
      radio,
      portrait(app, id, 'pick__img'),
      h('span', { class: 'pick__name' }, c.name),
      typeChip(c.type),
      h('span', { class: 'pick__text' }, c.blurb),
      h('span', { class: 'pick__move' }, h('b', null, 'Golpe: '), c.move),
    );
  });

  const fail = (msg: string) => {
    err.textContent = msg;
    err.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    app.sound.denied();
  };

  const form = h(
    'form',
    { class: 'novo__form', novalidate: true },
    h(
      'div',
      { class: 'novo__name' },
      h('label', { for: 'novo-nome', class: 'field__label' }, 'Nome do lutador'),
      h('div', { class: 'field' }, input),
      h('p', { class: 'field__help', id: 'novo-ajuda' }, `Até ${NAME_MAX} letras. Pode ser apelido.`),
      err,
    ),
    h('fieldset', { class: 'picks' }, h('legend', { class: 'field__label' }, 'Escolha seu parceiro de luta'), picks),
    h('div', { class: 'actions' }, submit),
  );

  input.addEventListener('input', () => {
    if (!err.hidden) {
      err.hidden = true;
      input.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const name = cleanName(input.value);
    if (!name) return fail('Escreva um nome para o lutador. Pode ser só o apelido.');
    busy = true;
    submit.disabled = true;
    submit.replaceChildren('Criando lutador…');
    try {
      const p = await app.store.createProfile(name, starter);
      if (!alive()) return;
      await app.setProfile(p);
      void app.store.requestPersistence();
      app.sound.ok();
      void app.say(`Bem-vindo à torre, ${p.name}!`);
      app.go('torre');
    } catch (error) {
      if (!alive()) return;
      fail(error instanceof Error ? error.message : 'Não deu para criar o lutador. Tente de novo.');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.replaceChildren('Começar a torre', icon('right'));
    }
  });

  const leaveTo = () => {
    app.sound.back();
    app.go(hasProfiles ? 'perfis' : 'menu');
  };

  const el = h(
    'section',
    { 'aria-labelledby': 'novo-title', class: 'split split--wide' },
    h(
      'div',
      { class: 'split__main' },
      h('div', { class: 'topbar' }, backButton('Voltar', leaveTo)),
      h('h1', { class: 'title', id: 'novo-title' }, 'Novo lutador'),
      h('p', { class: 'lede' }, 'Seu nome vai para o ranking. Seu parceiro luta com você desde a primeira tabuada.'),
      form,
    ),
  );

  let off = () => {};
  return {
    el,
    enter() {
      app.music.play('menu');
      off = safeAreas(app, { top: 0.2, bottom: 0.92, left: 0.62, right: 1 }, { top: 0.03, bottom: 0.26 });
      show(starter, false);
      app.store
        .listProfiles()
        .then((ps) => (hasProfiles = ps.length > 0))
        .catch(() => {});
    },
    leave: () => off(),
    back: leaveTo,
  };
};
