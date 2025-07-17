import { AlertCircle } from 'lucide-react'
import { Component } from 'react'

import { Button } from '@/components/ui/button'

import type { ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div 
            className="rounded-md bg-destructive/10 p-4 text-destructive flex flex-col items-center text-center gap-2"
            role="alert"
          >
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">Algo deu errado</p>
            <p className="text-sm opacity-80">
              Não foi possível carregar este cartão de convidado.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={this.handleReset}
            >
              Tentar novamente
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
