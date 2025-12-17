import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: unknown };

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("UI error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full p-4 border rounded-md">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">Try refreshing the page. If the issue persists, check the console for details.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
