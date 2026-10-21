import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { cachedAttachmentUri, openAttachment } from '../../../features/auria/attachmentFiles';
import type { AuriaAttachment } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaMessageFiles } from '../AuriaMessageFiles';

jest.mock('../../../features/auria/attachmentFiles', () => ({
  cachedAttachmentUri: jest.fn(async (a: { id: string; name: string }) => `file:///cache/${a.id}/${a.name}`),
  openAttachment: jest.fn(),
}));

const open = openAttachment as jest.Mock;

const file = (id: string, name: string, isImage: boolean): AuriaAttachment => ({
  id,
  name,
  url: `https://api.test/auria/chat/attachments/${id}`,
  isImage,
  private: true,
});

beforeEach(() => jest.clearAllMocks());

describe('AuriaMessageFiles', () => {
  it('shows a lone image larger, labelled by its name', async () => {
    renderWithTheme(<AuriaMessageFiles files={[file('i1', 'photo.png', true)]} />);

    const img = screen.getByRole('image', { name: 'photo.png' });
    expect(img).toHaveStyle({ width: 200, height: 200 });
    await waitFor(() => expect(cachedAttachmentUri).toHaveBeenCalled());
  });

  it('shows several images as a grid, each saying its position', async () => {
    renderWithTheme(<AuriaMessageFiles files={[file('i1', 'a.png', true), file('i2', 'b.png', true)]} />);

    expect(screen.getByRole('image', { name: 'a.png, image 1 of 2' })).toHaveStyle({ width: 104 });
    expect(screen.getByRole('image', { name: 'b.png, image 2 of 2' })).toBeTruthy();
    await waitFor(() => expect(cachedAttachmentUri).toHaveBeenCalledTimes(2));
  });

  it('opens a file when its chip is tapped', async () => {
    open.mockResolvedValue(undefined);
    const notes = file('f1', 'notes.txt', false);
    renderWithTheme(<AuriaMessageFiles files={[notes]} />);

    fireEvent.press(screen.getByRole('button', { name: 'Open notes.txt' }));

    expect(open).toHaveBeenCalledWith(notes);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open notes.txt' })).not.toBeBusy());
  });

  it('tells the person when a file could not be opened', async () => {
    open.mockRejectedValue(new Error('offline'));
    const onOpenFailed = jest.fn();
    renderWithTheme(<AuriaMessageFiles files={[file('f1', 'notes.txt', false)]} onOpenFailed={onOpenFailed} />);

    fireEvent.press(screen.getByRole('button', { name: 'Open notes.txt' }));

    await waitFor(() => expect(onOpenFailed).toHaveBeenCalledWith("Couldn't open notes.txt."));
  });

  it('shows images and files of the same message together', async () => {
    renderWithTheme(<AuriaMessageFiles files={[file('i1', 'photo.png', true), file('f1', 'notes.txt', false)]} />);

    expect(screen.getByRole('image', { name: 'photo.png' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Open notes.txt' })).toBeTruthy();
    await waitFor(() => expect(cachedAttachmentUri).toHaveBeenCalled());
  });
});
