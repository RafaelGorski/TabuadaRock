import '@fontsource-variable/anybody/standard.css';
import '@fontsource-variable/anybody/standard-italic.css';
import './styles/base.css';
import './styles/hud.css';
import './styles/screens.css';
import './styles/play.css';
import './styles/ladder.css';
import './styles/board.css';
import { App } from './app';
import { Store } from './data/store';
import { SCREENS } from './screens';
import { h } from './ui/dom';

const root = document.getElementById('ui') as HTMLElement;
const canvas = document.getElementById('palco') as HTMLCanvasElement;

function fatal(title: string, text: string): void {
  root.replaceChildren(h('div', { class: 'fatal', role: 'alert' }, h('h1', { class: 'fatal__title' }, title), h('p', null, text)));
}

function webglOk(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function fontsReady(): Promise<void> {
  if (!document.fonts) return;
  const want = Promise.all([document.fonts.load('900 1em "Anybody Variable"'), document.fonts.load('italic 900 1em "Anybody Variable"')]);
  await Promise.race([want, new Promise((r) => setTimeout(r, 2500))]).catch(() => {});
}

async function boot(): Promise<void> {
  if (!webglOk()) {
    fatal('O 3D não ligou', 'Este navegador não conseguiu ligar o 3D (WebGL). Tente abrir no Chrome, Edge ou Firefox atualizados, ou ligue a aceleração de hardware nas configurações do navegador.');
    return;
  }
  let store: Store;
  try {
    [store] = await Promise.all([Store.open(), fontsReady()]);
  } catch (err) {
    console.error(err);
    fatal('Não deu para abrir os dados', 'O navegador bloqueou o armazenamento do jogo. Saia da janela anônima ou libere o armazenamento do site e recarregue a página.');
    return;
  }
  let app: App;
  try {
    app = new App(store, canvas, root, SCREENS);
  } catch (err) {
    console.error(err);
    fatal('O 3D não ligou', 'Seu navegador não conseguiu ligar o 3D. Feche outras abas pesadas e recarregue a página, ou tente outro navegador.');
    return;
  }
  try {
    app.settings = await store.getSettings();
  } catch (err) {
    console.warn(err);
  }
  app.applySettings();
  try {
    const id = await store.getActiveProfileId();
    if (id) app.profile = (await store.getProfile(id)) ?? null;
  } catch (err) {
    console.warn(err);
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    app.toast('O 3D parou por um instante. Se a tela ficar parada, recarregue a página: seu progresso está salvo.', 'erro');
  });
  app.world.start();
  app.go('attract');
  if (import.meta.env.DEV) (window as unknown as { app: App }).app = app;
}

void boot();
