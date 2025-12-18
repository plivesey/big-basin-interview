import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('should render three bouncing dots', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('should render dots with correct styling', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('.w-2.h-2.bg-slate-400.rounded-full');
    expect(dots).toHaveLength(3);
  });

  it('should have staggered animation delays', () => {
    const { container } = render(<TypingIndicator />);
    const dots = container.querySelectorAll('.animate-bounce');

    // First dot has no delay
    expect(dots[0]).not.toHaveStyle({ animationDelay: '0.1s' });

    // Second dot has 0.1s delay
    expect(dots[1]).toHaveStyle({ animationDelay: '0.1s' });

    // Third dot has 0.2s delay
    expect(dots[2]).toHaveStyle({ animationDelay: '0.2s' });
  });
});
