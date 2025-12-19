import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationListItem } from './ConversationListItem';

describe('ConversationListItem', () => {
  const mockSession = {
    id: 'session-123',
    title: "Miguel's Barber Shop",
    date: '2024-12-19T10:30:00.000Z',
  };

  describe('rendering', () => {
    it('should display the session title', () => {
      render(
        <ConversationListItem session={mockSession} isActive={false} onClick={() => {}} />
      );

      expect(screen.getByText("Miguel's Barber Shop")).toBeInTheDocument();
    });

    it('should display the formatted date', () => {
      render(
        <ConversationListItem session={mockSession} isActive={false} onClick={() => {}} />
      );

      // Date should be formatted as "19 DEC"
      expect(screen.getByText('19 DEC')).toBeInTheDocument();
    });

    it('should format single-digit days correctly', () => {
      const sessionWithSingleDigitDay = {
        ...mockSession,
        date: '2024-12-03T10:30:00.000Z',
      };

      render(
        <ConversationListItem
          session={sessionWithSingleDigitDay}
          isActive={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByText('3 DEC')).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('should apply active styling when isActive is true', () => {
      render(
        <ConversationListItem session={mockSession} isActive={true} onClick={() => {}} />
      );

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('bg-indigo-50');
      expect(listItem).toHaveClass('border-indigo-600');
    });

    it('should apply default styling when isActive is false', () => {
      render(
        <ConversationListItem session={mockSession} isActive={false} onClick={() => {}} />
      );

      const listItem = screen.getByRole('listitem');
      expect(listItem).not.toHaveClass('bg-indigo-50');
      expect(listItem).toHaveClass('hover:bg-slate-50');
    });

    it('should apply active text color when isActive is true', () => {
      render(
        <ConversationListItem session={mockSession} isActive={true} onClick={() => {}} />
      );

      const title = screen.getByText("Miguel's Barber Shop");
      expect(title).toHaveClass('text-indigo-700');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      render(
        <ConversationListItem session={mockSession} isActive={false} onClick={onClick} />
      );

      const listItem = screen.getByRole('listitem');
      fireEvent.click(listItem);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should have cursor-pointer class for clickability', () => {
      render(
        <ConversationListItem session={mockSession} isActive={false} onClick={() => {}} />
      );

      const listItem = screen.getByRole('listitem');
      expect(listItem).toHaveClass('cursor-pointer');
    });
  });
});
