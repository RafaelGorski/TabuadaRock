import type { ScreenFactory } from '../app';
import type { BackendKind } from '../data/db';
import type { PersistStatus, Profile, Settings } from '../data/store';
import { confirmButton, download, fill, fmtDateTime, h, pickFile, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import { portrait } from '../ui/parts';
import { backButton, emptyStage, guard } from './kit';

type Flag = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];

const KIND: Record<BackendKind, string> = {
  indexeddb: 'O progresso fica no banco de dados deste navegador (IndexedDB), com uma segunda cópia guardada à parte.',
  localstorage: 'O progresso fica no armazenamento simples deste navegador.',
  memory: 'Este navegador não deixou salvar nada. O progresso some ao fechar a página: baixe um backup antes de sair.',
};
const PERSIST: Record<PersistStatus, string> = {
  persistente: 'Proteção ligada: o navegador não apaga estes dados para liberar espaço.',
  normal: 'Sem proteção extra: se o disco encher, o navegador pode apagar os dados.',
  indisponivel: 'Este navegador não oferece proteção extra. O backup é a sua garantia.',
};

export const opcoes: ScreenFactory<'opcoes'> = (app, params) => {
  const alive = guard(app);
  const switches = new Map<Flag, HTMLButtonElement>();

  const leave = () => {
    app.sound.back();
    app.go(params?.from === 'torre' && app.profile ? 'torre' : 'menu');
  };

  const flag = (key: Flag, label: string, help: Child, after?: (on: boolean) => void) => {
    const id = `opt-${key}`;
    const b = h(
      'button',
      { type: 'button', role: 'switch', class: 'switch', id, 'aria-checked': String(app.settings[key]), 'aria-describedby': `${id}-help` },
      h('span', { class: 'switch__track', 'aria-hidden': 'true' }),
      label,
    );
    b.addEventListener('click', async () => {
      const on = !app.settings[key];
      b.setAttribute('aria-checked', String(on));
      await app.saveSettings({ [key]: on });
      if (on) app.sound.ok();
      else app.sound.back();
      after?.(on);
    });
    switches.set(key, b);
    return h('li', { class: 'setting' }, b, h('p', { class: 'setting__help', id: `${id}-help` }, help));
  };

  const voiceNote = !app.voice.available
    ? ' Este navegador não tem narrador.'
    : !app.voice.speaksPortuguese
      ? ' Não achamos uma voz em português neste aparelho, então o narrador fica calado.'
      : '';
  const micNote = app.listener.available
    ? 'A criança fala o resultado e o jogo responde por ela. Precisa dar permissão de microfone ao navegador.'
    : 'Este navegador não entende fala, então a resposta continua sendo digitada.';

  const vol = h('input', { type: 'range', id: 'opt-volume', min: 0, max: 100, step: 5, value: String(Math.round(app.settings.volume * 100)), 'aria-describedby': 'opt-volume-out' });
  const volOut = h('output', { id: 'opt-volume-out', for: 'opt-volume', class: 'range__out' }, `${vol.value}%`);
  vol.addEventListener('input', () => {
    volOut.textContent = `${vol.value}%`;
    app.sound.setVolume(Number(vol.value) / 100);
  });
  vol.addEventListener('change', () => {
    void app.saveSettings({ volume: Number(vol.value) / 100 });
    app.sound.ok();
  });

  const kindLine = h('p', { class: 'data__line' }, icon('book'), KIND[app.store.kind]);
  if (app.store.kind === 'memory') kindLine.classList.add('is-warn');
  const persistLine = h('p', { class: 'data__line' });
  const backupLine = h('p', { class: 'data__line' });
  const protect = h('button', { type: 'button', class: 'btn btn--small', hidden: true }, icon('shield'), 'Proteger os dados');
  const saveBtn = h('button', { type: 'button', class: 'btn btn--primary' }, icon('download'), 'Baixar backup');
  const loadBtn = h('button', { type: 'button', class: 'btn' }, icon('upload'), 'Carregar backup');
  const fighters = h('ul', { class: 'roster' });

  function showPersist(s: PersistStatus) {
    fill(persistLine, icon(s === 'persistente' ? 'check' : 'shield'), PERSIST[s]);
    protect.hidden = s !== 'normal';
  }
  function showBackup(at: number | null) {
    fill(backupLine, icon('download'), at ? `Último backup baixado em ${fmtDateTime(at)}.` : 'Nenhum backup baixado ainda.');
  }

  protect.addEventListener('click', async () => {
    const s = await app.store.requestPersistence();
    if (!alive()) return;
    showPersist(s);
    if (s === 'persistente') app.toast('Proteção ligada.');
    else app.toast('O navegador não liberou a proteção agora. Ela costuma vir depois de jogar mais vezes. Até lá, baixe backups.', 'erro');
  });

  saveBtn.addEventListener('click', async () => {
    try {
      const data = await app.store.exportData();
      const d = new Date();
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      download(`tabuada-rock-backup-${day}.json`, data);
      await app.store.markBackup();
      showBackup(Date.now());
      app.toast(`Backup baixado com ${data.profiles.length} lutador${data.profiles.length === 1 ? '' : 'es'}. Guarde o arquivo em um lugar seguro.`);
    } catch (err) {
      console.error(err);
      app.toast('Não deu para gerar o backup. Tente de novo.', 'erro');
    }
  });

  loadBtn.addEventListener('click', async () => {
    const file = await pickFile('.json,application/json');
    if (!file || !alive()) return;
    loadBtn.disabled = true;
    try {
      let json: unknown;
      try {
        json = JSON.parse(await file.text());
      } catch {
        throw new Error('Não deu para ler esse arquivo. Escolha o arquivo .json que o botão Baixar backup criou.');
      }
      const r = await app.store.importData(json, false);
      if (app.profile) app.profile = (await app.store.getProfile(app.profile.id)) ?? app.profile;
      app.toast(`Backup carregado: ${r.profiles} lutador${r.profiles === 1 ? '' : 'es'} e ${r.attempts} luta${r.attempts === 1 ? '' : 's'} nova${r.attempts === 1 ? '' : 's'}.`);
      await renderFighters();
    } catch (err) {
      console.error(err);
      app.toast(err instanceof Error ? err.message : 'Não deu para carregar o backup.', 'erro');
    } finally {
      loadBtn.disabled = false;
    }
  });

  async function renderFighters() {
    let list: Profile[] = [];
    try {
      list = await app.store.listProfiles();
    } catch (err) {
      console.error(err);
    }
    if (!alive()) return;
    if (!list.length) {
      fill(fighters, h('li', { class: 'roster__empty' }, 'Nenhum lutador ainda. Crie o primeiro em Jogar.'));
      return;
    }
    fill(
      fighters,
      list.map((p) => {
        const nameId = `fighter-${p.id}`;
        const reset = confirmButton('Zerar progresso', 'Clique de novo para zerar', async () => {
          try {
            const fresh = await app.store.resetProgress(p.id);
            if (app.profile?.id === p.id) app.profile = fresh ?? null;
            app.toast(`A torre de ${p.name} recomeçou na tabuada do 2. As lutas antigas continuam nos recordes.`);
          } catch (err) {
            console.error(err);
            app.toast('Não deu para zerar agora. Tente de novo.', 'erro');
          }
          await renderFighters();
        });
        const del = confirmButton('Apagar lutador', 'Clique de novo para apagar', async () => {
          try {
            await app.store.deleteProfile(p.id);
            if (app.profile?.id === p.id) await app.setProfile(null);
            app.toast(`${p.name} foi apagado, junto com as lutas dele.`);
          } catch (err) {
            console.error(err);
            app.toast('Não deu para apagar agora. Tente de novo.', 'erro');
          }
          await renderFighters();
        });
        reset.setAttribute('aria-describedby', nameId);
        del.setAttribute('aria-describedby', nameId);
        return h('li', { class: 'roster__item' }, portrait(app, p.starter, 'roster__img'), h('span', { class: 'roster__name', id: nameId }, p.name), h('span', { class: 'roster__acts' }, reset, del));
      }),
    );
  }

  const group = (id: string, ic: Parameters<typeof icon>[0], title: string, ...body: Child[]) =>
    h('section', { class: 'group', 'aria-labelledby': id }, h('h2', { class: 'group__title', id }, icon(ic), title), body);
  const readAloud = () => switches.get('readAloud');
  const el = h(
    'section',
    { 'aria-labelledby': 'opt-title', class: 'board opcoes' },
    h('div', { class: 'topbar' }, backButton('Voltar', leave)),
    h(
      'div',
      { class: 'board__sheet plate plate--paper' },
      h('h1', { class: 'title board__title', id: 'opt-title' }, 'Opções'),
      h(
        'div',
        { class: 'opcoes__cols' },
        h(
          'div',
          { class: 'opcoes__col' },
          group(
            'opt-som',
            'sound',
            'Som e voz',
            h(
              'ul',
              { class: 'settings' },
              flag('sfx', 'Efeitos sonoros', 'Golpes, acertos e botões.'),
              flag('music', 'Música', 'A trilha dos menus e das lutas.', (on) => on && app.music.play('menu')),
              flag('narrator', 'Narrador', `Uma voz anuncia os rounds e explica as contas.${voiceNote}`, (on) => {
                const r = readAloud();
                if (r) r.disabled = !on;
                if (on) void app.say('Narrador ligado.');
              }),
              flag('readAloud', 'Ler cada conta em voz alta', 'O narrador lê as perguntas da luta. Precisa do narrador ligado.'),
              flag('speak', 'Responder falando', micNote),
              h('li', { class: 'setting setting--range' }, h('label', { for: 'opt-volume', class: 'field__label' }, 'Volume geral'), h('span', { class: 'range' }, vol, volOut)),
            ),
          ),
          group(
            'opt-jogo',
            'sliders',
            'Jogo',
            h(
              'ul',
              { class: 'settings' },
              flag('shake', 'Tremer a tela nos golpes', app.reduced ? 'Seu aparelho pede menos movimento, então a tela não treme mesmo ligado.' : 'Desligue se a tela tremendo incomodar.'),
              flag('keypad', 'Teclado de números na tela', 'Botões de 0 a 9 para responder com o mouse. Em tela de toque eles aparecem sempre.'),
            ),
          ),
        ),
        h(
          'div',
          { class: 'opcoes__col' },
          group(
            'opt-dados',
            'shield',
            'Seus dados',
            h('p', null, 'Os lutadores, as estrelas e os recordes ficam salvos neste navegador. Atualizar o jogo não apaga nada. Limpar os dados do navegador, usar janela anônima ou trocar de aparelho, sim.'),
            kindLine,
            persistLine,
            protect,
            backupLine,
            h('div', { class: 'actions' }, saveBtn, loadBtn),
            h('p', { class: 'setting__help' }, 'Carregar um backup junta o arquivo com o que já está salvo. Nada daqui é apagado.'),
          ),
          group('opt-lutadores', 'users', 'Lutadores', h('p', { class: 'setting__help' }, 'Zerar e apagar não têm volta. Baixe um backup antes.'), fighters),
        ),
      ),
    ),
  );

  return {
    el,
    async enter() {
      emptyStage(app, 'treino');
      app.music.play('menu');
      const r = readAloud();
      if (r) r.disabled = !app.settings.narrator;
      const sp = switches.get('speak');
      if (sp) sp.disabled = !app.listener.available;
      switches.get('sfx')?.setAttribute('data-autofocus', '');
      fill(persistLine, icon('shield'), 'Verificando a proteção dos dados…');
      fill(backupLine, icon('download'), 'Verificando o último backup…');
      void renderFighters();
      try {
        const [s, at] = await Promise.all([app.store.persistStatus(), app.store.getLastBackup()]);
        if (!alive()) return;
        showPersist(s);
        showBackup(at);
      } catch (err) {
        console.error(err);
      }
    },
    back: leave,
  };
};
