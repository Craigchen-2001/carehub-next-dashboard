"use client";

import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

type State = { hasError: boolean; message: string };

export class SectionBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, message: err instanceof Error ? err.message : "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">{this.props.title} failed</div>
          <div className="mt-1 text-sm text-gray-600">{this.state.message}</div>
        </div>
      );
    }
    return this.props.children;
  }
}