"use client";

import { Component, type ReactNode } from "react";

const RECOVERABLE_MESSAGE = "Element not part of the array";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * @livekit/components-react's VideoConference has a known internal race
 * condition: its tile grid can throw "Element not part of the array" when a
 * participant's camera track flips from placeholder to a real track faster
 * than its layout diffing can keep up. The media streams are unaffected —
 * only that render pass fails — so we swallow just this error and remount
 * the grid instead of letting it crash the whole live room.
 */
export class VideoConferenceErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    if (error instanceof Error && error.message.includes(RECOVERABLE_MESSAGE)) {
      return { hasError: true };
    }
    throw error;
  }

  componentDidCatch() {
    setTimeout(() => this.setState({ hasError: false }), 0);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
