import { getAuriaComposerOverlayHeight, getChatBottomReserve } from '../auriaLayout';

describe('getChatBottomReserve', () => {
  const composerOnly = getAuriaComposerOverlayHeight();

  it('keeps the whole overlay clear when a notice makes it taller than the composer', () => {
    expect(getChatBottomReserve(composerOnly + 140)).toBe(composerOnly + 140);
  });

  it('never reserves less than the composer (before the first measurement)', () => {
    expect(getChatBottomReserve(0)).toBe(composerOnly);
    expect(getChatBottomReserve(composerOnly - 30)).toBe(composerOnly);
  });

  it('counts the keyboard in the floor', () => {
    expect(getChatBottomReserve(0, 300)).toBe(composerOnly + 300);
  });
});
