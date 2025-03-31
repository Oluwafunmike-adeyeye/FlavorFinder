"use client";

import dynamic from 'next/dynamic';
import loadingAnimation from '../public/lottie/loading-spinner.json';

const ReactLottie = dynamic(() => import('react-lottie'), { 
  ssr: false,
  loading: () => <div className="w-[150px] h-[150px]" />
});

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 150,
  message = '',
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div 
      role="status"
      aria-label="Loading"
      className={`flex flex-col items-center justify-center h-48 ${className}`}
    >
      <ReactLottie
        options={{
          loop: true,
          autoplay: true,
          animationData: loadingAnimation,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          }
        }}
        height={size}
        width={size}
      />
      {message && (
        <p className="mt-4 text-gray-600 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}