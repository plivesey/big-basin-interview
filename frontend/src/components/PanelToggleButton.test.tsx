import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PanelToggleButton } from './PanelToggleButton';

describe('PanelToggleButton', () => {
  describe('when visible', () => {
    it('should be visible and clickable', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('opacity-100');
      expect(button).not.toHaveClass('pointer-events-none');
    });

    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should be focusable', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    it('should not be hidden from screen readers', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      expect(button).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('when not visible', () => {
    it('should be hidden with opacity-0', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={false} />);

      const button = screen.getByRole('button', { hidden: true });
      expect(button).toHaveClass('opacity-0');
      expect(button).toHaveClass('pointer-events-none');
    });

    it('should not be focusable', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={false} />);

      const button = screen.getByRole('button', { hidden: true });
      expect(button).toHaveAttribute('tabIndex', '-1');
    });

    it('should be hidden from screen readers', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={false} />);

      const button = screen.getByRole('button', { hidden: true });
      expect(button).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('accessibility', () => {
    it('should have an accessible label', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      expect(button).toHaveAttribute('aria-label', 'Open provider list');
    });

    it('should contain a chevron icon', () => {
      const onClick = vi.fn();
      render(<PanelToggleButton onClick={onClick} visible={true} />);

      const button = screen.getByRole('button', { name: 'Open provider list' });
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });
  });
});
