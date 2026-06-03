import React from "react";
import { ErrorFallback } from "./ErrorFallback";

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error);
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <ErrorFallback error={this.state.error} reset={this.reset} />
      );
    }
    return this.props.children;
  }
}
