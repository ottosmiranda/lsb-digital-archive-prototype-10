
import { Play, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ApiEpisode {
  id: number;
  title: string;
  description: string;
  duration?: string;
  year: number;
  author: string;
  subject: string;
  thumbnail?: string;
  embedUrl?: string;
  podcast_titulo?: string;
  episodio_id?: string;
}

interface EpisodeItemProps {
  episode: ApiEpisode;
  isSelected?: boolean;
  onEpisodeSelect?: () => void;
}

const EpisodeItem = ({ 
  episode, 
  isSelected = false,
  onEpisodeSelect 
}: EpisodeItemProps) => {
  return (
    <div 
      className={`flex items-center gap-4 px-4 py-3 bg-white border rounded-[2px] shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
      onClick={onEpisodeSelect}
    >
      <div className="flex-shrink-0">
        {episode.thumbnail ? (
          <img 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-14 h-14 rounded-[2px] object-cover"
          />
        ) : (
          <div className="w-14 h-14 bg-gray-100 rounded-[2px] flex items-center justify-center">
            <Play className="h-7 w-7 text-purple-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-center">
          <h3 className="font-semibold truncate">{episode.title}</h3>
          {isSelected && (
            <Badge className="bg-blue-600 text-white ml-1">TOCANDO</Badge>
          )}
        </div>
        <p className="text-sm line-clamp-2 text-gray-600">{episode.description}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-500 items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{episode.year}</span>
          {episode.duration && (
            <>
              <Clock className="h-3 w-3 ml-3 mr-1" />
              <span>{episode.duration}</span>
            </>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onEpisodeSelect?.();
        }}
        className="bg-purple-600 hover:bg-purple-700"
      >
        <Play className="h-4 w-4 mr-1" />
        Ouça este episódio
      </Button>
    </div>
  );
};

export default EpisodeItem;
