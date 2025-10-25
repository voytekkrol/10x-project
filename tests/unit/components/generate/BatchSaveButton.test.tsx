import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchSaveButton } from '../../../../src/components/generate/BatchSaveButton';

describe('BatchSaveButton', () => {
  it('should render correctly with saveable items', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={5}
        disabled={false}
        isSaving={false}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/save 5/i);
    expect(button).not.toBeDisabled();
  });

  it('should render with correct grammar for 1 item', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={1}
        disabled={false}
        isSaving={false}
      />
    );
    
    expect(screen.getByRole('button')).toHaveTextContent(/save 1/i);
  });

  it('should render correctly in disabled state', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={5}
        disabled={true}
        isSaving={false}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render correctly in saving state', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={5}
        disabled={false}
        isSaving={true}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/saving/i);
    expect(button).toBeDisabled();
    
    // Verify loading indicator is shown
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('should show zero state correctly', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={0}
        disabled={true}
        isSaving={false}
      />
    );
    
    // No button is rendered when saveableCount is 0
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <BatchSaveButton
        onClick={handleClick}
        saveableCount={5}
        disabled={false}
        isSaving={false}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <BatchSaveButton
        onClick={handleClick}
        saveableCount={5}
        disabled={true}
        isSaving={false}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when saving', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <BatchSaveButton
        onClick={handleClick}
        saveableCount={5}
        disabled={false}
        isSaving={true}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not show anything for zero items', () => {
    render(
      <BatchSaveButton
        onClick={vi.fn()}
        saveableCount={0}
        disabled={true}
        isSaving={false}
      />
    );
    
    // No button is rendered when saveableCount is 0
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
