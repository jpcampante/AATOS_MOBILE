import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaWebSearchToggle } from '../AuriaWebSearchToggle';
import {
  initialWebSearchState,
  webSearchButtonView,
  type WebSearchState,
} from '../../../features/auria/webSearchChoice';

const ready = (over: Partial<WebSearchState> = {}): WebSearchState => ({
  ...initialWebSearchState,
  status: 'ready',
  available: true,
  companyEnabled: true,
  mode: 'off',
  ...over,
});

const renderToggle = (state: WebSearchState) => {
  const onChoose = jest.fn();
  const onBlocked = jest.fn();
  const onRetry = jest.fn();
  const utils = renderWithTheme(
    <AuriaWebSearchToggle
      view={webSearchButtonView(state)}
      onChoose={onChoose}
      onBlocked={onBlocked}
      onRetry={onRetry}
    />,
  );
  return { ...utils, onChoose, onBlocked, onRetry };
};

describe('AuriaWebSearchToggle', () => {
  it('turns search on when it is off', () => {
    const { getByLabelText, onChoose } = renderToggle(ready());
    fireEvent.press(getByLabelText('Web search: Off'));
    expect(onChoose).toHaveBeenCalledWith('auto');
  });

  it('turns search off when it is on', () => {
    const { getByLabelText, onChoose } = renderToggle(ready({ mode: 'auto' }));
    fireEvent.press(getByLabelText('Web search: On'));
    expect(onChoose).toHaveBeenCalledWith('off');
  });

  it('says why it cannot be turned on when the company turned search off', () => {
    const { getByLabelText, onChoose, onBlocked } = renderToggle(ready({ companyEnabled: false }));
    fireEvent.press(getByLabelText('Web search: Off'));
    expect(onChoose).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledWith('Disabled for this company.');
  });

  it('says why it cannot be turned on when the server has no search', () => {
    const { getByLabelText, onBlocked } = renderToggle(ready({ available: false }));
    fireEvent.press(getByLabelText('Web search: Off'));
    expect(onBlocked).toHaveBeenCalledWith('Search is unavailable.');
  });

  it('reads the settings again after a failure', () => {
    const { getByLabelText, getByText, onRetry } = renderToggle(ready({ status: 'error' }));
    expect(getByText('Web · Retry')).toBeTruthy();
    fireEvent.press(getByLabelText('Retry web search settings'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('does not toggle while the choice is being saved', () => {
    const { getByLabelText, onChoose } = renderToggle(ready({ status: 'saving', mode: 'auto' }));
    fireEvent.press(getByLabelText('Web search: On'));
    expect(onChoose).not.toHaveBeenCalled();
  });
});
