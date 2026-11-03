import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaComposer } from '../AuriaComposer';
import { AuriaCreateMenu } from '../AuriaCreateMenu';

const menu = (onCreateFile: jest.Mock) =>
  renderWithTheme(
    <AuriaCreateMenu
      visible
      onClose={jest.fn()}
      onSendRequest={jest.fn()}
      onOpenCamera={jest.fn()}
      onAddFiles={jest.fn()}
      onCreateImage={jest.fn()}
      onCreateFile={onCreateFile}
      bottomOffset={0}
    />,
  );

describe('AuriaCreateMenu — new files (A043)', () => {
  it.each([
    ['Create document', 'doc'],
    ['Create spreadsheet', 'sheet'],
    ['Create presentation', 'slides'],
  ])('asks the Auria for a file from "%s"', (label, kind) => {
    const onCreateFile = jest.fn();
    const { getByText } = menu(onCreateFile);
    fireEvent.press(getByText('Tools'));
    fireEvent.press(getByText(label));
    expect(onCreateFile).toHaveBeenCalledWith(kind);
  });
});

describe('AuriaComposer — the file being asked for (A043)', () => {
  it('says what the next message creates and lets it be dropped', () => {
    const onExitCreateFile = jest.fn();
    const { getByText, getByLabelText, getByPlaceholderText } = renderWithTheme(
      <AuriaComposer createFile="sheet" onExitCreateFile={onExitCreateFile} />,
    );
    expect(getByText('New spreadsheet')).toBeTruthy();
    expect(getByPlaceholderText('Describe the new spreadsheet…')).toBeTruthy();
    fireEvent.press(getByLabelText("Don't create a new spreadsheet"));
    expect(onExitCreateFile).toHaveBeenCalled();
  });

  it('asks anything when no file was requested', () => {
    const { getByPlaceholderText, queryByText } = renderWithTheme(<AuriaComposer />);
    expect(getByPlaceholderText('Ask anything')).toBeTruthy();
    expect(queryByText('New document')).toBeNull();
  });
});
