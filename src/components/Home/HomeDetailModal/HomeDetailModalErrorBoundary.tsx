import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface HomeDetailModalErrorBoundaryProps {
  onError: (error: unknown) => void
  children: ReactNode
}

interface HomeDetailModalErrorBoundaryState {
  failed: boolean
}

// Catches the shell chunk failing to load (after lazyWithRetry's one retry) so the click can fall back
// to the canonical page instead of leaving the overlay up or unmounting the homepage.
class HomeDetailModalErrorBoundary extends Component<HomeDetailModalErrorBoundaryProps, HomeDetailModalErrorBoundaryState> {
  state: HomeDetailModalErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): HomeDetailModalErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    this.props.onError(error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

export { HomeDetailModalErrorBoundary }
