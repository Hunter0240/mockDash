import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Widget error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="flex flex-col items-center justify-center h-full"
          style={{ gap: "var(--space-sm)", padding: "var(--space-md)" }}
        >
          <span
            style={{
              fontSize: "var(--text-md)",
              color: "var(--color-status-crit)",
            }}
          >
            Something went wrong
          </span>
          <button
            onClick={() => this.setState({ error: null })}
            className="btn-icon rounded"
            style={{
              fontSize: "var(--text-sm)",
              padding: "var(--space-xs) var(--space-md)",
              border: "1px solid var(--color-border)",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
