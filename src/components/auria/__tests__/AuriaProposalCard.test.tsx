import { fireEvent } from '@testing-library/react-native';
import { renderWithTheme } from '../../../test/renderWithTheme';
import { AuriaProposalCard } from '../AuriaProposalCard';
import type { AuriaProposal } from '../../../features/auria/proposals';

const proposal = (over: Partial<AuriaProposal> = {}): AuriaProposal => ({
  id: 'p-1',
  documentId: 'doc-1',
  documentTitle: 'Q3 plan',
  summary: 'Adds a risks section',
  title: null,
  revision: 2,
  formatChanges: false,
  format: 'markdown',
  status: 'pending',
  ...over,
});

describe('AuriaProposalCard', () => {
  it('says what would change and that nothing is saved yet', () => {
    const { getByText } = renderWithTheme(
      <AuriaProposalCard proposal={proposal()} onApply={jest.fn()} onReject={jest.fn()} />,
    );
    expect(getByText('Proposed change · Q3 plan')).toBeTruthy();
    expect(getByText('Adds a risks section')).toBeTruthy();
    expect(getByText('Not saved yet.')).toBeTruthy();
  });

  it('mentions a new name and a format change', () => {
    const { getByText } = renderWithTheme(
      <AuriaProposalCard
        proposal={proposal({ title: 'Q3 plan v2', formatChanges: true })}
        onApply={jest.fn()}
        onReject={jest.fn()}
      />,
    );
    expect(getByText('New name: Q3 plan v2')).toBeTruthy();
    expect(getByText("The document's format changes too.")).toBeTruthy();
  });

  it('applies and rejects', () => {
    const onApply = jest.fn();
    const onReject = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AuriaProposalCard proposal={proposal()} onApply={onApply} onReject={onReject} />,
    );
    fireEvent.press(getByLabelText('Apply the change to Q3 plan'));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1' }));
    fireEvent.press(getByLabelText('Reject the change to Q3 plan'));
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-1' }));
  });

  it('decides nothing twice while the server has it', () => {
    const onApply = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <AuriaProposalCard proposal={proposal()} busy onApply={onApply} onReject={jest.fn()} />,
    );
    fireEvent.press(getByLabelText('Apply the change to Q3 plan'));
    expect(onApply).not.toHaveBeenCalled();
  });
});
