
import React from "react";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Episode {
  id: string | number;
  episodio_id?: string;
  title: string;
  episodio_titulo?: string;
  description: string;
  descricao?: string;
  duration?: string;
  duracao?: string;
  data_lancamento?: string;
  embedUrl?: string;
  imagem_url?: string;
}

interface EpisodeItemProps {
  episode: Episode;
  isSelected: boolean;
  onEpisodeSelect: () => void;
}

const EpisodeItem = ({ episode, isSelected, onEpisodeSelect }: EpisodeItemProps) => {
  // Extract episode data with fallbacks
  const episodeTitle = episode.episodio_titulo || episode.title || "Episódio sem título";
  const episodeDescription = episode.descricao || episode.description || "Descrição não disponível";
  const episodeDuration = episode.duracao || episode.duration || "Duração não informada";
  const episodeImage = episode.imagem_url;
  const episodeDate = episode.data_lancamento ? new Date(episode.data_lancamento).getFullYear() : new Date().getFullYear();

  // Truncate description for card display
  const truncatedDescription = episodeDescription.length > 150 
    ? episodeDescription.substring(0, 150) + "..." 
    : episodeDescription;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Episode Image */}
          <div className="flex-shrink-0 self-center sm:self-start">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-lg overflow-hidden">
              {episodeImage ? (
                <img 
                  src={episodeImage} 
                  alt={episodeTitle}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Episode Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base md:text-lg text-gray-900 line-clamp-2 mb-1">
                  {episodeTitle}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span>{episodeDate}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{episodeDuration}</span>
                  </div>
                </div>
              </div>
              
              {/* Play Button */}
              <Button
                onClick={onEpisodeSelect}
                className={`
                  flex-shrink-0 px-6 py-2 rounded-full font-medium transition-all duration-200
                  ${isSelected 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }
                `}
              >
                <Play className="h-4 w-4 mr-2" />
                Ouça este episódio
              </Button>
            </div>

            {/* Episode Description */}
            <p className="text-sm md:text-base text-gray-600 leading-relaxed line-clamp-3">
              {truncatedDescription}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EpisodeItem;
