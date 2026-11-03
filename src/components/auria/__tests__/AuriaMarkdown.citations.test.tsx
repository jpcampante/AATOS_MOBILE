import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaMarkdown } from '../AuriaMarkdown';
import type { WebSource } from '../../../features/auria/webResult';

const sources: WebSource[] = [
  { index: 1, url: 'https://site1.example/a', title: 'Source 1', domain: 'site1.example' },
  { index: 2, url: 'https://site2.example/a', title: 'Source 2', domain: 'www.site2.example' },
];

describe('AuriaMarkdown citations', () => {
  it('shows a cited source as a chip that opens it', () => {
    const onOpenSource = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AuriaMarkdown text="The price rose [1]." sources={sources} onOpenSource={onOpenSource} />,
    );
    const chip = getByLabelText('Source 1: Source 1');
    expect(chip).toBeTruthy();
    fireEvent.press(chip);
    expect(onOpenSource).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));
  });

  it('names the site without the www.', () => {
    const { getByText } = renderWithTheme(<AuriaMarkdown text="Both agree [2]." sources={sources} />);
    expect(getByText(' 2 site2.example ')).toBeTruthy();
  });

  it('leaves an index with no source behind it as text', () => {
    const { queryByLabelText } = renderWithTheme(<AuriaMarkdown text="See note [7]." sources={sources} />);
    expect(queryByLabelText(/^Source 7/)).toBeNull();
  });

  it('renders an answer with no sources as before', () => {
    const { getByText } = renderWithTheme(<AuriaMarkdown text="Plain answer." />);
    expect(getByText('Plain answer.')).toBeTruthy();
  });
});
