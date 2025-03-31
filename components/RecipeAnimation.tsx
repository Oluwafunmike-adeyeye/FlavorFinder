"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import recipeAnimation from '../public/lottie/recipe-animation.json';

const ReactLottie = dynamic(() => import('react-lottie'), { 
  ssr: false,
  loading: () => <div className="w-[300px] h-[300px]" />
});

interface RecipeAnimationProps {
  size?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  interactive?: boolean;
}

export default function RecipeAnimation({
  size = 150,
  className = '',
  loop = true,
  autoplay = true,
  interactive = false
}: RecipeAnimationProps) {
  const [isStopped, setIsStopped] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div 
      role="img"
      aria-label="Cooking animation"
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <ReactLottie
        options={{
          loop,
          autoplay,
          animationData: recipeAnimation,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          }
        }}
        height={size}
        width={size}
        isStopped={isStopped}
        isPaused={isPaused}
      />
      {interactive && (
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => setIsStopped(!isStopped)}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded"
          >
            {isStopped ? 'Play' : 'Stop'}
          </button>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      )}
    </div>
  );
}