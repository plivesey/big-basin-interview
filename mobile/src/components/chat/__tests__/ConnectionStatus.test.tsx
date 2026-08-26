import { render, screen, fireEvent } from '@testing-library/react-native';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('shows nothing before the first connection', () => {
    const { toJSON } = render(
      <ConnectionStatus status="connecting" hasConnectedOnce={false} onReconnect={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('shows nothing on a clean first connection', () => {
    // The badge is deliberately suppressed until something has actually
    // dropped, so a normal launch stays quiet.
    const { toJSON } = render(
      <ConnectionStatus status="connected" hasConnectedOnce onReconnect={jest.fn()} />
    );
    expect(toJSON()).toBeNull();
  });

  it('offers a reconnect after a drop', async () => {
    const onReconnect = jest.fn();
    const view = render(
      <ConnectionStatus status="connected" hasConnectedOnce onReconnect={onReconnect} />
    );

    view.rerender(
      <ConnectionStatus status="disconnected" hasConnectedOnce onReconnect={onReconnect} />
    );

    const button = await screen.findByLabelText('Reconnect');
    fireEvent.press(button);
    expect(onReconnect).toHaveBeenCalled();
  });

  it('offers a retry in the error state', async () => {
    const onReconnect = jest.fn();
    const view = render(
      <ConnectionStatus status="connected" hasConnectedOnce onReconnect={onReconnect} />
    );
    view.rerender(<ConnectionStatus status="error" hasConnectedOnce onReconnect={onReconnect} />);

    fireEvent.press(await screen.findByLabelText('Retry connecting'));
    expect(onReconnect).toHaveBeenCalled();
  });
});
