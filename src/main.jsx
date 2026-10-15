import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  state = { hasError: false, message: "" };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Cedu render error:", error);
    this.setState({ message: error?.message || "Unknown render error" });
  }

  render() {
    if (this.state.hasError) {
      return <main className="app-error-state"><div><span>!</span><h1>We couldn’t load this page</h1><p>Please refresh the page to restore your workspace.</p>{this.state.message && <code>{this.state.message}</code>}<button onClick={() => window.location.reload()}>Refresh page</button></div></main>;
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(<AppErrorBoundary><React.StrictMode><App /></React.StrictMode></AppErrorBoundary>);
