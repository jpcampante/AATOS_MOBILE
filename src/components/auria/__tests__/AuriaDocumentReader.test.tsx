import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaDocumentReader } from '../AuriaDocumentReader';
import { getChatDocument } from '../../../features/auria/api/documents';
import type { AuriaDocument } from '../../../features/auria/documents';

jest.mock('../../../features/auria/api/documents', () => ({ getChatDocument: jest.fn() }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: Record<string, unknown>) => <View testID="webview" {...props} /> };
});

const read = getChatDocument as jest.Mock;

const document = (over: Partial<AuriaDocument> = {}): AuriaDocument => ({
  id: 'doc-1',
  title: 'Q3 plan',
  format: 'markdown',
  version: 1,
  preview: null,
  chatId: 'c-1',
  updatedAt: null,
  ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('AuriaDocumentReader', () => {
  it('shows nothing without a document', () => {
    const { queryByLabelText } = renderWithTheme(<AuriaDocumentReader document={null} onClose={jest.fn()} />);
    expect(queryByLabelText('Close the document')).toBeNull();
  });

  it('reads the body from the server and says it is read only', async () => {
    read.mockResolvedValue(document({ content: '# The plan' }));
    const { getByText } = renderWithTheme(<AuriaDocumentReader document={document()} onClose={jest.fn()} />);
    expect(read).toHaveBeenCalledWith('c-1', 'doc-1');
    await waitFor(() => expect(getByText('The plan')).toBeTruthy());
    expect(getByText('Document · read only')).toBeTruthy();
  });

  it('does not ask again for a body it already has', () => {
    const { getByText } = renderWithTheme(
      <AuriaDocumentReader document={document({ format: 'plain', content: 'Plain words' })} onClose={jest.fn()} />,
    );
    expect(read).not.toHaveBeenCalled();
    expect(getByText('Plain words')).toBeTruthy();
  });

  it('shows a spreadsheet as a table', async () => {
    const content = JSON.stringify({
      tableSheets: [{ title: 'Budget', data: { columns: ['Area'], rows: [['Marketing']] } }],
    });
    const { getByText } = renderWithTheme(
      <AuriaDocumentReader document={document({ format: 'sheet-json', content })} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(getByText('Marketing')).toBeTruthy());
    expect(getByText('1 row')).toBeTruthy();
  });

  it('shows a presentation as its slides', async () => {
    const content = JSON.stringify({
      outline: { title: 'Q3', slides: [{ title: 'Cover' }, { title: 'What changed' }] },
    });
    const { getByText } = renderWithTheme(
      <AuriaDocumentReader document={document({ format: 'deck-json', content })} onClose={jest.fn()} />,
    );
    await waitFor(() => expect(getByText('What changed')).toBeTruthy());
    expect(getByText('Slide 1')).toBeTruthy();
  });

  it('puts html in a web view that goes nowhere', async () => {
    const { getByTestId } = renderWithTheme(
      <AuriaDocumentReader document={document({ format: 'html', content: '<p>Hi</p>' })} onClose={jest.fn()} />,
    );
    const webview = getByTestId('webview');
    expect(webview.props.source).toEqual({ html: '<p>Hi</p>' });
    expect(webview.props.javaScriptEnabled).toBe(false);
    expect(webview.props.onShouldStartLoadWithRequest({ url: 'https://example.com' })).toBe(false);
  });

  it('says so when the document cannot be read', async () => {
    read.mockRejectedValue(new Error('404'));
    const { getByText } = renderWithTheme(<AuriaDocumentReader document={document()} onClose={jest.fn()} />);
    await waitFor(() => expect(getByText('This document could not be opened. Try again from the chat.')).toBeTruthy());
  });

  it('closes', async () => {
    read.mockResolvedValue(document({ content: 'x' }));
    const onClose = jest.fn();
    const { getByLabelText } = renderWithTheme(<AuriaDocumentReader document={document()} onClose={onClose} />);
    fireEvent.press(getByLabelText('Close the document'));
    expect(onClose).toHaveBeenCalled();
  });
});
