import type { App } from '../app';
import { announce, h } from './dom';
import { icon, type IconName } from './icons';

const FALLBACK_URL = 'https://rafaelgorski.github.io/TabuadaRock/';

/** Where the game lives, so whoever receives the post can jogar também. */
function gameUrl(): string {
  const { origin, pathname } = window.location;
  return origin.startsWith('http') ? `${origin}${pathname}` : FALLBACK_URL;
}

const button = (label: string, ic: IconName, cls: string, run: () => void): HTMLButtonElement =>
  h('button', { type: 'button', class: `btn btn--small ${cls}`, onclick: run }, icon(ic), label);

/**
 * Share plate for a result. The text never carries the child's name or any
 * profile data: only the table, the score and the stars.
 */
export function shareBar(app: App, text: string): HTMLElement {
  const url = gameUrl();
  const full = `${text} ${url}`;
  const canNative = typeof navigator.share === 'function';

  const copy = async (done: string) => {
    try {
      await navigator.clipboard.writeText(full);
      app.toast(done);
      announce(done);
    } catch {
      app.toast('Não deu para copiar o texto neste navegador. Anote o placar e poste à mão.', 'erro');
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title: 'Tabuada Rock', text, url });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      void copy('Texto copiado. Cole no app onde quiser postar.');
    }
  };

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer');

  const act = (run: () => void) => () => {
    app.sound.ok();
    run();
  };

  return h(
    'section',
    { class: 'share plate plate--ink', 'aria-labelledby': 'share-title' },
    h('h2', { class: 'share__title', id: 'share-title' }, icon('share'), 'Mostre seu placar'),
    h(
      'div',
      { class: 'share__row' },
      canNative ? button('Compartilhar', 'share', 'btn--primary', act(() => void native())) : null,
      button('WhatsApp', 'whatsapp', '', act(() => open(`https://wa.me/?text=${encodeURIComponent(full)}`))),
      button('Instagram', 'instagram', '', act(() => void copy('Placar copiado! Abra o Instagram e cole no story ou na legenda.'))),
    ),
    h('p', { class: 'share__note' }, 'O texto leva só a tabuada, os pontos e as estrelas — nunca o seu nome. O Instagram não aceita texto pronto, então ele vai para a área de transferência.'),
  );
}
