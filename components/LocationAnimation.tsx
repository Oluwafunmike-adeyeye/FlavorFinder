"use client";

import dynamic from 'next/dynamic';
import locationAnimation from '../public/lottie/location-animation.json';

interface LocationAnimationProps {
  size?: number;
  className?: string;
}

const ReactLottie = dynamic(() => import('react-lottie'), {
  loading: () => <div className="w-[60px] h-[60px]" />,
  ssr: false
});

export default function LocationAnimation({
  size = 60,
  className = ''
}: LocationAnimationProps) {
  return (
    <div 
      className={`flex justify-center items-center ${className}`}
      role="img"
      aria-label="Location animation"
    >
      <ReactLottie
        options={{
          loop: true,
          autoplay: true,
          animationData: locationAnimation,
          rendererSettings: {
            preserveAspectRatio: 'xMidYMid slice'
          }
        }}
        height={size}
        width={size}
      />
    </div>
  );
}