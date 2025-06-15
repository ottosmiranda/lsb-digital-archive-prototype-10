import { Card, CardContent } from "@/components/ui/card";
import { Play, Clock, BookOpen, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Resource } from "@/types/resourceTypes";

const MediaSection = ({ resource }: { resource: Resource }) => {
  if (resource.type === 'video') {
    return (
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <img
              src={resource.thumbnail}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" className="bg-white/90 text-black hover:bg-white">
                <Play className="h-6 w-6 mr-2" />
                Reproduzir
              </Button>
            </div>
            {resource.duration && (
              <div className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-2 py-1 rounded">
                <Clock className="inline h-3 w-3 mr-1" />
                {resource.duration}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resource.type === 'titulo') {
    return (
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden max-w-md mx-auto">
            <img
              src={resource.thumbnail}
              alt={resource.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div className="text-white text-sm">
                <BookOpen className="inline h-3 w-3 mr-1" />
                {resource.pages} páginas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resource.type === 'podcast') {
    return null;
  }

  return null;
};

export default MediaSection;
