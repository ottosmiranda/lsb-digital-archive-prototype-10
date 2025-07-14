
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
          "relative overflow-hidden cursor-pointer border-none rounded-lg px-8 py-4 text-sm font-medium group",
          "bg-lsb-accent text-lsb-primary transition-colors duration-300",
          "hover:text-white",
          className
        )}
        {...props}
      >
        <span className="relative z-10 transition-colors duration-300">{children}</span>
        <div 
          className="absolute top-1/2 left-1/2 w-[500%] h-[500%] bg-lsb-primary transform -translate-x-1/2 -translate-y-1/2 scale-x-0 rotate-45 z-0 group-hover:animate-wipe-diagonal-reveal"
          style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
        />
      </button>
    );
  }
);

WipeButton.displayName = "WipeButton";

export { WipeButton };
