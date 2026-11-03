import { imageSizeForRatio } from '../imageSize';

describe('imageSizeForRatio', () => {
  it('asks for the square size for 1:1', () => {
    expect(imageSizeForRatio('1:1')).toBe('1024x1024');
  });

  it('asks for the landscape size for any wider ratio', () => {
    expect(imageSizeForRatio('4:3')).toBe('1792x1024');
    expect(imageSizeForRatio('16:9')).toBe('1792x1024');
  });

  it('asks for the portrait size for any taller ratio', () => {
    expect(imageSizeForRatio('3:4')).toBe('1024x1792');
    expect(imageSizeForRatio('9:16')).toBe('1024x1792');
  });

  it('stays square for anything it cannot read', () => {
    expect(imageSizeForRatio('')).toBe('1024x1024');
    expect(imageSizeForRatio('wide')).toBe('1024x1024');
    expect(imageSizeForRatio('0:0')).toBe('1024x1024');
  });
});
