import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaGeneratedImage } from '../AuriaGeneratedImage';
import { shareText } from '../../../features/auria/mediaActions';

jest.mock('../../../features/auria/mediaActions', () => ({ shareText: jest.fn(async () => null) }));

const share = shareText as jest.Mock;
const URL = 'https://host/media/auria/cat.png';

describe('AuriaGeneratedImage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the image with its brief', () => {
    const { getByLabelText, getByText } = renderWithTheme(<AuriaGeneratedImage url={URL} prompt="a cat on a roof" />);
    expect(getByLabelText('Open the image: a cat on a roof')).toBeTruthy();
    expect(getByText('a cat on a roof')).toBeTruthy();
  });

  it('shares the image with its link', async () => {
    const { getByLabelText } = renderWithTheme(<AuriaGeneratedImage url={URL} prompt="a cat" />);
    fireEvent.press(getByLabelText('Share image'));
    await waitFor(() => expect(share).toHaveBeenCalledWith('a cat', URL));
  });

  it('opens it full screen and closes again', async () => {
    const { getByLabelText, queryByLabelText } = renderWithTheme(<AuriaGeneratedImage url={URL} prompt="a cat" />);
    expect(queryByLabelText('Close')).toBeNull();
    fireEvent.press(getByLabelText('Open the image: a cat'));
    const close = getByLabelText('Close');
    expect(close).toBeTruthy();
    fireEvent.press(close);
    await waitFor(() => expect(queryByLabelText('Close')).toBeNull());
  });

  it('says what happened when sharing only copied the link', async () => {
    share.mockResolvedValue('Link copied to clipboard');
    const onFeedback = jest.fn();
    const { getByLabelText } = renderWithTheme(<AuriaGeneratedImage url={URL} onFeedback={onFeedback} />);
    fireEvent.press(getByLabelText('Share image'));
    await waitFor(() => expect(onFeedback).toHaveBeenCalledWith('Link copied to clipboard'));
  });
});
