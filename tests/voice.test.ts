import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Voice } from '../src/audio/voice';

class FakeUtterance {
  lang = '';
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  volume = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly text: string) {}
}

describe('Voice audio ducking', () => {
  const utterances: FakeUtterance[] = [];
  const duck = vi.fn();
  const cancel = vi.fn();
  const speak = vi.fn((utterance: FakeUtterance) => utterances.push(utterance));

  beforeEach(() => {
    utterances.length = 0;
    duck.mockClear();
    cancel.mockClear();
    speak.mockClear();
    vi.stubGlobal('window', globalThis);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('speechSynthesis', {
      cancel,
      speak,
      getVoices: () => [],
      addEventListener: vi.fn(),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('keeps audio ducked when replay replaces narration', async () => {
    const voice = new Voice({ duck } as never);
    const first = voice.say('seis vezes sete');
    const replay = voice.say('seis vezes sete');

    expect(cancel).toHaveBeenCalledTimes(2);
    expect(duck.mock.calls).toEqual([[true], [true]]);

    utterances[0].onend?.();
    expect(duck).not.toHaveBeenCalledWith(false);

    utterances[1].onend?.();
    await Promise.all([first, replay]);
    expect(duck).toHaveBeenLastCalledWith(false);
  });

  it('always restores volume when narration is stopped', async () => {
    const voice = new Voice({ duck } as never);
    const pending = voice.say('quarenta e dois');

    voice.stop();
    utterances[0].onend?.();
    await pending;

    expect(cancel).toHaveBeenCalledTimes(2);
    expect(duck).toHaveBeenLastCalledWith(false);
  });

  it('restores volume if the browser rejects speech', async () => {
    speak.mockImplementationOnce(() => {
      throw new Error('speech failed');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const voice = new Voice({ duck } as never);

    await voice.say('sete');

    expect(duck).toHaveBeenLastCalledWith(false);
    warn.mockRestore();
  });
});
