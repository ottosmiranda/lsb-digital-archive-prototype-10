
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  WhatsappShareButton, 
  LinkedinShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  LinkedinIcon
} from 'react-share';
import { useState } from 'react';

interface ShareButtonsProps {
  shareUrl: string;
  shareTitle: string;
  shareDescription?: string;
  layout?: 'horizontal' | 'vertical';
  iconSize?: number;
  showCopyButton?: boolean;
  className?: string;
}

const ShareButtons = ({ 
  shareUrl, 
  shareTitle, 
  shareDescription = '', 
  layout = 'horizontal',
  iconSize = 32,
  showCopyButton = true,
  className = ''
}: ShareButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const containerClass = layout === 'horizontal' 
    ? 'flex items-center gap-2' 
    : 'flex flex-col gap-2';

  const socialButtonsClass = layout === 'horizontal' 
    ? 'flex gap-2' 
    : 'flex gap-2 flex-wrap';

  return (
    <div className={`${containerClass} ${className}`}>
      <div className={socialButtonsClass}>
        <FacebookShareButton url={shareUrl}>
          <FacebookIcon size={iconSize} round />
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} title={shareTitle}>
          <TwitterIcon size={iconSize} round />
        </TwitterShareButton>
        <WhatsappShareButton url={shareUrl} title={shareTitle}>
          <WhatsappIcon size={iconSize} round />
        </WhatsappShareButton>
        <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareDescription}>
          <LinkedinIcon size={iconSize} round />
        </LinkedinShareButton>
      </div>
      
      {showCopyButton && layout === 'vertical' && (
        <Button variant="outline" className="w-full" onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
          {copied ? 'Link Copiado!' : 'Copiar Link'}
        </Button>
      )}
      
      {showCopyButton && layout === 'horizontal' && (
        <Button variant="outline" size="sm" onClick={handleCopyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
};

export default ShareButtons;
