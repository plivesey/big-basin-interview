import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Port of the web ErrorBoundary. The only change is the recovery action:
 * there is no window.location.reload() on a phone, so this resets its own
 * state and re-renders the tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('Uncaught error in component tree', {
      error: error.message,
      componentStack: errorInfo.componentStack ?? undefined,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View className="flex-1 items-center justify-center bg-slate-100 p-8">
        <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
          Something went wrong
        </Text>
        <Text className="text-slate-600 text-center mb-6">
          That shouldn&apos;t have happened. Tap below and we&apos;ll pick up right where you left off.
        </Text>
        {__DEV__ && this.state.error ? (
          <Text className="text-xs text-red-700 mb-6 text-center">{this.state.error.message}</Text>
        ) : null}
        <Button onPress={this.handleReset}>Try again</Button>
      </View>
    );
  }
}
