import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaChatDocuments } from '../AuriaChatDocuments';
import { AuriaDocumentCard } from '../AuriaDocumentCard';
import type { AuriaDocument } from '../../../features/auria/documents';

const document = (over: Partial<AuriaDocument> = {}): AuriaDocument => ({
  id: 'doc-1',
  title: 'Q3 plan',
  format: 'markdown',
  version: 1,
  preview: 'The quarter in three parts.',
  chatId: 'c-1',
  updatedAt: null,
  ...over,
});

describe('AuriaDocumentCard', () => {
  it('says what it is and opens it', () => {
    const onOpen = jest.fn();
    const { getByText, getByLabelText } = renderWithTheme(
      <AuriaDocumentCard document={document()} onOpen={onOpen} />,
    );
    expect(getByText('Document')).toBeTruthy();
    expect(getByText('The quarter in three parts.')).toBeTruthy();
    fireEvent.press(getByLabelText('Open document: Q3 plan'));
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-1' }));
  });

  it('names a spreadsheet and a presentation by what they are', () => {
    const sheet = renderWithTheme(<AuriaDocumentCard document={document({ format: 'sheet-json' })} />);
    expect(sheet.getByText('Spreadsheet')).toBeTruthy();
    const deck = renderWithTheme(<AuriaDocumentCard document={document({ format: 'deck-json' })} />);
    expect(deck.getByText('Presentation')).toBeTruthy();
  });

  it('shows the version only once the server kept more than one', () => {
    const { queryByText } = renderWithTheme(<AuriaDocumentCard document={document()} />);
    expect(queryByText('v1')).toBeNull();
    const second = renderWithTheme(<AuriaDocumentCard document={document({ version: 4 })} />);
    expect(second.getByText('v4')).toBeTruthy();
  });
});

describe('AuriaChatDocuments', () => {
  it('shows nothing when the chat has no documents', () => {
    const { queryByText } = renderWithTheme(<AuriaChatDocuments documents={[]} />);
    expect(queryByText(/document/)).toBeNull();
  });

  it('counts them and opens the list', () => {
    const { getByText, queryByText, getByLabelText } = renderWithTheme(
      <AuriaChatDocuments documents={[document(), document({ id: 'doc-2', title: 'Budget' })]} />,
    );
    expect(getByText('2 documents in this chat')).toBeTruthy();
    expect(queryByText('Budget')).toBeNull();
    fireEvent.press(getByLabelText('2 documents in this chat, show the list'));
    expect(getByText('Budget')).toBeTruthy();
  });

  it('counts one document in the singular', () => {
    const { getByText } = renderWithTheme(<AuriaChatDocuments documents={[document()]} />);
    expect(getByText('1 document in this chat')).toBeTruthy();
  });
});
