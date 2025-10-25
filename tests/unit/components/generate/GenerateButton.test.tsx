import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerateButton } from '../../../../src/components/generate/GenerateButton';

describe('GenerateButton', () => {
  it('should render correctly in enabled state', () => {
    render(<GenerateButton onClick={vi.fn()} disabled={false} isLoading={false} />);
    
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('should render correctly in disabled state', () => {
    render(<GenerateButton onClick={vi.fn()} disabled={true} isLoading={false} />);
    
    const button = screen.getByRole('button', { name: /generate/i });
    expect(button).toBeDisabled();
  });

  it('should render correctly in loading state', () => {
    render(<GenerateButton onClick={vi.fn()} disabled={false} isLoading={true} />);
    
    const button = screen.getByRole('button', { name: /generating/i });
    expect(button).toBeInTheDocument();
    // Verify loading indicator is shown
    expect(button.querySelector('svg.animate-spin')).toBeInTheDocument();
  });

  it('should show tooltip attribute when disabled with tooltipText', () => {
    render(
      <GenerateButton 
        onClick={vi.fn()} 
        disabled={true} 
        isLoading={false}
        tooltipText="Please enter valid text" 
      />
    );
    
    const button = screen.getByRole('button', { name: /generate/i });
    
    // Check for the title attribute which creates a tooltip
    expect(button).toHaveAttribute('title', 'Please enter valid text');
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<GenerateButton onClick={handleClick} disabled={false} isLoading={false} />);
    
    const button = screen.getByRole('button', { name: /generate/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<GenerateButton onClick={handleClick} disabled={true} isLoading={false} />);
    
    const button = screen.getByRole('button', { name: /generate/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should not call onClick when loading', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<GenerateButton onClick={handleClick} disabled={false} isLoading={true} />);
    
    const button = screen.getByRole('button', { name: /generating/i });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});
