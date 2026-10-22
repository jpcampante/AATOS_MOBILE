import { Alert } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import type { AuriaConversation } from '../../../features/auria/types';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaConversationMenu } from '../AuriaConversationMenu';

const chat: AuriaConversation = {
  id: 'c-1',
  title: 'Q3 plan',
  provider: 'auria_system',
  visibility: 'private',
  ownerPublicUid: null,
  isPinned: false,
  lastActivity: null,
  messageCount: 4,
  createdAt: null,
};

function setup(conversation: AuriaConversation = chat) {
  const props = { onClose: jest.fn(), onRename: jest.fn(), onSetPinned: jest.fn(), onDelete: jest.fn() };
  renderWithTheme(<AuriaConversationMenu conversation={conversation} {...props} />);
  return props;
}

describe('AuriaConversationMenu (shared sheet)', () => {
  it('renames the chat', () => {
    const { onRename, onClose } = setup();
    fireEvent.press(screen.getByRole('button', { name: 'Rename' }));
    fireEvent.changeText(screen.getByLabelText('Chat name'), '  Q4 plan ');
    fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onRename).toHaveBeenCalledWith('c-1', 'Q4 plan');
    expect(onClose).toHaveBeenCalled();
  });

  it('pins and unpins', () => {
    const { onSetPinned } = setup();
    fireEvent.press(screen.getByRole('button', { name: 'Pin' }));
    expect(onSetPinned).toHaveBeenCalledWith('c-1', true);
  });

  it('asks before deleting', () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      buttons?.find((b) => b.style === 'destructive')?.onPress?.();
    });
    const { onDelete } = setup({ ...chat, isPinned: true });
    expect(screen.getByRole('button', { name: 'Unpin' })).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(alert).toHaveBeenCalledWith('Delete this chat?', expect.stringContaining('Q3 plan'), expect.any(Array));
    expect(onDelete).toHaveBeenCalledWith('c-1');
    alert.mockRestore();
  });
});
