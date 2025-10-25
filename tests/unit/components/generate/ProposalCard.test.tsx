import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProposalCard } from '../../../../src/components/generate/ProposalCard';
import type { ProposalViewModel } from '../../../../src/lib/types/generate-view.types';

describe('ProposalCard', () => {
  const defaultProposal: ProposalViewModel = {
    id: '1',
    originalFront: 'Test front',
    originalBack: 'Test back',
    currentFront: 'Test front',
    currentBack: 'Test back',
    status: 'pending',
    isEdited: false,
    validationErrors: {}
  };

  const handlers = {
    onFieldChange: vi.fn(),
    onAccept: vi.fn(),
    onReject: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in pending state', () => {
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    expect(screen.getByDisplayValue('Test front')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test back')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument();
    
    // Should not show any badges yet
    expect(screen.queryByText(/accepted/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rejected/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/edited/i)).not.toBeInTheDocument();
  });

  it('should render in accepted state', () => {
    render(
      <ProposalCard 
        proposal={{ ...defaultProposal, status: 'accepted' }}
        index={0}
        {...handlers}
      />
    );
    
    expect(screen.getByText(/accepted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
  });

  it('should not render rejected proposals', () => {
    const { container } = render(
      <ProposalCard 
        proposal={{ ...defaultProposal, status: 'rejected' }}
        index={0}
        {...handlers}
      />
    );
    
    // Rejected proposals should not render anything
    expect(container.firstChild).toBeNull();
  });

  it('should render in edited state', () => {
    render(
      <ProposalCard 
        proposal={{
          ...defaultProposal,
          status: 'edited',
          isEdited: true,
          currentFront: 'Edited front',
          currentBack: 'Edited back'
        }}
        index={0}
        {...handlers}
      />
    );
    
    // Check for the status badge with specific role/structure
    const statusBadge = screen.getByText((content, element) => {
      return element?.tagName === 'SPAN' && content === 'Edited';
    });
    expect(statusBadge).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edited front')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Edited back')).toBeInTheDocument();
  });

  it('should render validation errors', () => {
    render(
      <ProposalCard 
        proposal={{
          ...defaultProposal,
          validationErrors: {
            front: 'Front cannot be empty',
            back: 'Back cannot be empty'
          },
          currentFront: '',
          currentBack: ''
        }}
        index={0}
        {...handlers}
      />
    );
    
    expect(screen.getByText('Front cannot be empty')).toBeInTheDocument();
    expect(screen.getByText('Back cannot be empty')).toBeInTheDocument();
  });

  it('should call onFieldChange when front text is changed', async () => {
    const user = userEvent.setup();
    
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    const frontInput = screen.getByDisplayValue('Test front');
    // Just type additional text
    await user.type(frontInput, ' updated');
    
    // user.type() calls onChange for each character
    expect(handlers.onFieldChange).toHaveBeenCalled();
    // Verify it was called with the correct parameters (index and field)
    expect(handlers.onFieldChange.mock.calls[0][0]).toBe(0);
    expect(handlers.onFieldChange.mock.calls[0][1]).toBe('front');
  });

  it('should call onFieldChange when back text is changed', async () => {
    const user = userEvent.setup();
    
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    const backInput = screen.getByDisplayValue('Test back');
    // Just type additional text
    await user.type(backInput, ' updated');
    
    // user.type() calls onChange for each character
    expect(handlers.onFieldChange).toHaveBeenCalled();
    // Verify it was called with the correct parameters (index and field)
    expect(handlers.onFieldChange.mock.calls[0][0]).toBe(0);
    expect(handlers.onFieldChange.mock.calls[0][1]).toBe('back');
  });

  it('should call onAccept when accept button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    const acceptButton = screen.getByRole('button', { name: /accept/i });
    await user.click(acceptButton);
    
    expect(handlers.onAccept).toHaveBeenCalledWith(0);
  });

  it('should call onReject when reject button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await user.click(rejectButton);
    
    expect(handlers.onReject).toHaveBeenCalledWith(0);
  });

  it('should not render when proposal is rejected', () => {
    const { container } = render(
      <ProposalCard 
        proposal={{ ...defaultProposal, status: 'rejected' }}
        index={0}
        {...handlers}
      />
    );
    
    // Rejected proposals don't render, so container should be empty
    expect(container.firstChild).toBeNull();
  });
  
  it('should allow field editing when not rejected', async () => {
    const user = userEvent.setup();
    
    render(
      <ProposalCard 
        proposal={defaultProposal}
        index={0}
        {...handlers}
      />
    );
    
    const frontInput = screen.getByDisplayValue('Test front');
    const backInput = screen.getByDisplayValue('Test back');
    
    expect(frontInput).not.toBeDisabled();
    expect(backInput).not.toBeDisabled();
    
    await user.type(frontInput, ' updated');
    expect(handlers.onFieldChange).toHaveBeenCalled();
  });
});
