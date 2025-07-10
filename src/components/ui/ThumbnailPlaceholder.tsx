
import { Book, Video, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThumbnailPlaceholderProps {
  type: 'titulo' | 'video' | 'podcast';
  className?: string;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
}

const ThumbnailPlaceholder = ({ 
  type, 
  className,
  size = 'medium',
  style
}: ThumbnailPlaceholderProps) => {
  const getIcon = () => {
    switch (type) {
      case 'video':
        return Video;
      case 'titulo':
        return Book;
      case 'podcast':
        return Headphones;
      default:
        return Book;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'h-16 w-16';
      case 'large':
        return 'h-40 w-full';
      default:
        return 'h-28 w-28';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'h-4 w-4';
      case 'large':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-xs';
      case 'large':
        return 'text-sm';
      default:
        return 'text-xs';
    }
  };

  const IconComponent = getIcon();

  return (
    <div 
      className={cn(
        'bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-500',
        getSizeStyles(),
        className
      )}
      style={style}
    >
      <IconComponent className={cn('mb-1', getIconSize())} />
      <span className={cn('font-medium text-center leading-tight', getTextSize())}>
        Nenhuma miniatura
      </span>
      <span className={cn('text-center leading-tight', getTextSize())}>
        disponível
      </span>
    </div>
  );
};

export default ThumbnailPlaceholder;
