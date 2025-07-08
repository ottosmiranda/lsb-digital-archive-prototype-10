
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Headphones, FileText, Download } from "lucide-react";
import { Resource } from "@/types/resourceTypes";
import ShareButtons from "@/components/ShareButtons";

const ActionButtons = ({ resource }: { resource: Resource }) => {
  const shareUrl = window.location.href;
  const shareTitle = resource.title;
  const shareDescription = resource.description;

  if (resource.type === 'video' || resource.type === 'titulo') {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Compartilhar</h3>
            <ShareButtons
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              shareDescription={shareDescription}
              layout="vertical"
              iconSize={32}
              showCopyButton={true}
            />
          </div>
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
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Compartilhar</h3>
            <ShareButtons
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              shareDescription={shareDescription}
              layout="vertical"
              iconSize={32}
              showCopyButton={true}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ActionButtons;
