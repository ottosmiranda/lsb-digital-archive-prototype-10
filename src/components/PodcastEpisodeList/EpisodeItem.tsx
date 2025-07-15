
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
      className={`flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white border rounded-[2px] shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
      onClick={onEpisodeSelect}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 mx-auto md:mx-0">
        {episode.thumbnail ? (
          <img 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-20 h-20 md:w-14 md:h-14 rounded-[2px] object-cover"
          />
        ) : (
          <div className="w-20 h-20 md:w-14 md:h-14 bg-gray-100 rounded-[2px] flex items-center justify-center">
            <Play className="h-8 w-8 md:h-7 md:w-7 text-purple-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <div className="flex flex-col md:flex-row gap-2 md:items-center mb-2">
          <h3 className="font-semibold text-base md:text-sm break-words">{episode.title}</h3>
          {isSelected && (
            <Badge className="bg-blue-600 text-white mx-auto md:mx-0 w-fit">TOCANDO</Badge>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-3 leading-relaxed">{episode.description}</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs text-gray-500 items-center justify-center md:justify-start">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{episode.year}</span>
          </div>
          {episode.duration && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{episode.duration}</span>
            </div>
          )}
        </div>
      </div>

      {/* Play Button */}
      <div className="flex-shrink-0 mt-3 md:mt-0">
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEpisodeSelect?.();
          }}
          className="w-full md:w-auto bg-purple-600 hover:bg-purple-700"
        >
          <Play className="h-4 w-4 mr-1" />
          Ouça este episódio
        </Button>
      </div>
    </div>
  );
};

export default EpisodeItem;
