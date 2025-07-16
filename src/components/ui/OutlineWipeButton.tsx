
import React from 'react';
import { cn } from '@/lib/utils';

interface OutlineWipeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

const OutlineWipeButton = React.forwardRef<HTMLButtonElement, OutlineWipeButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden cursor-pointer border-2 border-white rounded-lg px-6 md:px-8 font-medium group",
          "bg-transparent text-white transition-colors duration-300",
          "hover:text-white",
          "font-aeonik font-medium uppercase tracking-[-0.02em]",
          "text-center inline-block",
          "h-[54px] md:h-auto md:py-3 lg:py-4",
          className
        )}
        style={{
          fontSize: '16px',
        }}
        {...props}
      >
        <span 
          className="relative z-10 transition-colors duration-300 flex items-center justify-center h-full"
          style={{
            fontSize: typeof window !== 'undefined' && window.innerWidth >= 1024 ? '18px' : '16px'
          }}
        >
          {children}
        </span>
        <div 
          className="absolute top-1/2 left-1/2 w-[500%] h-[500%] bg-lsb-primary transform -translate-x-1/2 -translate-y-1/2 scale-x-0 rotate-45 z-0 group-hover:animate-wipe-diagonal-reveal"
          style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
        />
      </button>
    );
  }
);

OutlineWipeButton.displayName = "OutlineWipeButton";

export { OutlineWipeButton };
