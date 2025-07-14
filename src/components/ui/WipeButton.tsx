
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
          "relative overflow-hidden cursor-pointer border-none rounded-lg group",
          "bg-lsb-accent text-lsb-primary transition-colors duration-300",
          "hover:text-white",
          // Typography - Aeonik Medium with responsive sizes
          "font-aeonik font-medium",
          "text-base md:text-lg lg:text-xl", // 16px mobile, 18px tablet, 20px desktop
          "tracking-tighter-custom", // -0.02em letter spacing
          "leading-160", // 160% line height
          // Padding and dimensions
          "px-8 py-4", // 32px left/right, 16px top/bottom
          "h-16", // 64px height
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
