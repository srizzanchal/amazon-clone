import { Component } from "react";

// Catches rendering errors so one broken page doesn't blank the whole app
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error("UI error:", error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="panel">
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred. Try reloading the page.</p>
        <button className="btn btn-yellow" onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}
