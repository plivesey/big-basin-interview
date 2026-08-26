import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  it('shows the placeholder it is given', () => {
    render(<ChatInput onSendMessage={jest.fn()} placeholder="Ask me anything" />);
    expect(screen.getByPlaceholderText('Ask me anything')).toBeTruthy();
  });

  it('sends the trimmed message', () => {
    const onSendMessage = jest.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);

    fireEvent.changeText(screen.getByLabelText('Message input'), '  I need a haircut  ');
    fireEvent.press(screen.getByTestId('send-button'));

    expect(onSendMessage).toHaveBeenCalledWith('I need a haircut');
  });

  it('clears the field after sending', () => {
    render(<ChatInput onSendMessage={jest.fn()} />);
    const field = screen.getByLabelText('Message input');

    fireEvent.changeText(field, 'hello');
    fireEvent.press(screen.getByTestId('send-button'));

    expect(field.props.value).toBe('');
  });

  it('does not send an empty message', () => {
    const onSendMessage = jest.fn();
    render(<ChatInput onSendMessage={onSendMessage} />);

    fireEvent.changeText(screen.getByLabelText('Message input'), '   ');
    fireEvent.press(screen.getByTestId('send-button'));

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('lets the user keep typing while disabled, but does not send', () => {
    // Same rule as the web input: `disabled` gates the button, not the field.
    const onSendMessage = jest.fn();
    render(<ChatInput onSendMessage={onSendMessage} disabled />);

    const field = screen.getByLabelText('Message input');
    fireEvent.changeText(field, 'still typing');
    expect(field.props.value).toBe('still typing');

    fireEvent.press(screen.getByTestId('send-button'));
    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
