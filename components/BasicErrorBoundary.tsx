'use client';

import { ErrorBoundary } from 'react-error-boundary';
import type { FallbackProps } from 'react-error-boundary';
import dynamic from 'next/dynamic';

const ErrorAnimation = dynamic(() => import('./ErrorAnimation'), {
  ssr: false,
  loading: () => <div className="h-48" />
});

interface BasicErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export function BasicErrorBoundary({ 
  children,
  fallback,
  onReset
}: BasicErrorBoundaryProps) {
  const handleReset = () => {
    if (onReset) onReset();
  };

  const handleError = (error: Error, info: { componentStack?: string | null }) => {
    console.error('Error Boundary caught:', error, info.componentStack || 'No stack trace');
  };

  const fallbackRender = ({ error, resetErrorBoundary }: FallbackProps) => {
    return fallback || (
      <div className="space-y-4">
        <ErrorAnimation 
          message={error?.message || 'Something went wrong'}
          onRetry={() => {
            resetErrorBoundary();
            handleReset();
          }}
        />
      </div>
    );
  };

  return (
    <ErrorBoundary
      onError={handleError}
      fallbackRender={fallbackRender}
    >
      {children}
    </ErrorBoundary>
  );
}