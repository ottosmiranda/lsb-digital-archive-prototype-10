
import { Play, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div 
      className={`flex flex-col md:flex-row gap-4 p-4 bg-white border rounded-[2px] shadow-sm cursor-pointer transition-all hover:shadow-md ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      }`}
      onClick={onEpisodeSelect}
    >
      {/* Thumbnail - Increased size and full width on mobile */}
      <div className="flex-shrink-0 w-full md:w-auto">
        {episode.thumbnail ? (
          <img 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-full h-48 md:w-24 md:h-24 rounded-[2px] object-cover"
          />
        ) : (
          <div className="w-full h-48 md:w-24 md:h-24 bg-gray-100 rounded-[2px] flex items-center justify-center">
            <Play className="h-12 w-12 md:h-8 md:w-8 text-purple-600" />
          </div>
        )}
      </div>

      {/* Content - Better organized and responsive */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Title and Badge Row */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-3">
          <h3 className="font-semibold text-base md:text-sm break-words flex-1 leading-tight">
            {episode.title}
          </h3>
          {isSelected && (
            <Badge className="bg-blue-600 text-white self-start shrink-0">
              TOCANDO
            </Badge>
          )}
        </div>

        {/* Description with expand/collapse */}
        <div className="mb-3">
          <p className={`text-sm text-gray-600 leading-relaxed break-words ${
            !isDescriptionExpanded ? 'line-clamp-3' : ''
          }`}>
            {episode.description}
          </p>
          {episode.description && episode.description.length > 150 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleDescription();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1 transition-colors"
            >
              {isDescriptionExpanded ? (
                <>
                  <span>ver menos</span>
                  <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span>ver mais</span>
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Bottom section with metadata and play button */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mt-auto">
          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <div className="flex items-center shrink-0">
              <Calendar className="h-3 w-3 mr-1" />
              <span>{episode.year}</span>
            </div>
            {episode.duration && (
              <div className="flex items-center shrink-0">
                <Clock className="h-3 w-3 mr-1" />
                <span>{episode.duration}</span>
              </div>
            )}
          </div>

          {/* Play Button */}
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEpisodeSelect?.();
            }}
            className="bg-purple-600 hover:bg-purple-700 shrink-0 w-full sm:w-auto"
          >
            <Play className="h-4 w-4 mr-1" />
            <span className="whitespace-nowrap">Ouça este episódio</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EpisodeItem;
