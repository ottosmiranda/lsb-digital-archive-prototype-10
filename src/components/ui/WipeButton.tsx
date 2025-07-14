
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
          "relative overflow-hidden cursor-pointer border-none rounded-lg px-8 py-4 text-sm font-medium transition-colors",
          "bg-lsb-accent text-lsb-primary", // #E1B243 background, #10284E text
          "before:absolute before:inset-0 before:w-full before:h-full",
          "before:bg-gradient-to-tr before:from-lsb-primary before:to-transparent",
          "before:transform before:-translate-x-full before:transition-transform before:duration-300 before:ease-in-out",
          "hover:before:translate-x-0 hover:text-white",
          "before:z-0 relative z-10",
          className
        )}
        style={{
          // Garantir que o pseudo-elemento funcione corretamente
          position: 'relative',
        }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-tr from-lsb-primary to-transparent transform -translate-x-full transition-transform duration-300 ease-in-out group-hover:translate-x-0"
          style={{
            background: 'linear-gradient(to top right, hsl(210 28% 19%), transparent)',
            transform: 'translateX(-100%)',
          }}
        />
        <style jsx>{`
          button:hover div {
            transform: translateX(0);
          }
        `}</style>
      </button>
    );
  }
);

WipeButton.displayName = "WipeButton";

export { WipeButton };
