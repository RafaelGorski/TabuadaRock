import { describe, expect, it } from 'vitest';
import { parseNumber } from '../src/audio/listen';

describe('parseNumber', () => {
  it('reads plain digits', () => {
    expect(parseNumber('42')).toBe(42);
    expect(parseNumber(' 7 ')).toBe(7);
    expect(parseNumber('100')).toBe(100);
  });

  it('reads numbers written out in Portuguese', () => {
    expect(parseNumber('quarenta e dois')).toBe(42);
    expect(parseNumber('vinte e um')).toBe(21);
    expect(parseNumber('sessenta')).toBe(60);
    expect(parseNumber('cem')).toBe(100);
    expect(parseNumber('dezesseis')).toBe(16);
  });

  it('survives accents, caps and filler words', () => {
    expect(parseNumber('É trinta e três')).toBe(33);
    expect(parseNumber('TRÊS')).toBe(3);
    expect(parseNumber('quatorze')).toBe(14);
  });

  it('reads digits spoken one by one', () => {
    expect(parseNumber('quatro dois')).toBe(42);
  });

  it('gives up when there is no number', () => {
    expect(parseNumber('não sei')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('oi tudo bem')).toBeNull();
  });
});
