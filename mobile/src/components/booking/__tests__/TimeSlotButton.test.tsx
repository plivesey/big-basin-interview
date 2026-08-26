import { render, screen, fireEvent } from '@testing-library/react-native';
import type { TimeSlot } from '@asba/shared-types';
import { TimeSlotButton } from '../TimeSlotButton';

const slot = (overrides: Partial<TimeSlot> = {}): TimeSlot => ({
  start: '2026-08-26T14:30:00',
  end: '2026-08-26T15:00:00',
  available: true,
  ...overrides,
});

describe('TimeSlotButton', () => {
  it('shows the wall-clock time from the naive datetime', () => {
    render(<TimeSlotButton slot={slot()} isSelected={false} onSelect={jest.fn()} />);
    expect(screen.getByText('2:30 PM')).toBeTruthy();
  });

  it('selects an available slot', () => {
    const onSelect = jest.fn();
    const s = slot();
    render(<TimeSlotButton slot={s} isSelected={false} onSelect={onSelect} />);

    fireEvent.press(screen.getByLabelText('2:30 PM'));
    expect(onSelect).toHaveBeenCalledWith(s);
  });

  it('does not offer an unavailable slot', () => {
    const onSelect = jest.fn();
    render(
      <TimeSlotButton slot={slot({ available: false })} isSelected={false} onSelect={onSelect} />
    );

    expect(screen.getByLabelText('2:30 PM - unavailable')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('announces a selected slot', () => {
    render(<TimeSlotButton slot={slot()} isSelected onSelect={jest.fn()} />);
    expect(screen.getByLabelText('2:30 PM - selected')).toBeTruthy();
  });

  it('announces a calendar conflict', () => {
    render(
      <TimeSlotButton
        slot={slot({ conflict: { eventTitle: 'Dentist' } })}
        isSelected={false}
        onSelect={jest.fn()}
      />
    );
    expect(screen.getByLabelText('2:30 PM - has calendar conflict')).toBeTruthy();
  });
});
