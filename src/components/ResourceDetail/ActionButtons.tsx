
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Download, Share2, BookOpen, Headphones, FileText } from "lucide-react";
import { Resource } from "@/types/resourceTypes";

const ActionButtons = ({ resource }: { resource: Resource }) => {
  if (resource.type === 'video') {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Button className="w-full bg-red-600 hover:bg-red-700">
            <Play className="h-4 w-4 mr-2" />
            Assistir Agora
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
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
