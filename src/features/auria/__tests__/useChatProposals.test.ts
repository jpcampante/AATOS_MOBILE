import { act, renderHook, waitFor } from '@testing-library/react-native';
import { AuriaApiError } from '../api/errors';
import { decideProposal, listChatProposals } from '../api/documents';
import { mapApiProposal, mapApiProposals } from '../proposals';
import { PROPOSAL_TEXT, useChatProposals } from '../useChatProposals';

jest.mock('../api/documents', () => ({ listChatProposals: jest.fn(), decideProposal: jest.fn() }));

const list = listChatProposals as jest.Mock;
const decide = decideProposal as jest.Mock;

const raw = (over: Record<string, unknown> = {}) => ({
  id: 'p-1',
  document_id: 'doc-1',
  document_title: 'Q3 plan',
  summary: 'Adds a risks section',
  revision: 2,
  status: 'pending',
  format: 'markdown',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  list.mockResolvedValue(mapApiProposals([raw()]));
  decide.mockResolvedValue(undefined);
});

describe('mapApiProposal', () => {
  it('reads what the card shows', () => {
    expect(mapApiProposal(raw({ title: 'Q3 plan v2', format_changes: true }))).toMatchObject({
      id: 'p-1',
      documentId: 'doc-1',
      documentTitle: 'Q3 plan',
      summary: 'Adds a risks section',
      title: 'Q3 plan v2',
      revision: 2,
      formatChanges: true,
    });
  });

  it('drops one without a document and keeps only the pending ones', () => {
    expect(mapApiProposal(raw({ document_id: '' }))).toBeNull();
    expect(mapApiProposals([raw(), raw({ id: 'p-2', status: 'applied' })]).map((p) => p.id)).toEqual(['p-1']);
  });
});

describe('useChatProposals', () => {
  it('reads the proposals of the open chat', async () => {
    const { result } = renderHook(() => useChatProposals('c-1'));
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));
    expect(list).toHaveBeenCalledWith('c-1');
  });

  it('applies one and takes it off the list', async () => {
    const { result } = renderHook(() => useChatProposals('c-1'));
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));

    await act(async () => {
      await expect(result.current.decide(result.current.proposals[0], 'apply')).resolves.toBeNull();
    });
    expect(decide).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1', revision: 2 }), 'apply');
    expect(result.current.proposals).toHaveLength(0);
  });

  it('re-reads and says so when the document moved meanwhile', async () => {
    const { result } = renderHook(() => useChatProposals('c-1'));
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));
    decide.mockRejectedValue(new AuriaApiError({ code: 'conflict', status: 409 }));
    list.mockResolvedValue(mapApiProposals([raw({ revision: 3 })]));

    await act(async () => {
      await expect(result.current.decide(result.current.proposals[0], 'apply')).resolves.toBe(PROPOSAL_TEXT.changed);
    });
    expect(result.current.proposals[0].revision).toBe(3);
  });

  it('says it could not be saved on any other failure', async () => {
    const { result } = renderHook(() => useChatProposals('c-1'));
    await waitFor(() => expect(result.current.proposals).toHaveLength(1));
    decide.mockRejectedValue(new AuriaApiError({ code: 'server_error', status: 500 }));

    await act(async () => {
      await expect(result.current.decide(result.current.proposals[0], 'reject')).resolves.toBe(PROPOSAL_TEXT.failed);
    });
  });

  it('asks for nothing without a chat', async () => {
    renderHook(() => useChatProposals(null));
    await waitFor(() => expect(list).not.toHaveBeenCalled());
  });
});
