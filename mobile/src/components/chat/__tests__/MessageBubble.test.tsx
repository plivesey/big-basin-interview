import { render, screen } from '@testing-library/react-native';
import { MessageBubble } from '../MessageBubble';

describe('MessageBubble', () => {
  it('renders a user message', () => {
    render(<MessageBubble role="user" text="I need a haircut" />);
    expect(screen.getByText('I need a haircut')).toBeTruthy();
  });

  it('renders an assistant message through the markdown renderer', () => {
    render(<MessageBubble role="assistant" text="Try **Luxe Salon**" />);
    expect(screen.getByText('Luxe Salon')).toBeTruthy();
    expect(screen.queryByText('**Luxe Salon**')).toBeNull();
  });

  it('shows a timestamp when given one', () => {
    render(<MessageBubble role="user" text="hi" timestamp="2:30 PM" />);
    expect(screen.getByText('2:30 PM')).toBeTruthy();
  });

  it('renders a failed message differently', () => {
    const { toJSON } = render(<MessageBubble role="user" text="hi" failed />);
    expect(toJSON()).toBeTruthy();
  });
});
