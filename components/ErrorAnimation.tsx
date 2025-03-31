"use client";

import dynamic from 'next/dynamic';
import errorAnimation from '../public/lottie/error-animation.json';
import { FiRefreshCw } from 'react-icons/fi';

const ReactLottie = dynamic(() => import('react-lottie'), { 
  ssr: false,
  loading: () => <div className="w-[200px] h-[200px]" />
});

interface ErrorAnimationProps {
  message?: string;
  height?: number;
  width?: number;
  className?: string;
  loop?: boolean;
  onRetry?: () => void;
}

export default function ErrorAnimation({
  message = 'Oops! Something went wrong',
  height = 200,
  width = 200,
  className = '',
  loop = false,
  onRetry
}: ErrorAnimationProps) {
  return (
    <div 
      role="alert"
      aria-live="assertive"
      className={`flex flex-col items-center justify-center h-64 ${className}`}
    >
      <ReactLottie
        options={{
          loop,
          autoplay: true,
          animationData: errorAnimation,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          }
        }}
        height={height}
        width={width}
      />
      <p className="text-purple-700 mt-4 text-center">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors"
          aria-label="Retry"
        >
          <FiRefreshCw />
          Try Again
        </button>
      )}
    </div>
  );
}