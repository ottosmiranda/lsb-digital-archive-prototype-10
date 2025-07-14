
import React from 'react';
import { cn } from '@/lib/utils';

interface WipeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const WipeButton = React.forwardRef<HTMLButtonElement, WipeButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden cursor-pointer border-none rounded-lg px-8 py-4 text-sm font-medium transition-colors group",
          "bg-lsb-accent text-lsb-primary hover:text-white",
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div 
          className="absolute inset-0 w-full h-full bg-lsb-primary transform scale-x-0 origin-center transition-all duration-500 ease-in-out group-hover:scale-x-100 group-hover:animate-[wipe-fade_0.8s_ease-in-out_0.3s_forwards]"
        />
        <style jsx>{`
          @keyframes wipe-fade {
            0% {
              transform: scaleX(1);
              opacity: 1;
            }
            70% {
              transform: scaleX(1);
              opacity: 1;
            }
            100% {
              transform: scaleX(1);
              opacity: 0;
            }
          }
        `}</style>
      </button>
    );
  }
);

WipeButton.displayName = "WipeButton";

export { WipeButton };
