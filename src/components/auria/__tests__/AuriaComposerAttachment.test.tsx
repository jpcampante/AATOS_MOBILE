import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaComposerAttachment, type ComposerAttachmentView } from '../AuriaComposerAttachment';

const item = (over: Partial<ComposerAttachmentView> = {}): ComposerAttachmentView => ({
  id: 'q1',
  uri: 'file:///picked/notes.txt',
  name: 'notes.txt',
  isImage: false,
  status: 'ready',
  progress: 1,
  ...over,
});

describe('AuriaComposerAttachment', () => {
  it('shows a queued file as a chip with its name', () => {
    renderWithTheme(<AuriaComposerAttachment item={item()} />);
    expect(screen.getByText('notes.txt')).toBeTruthy();
    expect(screen.getByLabelText('notes.txt')).toBeTruthy();
  });

  it('shows the upload progress', () => {
    renderWithTheme(<AuriaComposerAttachment item={item({ status: 'uploading', progress: 0.42 })} />);
    expect(screen.getByText('42%')).toBeTruthy();
    expect(screen.getByLabelText('notes.txt, uploading 42%')).toBeTruthy();
  });

  it('says why the upload failed', () => {
    renderWithTheme(<AuriaComposerAttachment item={item({ status: 'failed', error: 'File is too large' })} />);
    expect(screen.getByLabelText('notes.txt, File is too large')).toBeTruthy();
  });

  it('shows a queued photo as a thumbnail', () => {
    renderWithTheme(<AuriaComposerAttachment item={item({ isImage: true, name: 'photo.jpg', uri: 'file:///p.jpg' })} />);
    expect(screen.queryByText('photo.jpg')).toBeNull();
    expect(screen.getByLabelText('photo.jpg')).toBeTruthy();
  });

  it('removes the item', () => {
    const onRemove = jest.fn();
    renderWithTheme(<AuriaComposerAttachment item={item()} onRemove={onRemove} />);

    fireEvent.press(screen.getByRole('button', { name: 'Remove notes.txt' }));

    expect(onRemove).toHaveBeenCalledWith('q1');
  });
});
