import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaWebSourceCover } from '../AuriaWebSourceCover';
import { AuriaSiteBadge } from '../AuriaSiteBadge';
import type { WebSource } from '../../../features/auria/webResult';

const mockUseWebImage = jest.fn();
jest.mock('../../../features/auria/useWebImage', () => ({
  useWebImage: (path?: string) => mockUseWebImage(path),
}));

const SIGNED = `/auria/web-image/?u=abc&s=${'a1'.repeat(20)}`;

const source = (over: Partial<WebSource> = {}): WebSource => ({
  index: 1,
  url: 'https://news.example/a',
  title: 'A headline',
  domain: 'www.news.example',
  ...over,
});

describe('AuriaWebSourceCover', () => {
  beforeEach(() => mockUseWebImage.mockReset());

  it('shows the site name while there is no picture', () => {
    mockUseWebImage.mockReturnValue(null);
    const { getByText } = renderWithTheme(<AuriaWebSourceCover source={source()} />);
    expect(getByText('news.example')).toBeTruthy();
  });

  it('shows the picture the server served', () => {
    mockUseWebImage.mockReturnValue('file:///cache/web/img');
    const { queryByText, UNSAFE_getByType } = renderWithTheme(
      <AuriaWebSourceCover source={source({ image: SIGNED })} />,
    );
    expect(queryByText('news.example')).toBeNull();
    expect(UNSAFE_getByType(require('react-native').Image).props.source).toEqual({ uri: 'file:///cache/web/img' });
  });

  it('asks only for the signed path the source carries', () => {
    mockUseWebImage.mockReturnValue(null);
    renderWithTheme(<AuriaWebSourceCover source={source({ image: SIGNED })} />);
    expect(mockUseWebImage).toHaveBeenCalledWith(SIGNED);
  });
});

describe('AuriaSiteBadge', () => {
  beforeEach(() => mockUseWebImage.mockReset());

  it('falls back to the site initial with no logo', () => {
    mockUseWebImage.mockReturnValue(null);
    const { getByText } = renderWithTheme(<AuriaSiteBadge source={source()} />);
    expect(getByText('N')).toBeTruthy();
  });

  it('shows the logo the server served', () => {
    mockUseWebImage.mockReturnValue('file:///cache/web/icon');
    const { queryByText } = renderWithTheme(<AuriaSiteBadge source={source({ icon: SIGNED })} />);
    expect(queryByText('N')).toBeNull();
  });
});
