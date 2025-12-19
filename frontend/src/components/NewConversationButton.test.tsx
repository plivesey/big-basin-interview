import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewConversationButton } from './NewConversationButton';

describe('NewConversationButton', () => {
  describe('rendering', () => {
    it('should render a button', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      expect(button).toBeInTheDocument();
    });

    it('should have an accessible label', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      expect(button).toHaveAttribute('aria-label', 'New conversation');
    });

    it('should contain an SVG icon', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have hover styles', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      expect(button).toHaveClass('hover:bg-slate-100');
    });

    it('should have focus ring styles', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-indigo-500');
    });

    it('should have transition styles', () => {
      render(<NewConversationButton onClick={() => {}} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      expect(button).toHaveClass('transition-colors');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<NewConversationButton onClick={onClick} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick multiple times for single click', () => {
      const onClick = vi.fn();
      render(<NewConversationButton onClick={onClick} />);

      const button = screen.getByRole('button', { name: 'New conversation' });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});
