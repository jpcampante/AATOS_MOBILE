import { screen, waitFor } from '@testing-library/react-native';
import { cachedAttachmentUri } from '../../../features/auria/attachmentFiles';
import type { AuriaAttachment } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaAttachmentImage } from '../AuriaAttachmentImage';

jest.mock('../../../features/auria/attachmentFiles', () => ({ cachedAttachmentUri: jest.fn() }));

const cached = cachedAttachmentUri as jest.Mock;

const image = (over: Partial<AuriaAttachment> = {}): AuriaAttachment => ({
  id: 'i1',
  name: 'photo.png',
  url: 'https://api.test/auria/chat/attachments/i1',
  isImage: true,
  private: true,
  ...over,
});

const shown = () => screen.getByRole('image', { name: 'photo.png' }).props.source;

beforeEach(() => cached.mockReset());

describe('AuriaAttachmentImage', () => {
  it('shows a private image from its local copy (Android drops the Bearer header)', async () => {
    cached.mockResolvedValue('file:///cache/auria-attachments/i1/photo.png');
    renderWithTheme(<AuriaAttachmentImage attachment={image()} style={{ width: 10, height: 10 }} />);

    expect(shown()).toBeUndefined(); // placeholder while it downloads
    await waitFor(() => expect(shown()).toEqual({ uri: 'file:///cache/auria-attachments/i1/photo.png' }));
  });

  it('keeps the placeholder when the download fails', async () => {
    cached.mockRejectedValue(new Error('404'));
    renderWithTheme(<AuriaAttachmentImage attachment={image()} style={{ width: 10, height: 10 }} />);

    await waitFor(() => expect(cached).toHaveBeenCalled());
    expect(shown()).toBeUndefined();
  });

  it('loads a public image straight from its URL', () => {
    renderWithTheme(
      <AuriaAttachmentImage attachment={image({ private: false, url: 'https://cdn.test/a.png' })} style={{ width: 10, height: 10 }} />,
    );
    expect(shown()).toEqual({ uri: 'https://cdn.test/a.png' });
    expect(cached).not.toHaveBeenCalled();
  });
});
