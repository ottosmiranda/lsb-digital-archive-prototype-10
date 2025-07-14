
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
          className="absolute inset-0 w-full h-full bg-lsb-primary transform translate-x-[-100%] translate-y-[-100%] transition-transform duration-300 ease-in-out group-hover:animate-wipe-diagonal"
        />
      </button>
    );
  }
);

WipeButton.displayName = "WipeButton";

export { WipeButton };
