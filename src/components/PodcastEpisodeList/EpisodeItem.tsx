
import { Play, Calendar, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  duration_ms: number;
  release_date: string;
  external_urls: {
    spotify: string;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  audio_preview_url?: string;
}

interface GeneratedEpisode {
  id: number;
  title: string;
  date: string;
  desc: string;
  duration: string;
  isNew: boolean;
}

interface EpisodeItemProps {
  episode: SpotifyEpisode | GeneratedEpisode;
  isSpotifyEpisode: boolean;
  index?: number;
}

const EpisodeItem = ({ episode, isSpotifyEpisode, index = 0 }: EpisodeItemProps) => {
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return "45:00";
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    }).replace(/\./g, "");
  };

  if (isSpotifyEpisode) {
    const spotifyEpisode = episode as SpotifyEpisode;
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm">
        <div className="flex-shrink-0">
          {spotifyEpisode.images.length > 0 ? (
            <img 
              src={spotifyEpisode.images[0].url} 
              alt={spotifyEpisode.name}
              className="w-14 h-14 rounded-lg object-cover"
            />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <Play className="h-7 w-7 text-purple-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 items-center">
            <h3 className="font-semibold truncate">{spotifyEpisode.name}</h3>
            {index < 2 && (
              <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>
            )}
          </div>
          <p className="text-sm line-clamp-2 text-gray-600">{spotifyEpisode.description}</p>
          <div className="flex gap-4 mt-1 text-xs text-gray-500 items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(spotifyEpisode.release_date)}</span>
            <Clock className="h-3 w-3 ml-3 mr-1" />
            <span>{formatDuration(spotifyEpisode.duration_ms)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {spotifyEpisode.audio_preview_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(spotifyEpisode.audio_preview_url, '_blank')}
            >
              Preview
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => window.open(spotifyEpisode.external_urls.spotify, '_blank')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Spotify
          </Button>
        </div>
      </div>
    );
  }

  const generatedEpisode = episode as GeneratedEpisode;
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm">
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
          <Play className="h-7 w-7 text-purple-600" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 items-center">
          <h3 className="font-semibold truncate">{generatedEpisode.title}</h3>
          {generatedEpisode.isNew && (
            <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>
          )}
        </div>
        <p className="text-sm line-clamp-2 text-gray-600">{generatedEpisode.desc}</p>
        <div className="flex gap-4 mt-1 text-xs text-gray-500 items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{generatedEpisode.date}</span>
          <Clock className="h-3 w-3 ml-3 mr-1" />
          <span>{generatedEpisode.duration}</span>
        </div>
      </div>
      <button
        className="ml-2 p-2 rounded-full bg-purple-600 hover:bg-purple-700 transition text-white"
        aria-label="Ouvir episódio"
      >
        <Play className="h-5 w-5" />
      </button>
    </div>
  );
};

export default EpisodeItem;
