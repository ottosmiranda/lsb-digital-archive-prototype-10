
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Share2, BookOpen, Headphones, FileText, Copy, Check } from "lucide-react";
import { Resource } from "@/types/resourceTypes";
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

const ActionButtons = ({ resource }: { resource: Resource }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = window.location.href;
  const shareTitle = resource.title;
  const shareDescription = resource.description;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (resource.type === 'video') {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Compartilhar</h3>
            <div className="flex gap-2 flex-wrap">
              <FacebookShareButton url={shareUrl} quote={shareTitle}>
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <TwitterShareButton url={shareUrl} title={shareTitle}>
                <TwitterIcon size={32} round />
              </TwitterShareButton>
              <WhatsappShareButton url={shareUrl} title={shareTitle}>
                <WhatsappIcon size={32} round />
              </WhatsappShareButton>
              <LinkedinShareButton url={shareUrl} title={shareTitle} summary={shareDescription}>
                <LinkedinIcon size={32} round />
              </LinkedinShareButton>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={handleCopyLink}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? 'Link Copiado!' : 'Copiar Link'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (resource.type === 'titulo') {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            <BookOpen className="h-4 w-4 mr-2" />
            Ler Online
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (resource.type === 'podcast') {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            <Headphones className="h-4 w-4 mr-2" />
            Ouvir Agora
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Episódios
          </Button>
          {resource.transcript && (
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Ver Transcrição
            </Button>
          )}
          <Button variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ActionButtons;
