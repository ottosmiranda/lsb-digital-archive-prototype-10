
import { Calendar, Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SpotifyPlayerSectionProps {
  embedUrl: string;
  playingFirst: boolean;
  podcastTitle: string;
  oembedData: any;
  oembedLoading: boolean;
  oembedError: string | null;
}

const SpotifyPlayerSection = ({
  embedUrl,
  playingFirst,
  podcastTitle,
  oembedData,
  oembedLoading,
  oembedError
}: SpotifyPlayerSectionProps) => {
  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${playingFirst ? "ring-2 ring-green-500" : ""}`}>
      <div className="p-4 border-b">
        <div className="flex gap-2 items-center mb-2">
          <h3 className="font-semibold">
            {oembedData?.title || `Episódio 1: ${podcastTitle} - Episódio Mais Recente`}
          </h3>
          <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Ouça o episódio mais recente diretamente no Spotify
        </p>
        <div className="flex gap-4 text-xs text-gray-500 items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "")}</span>
          <Clock className="h-3 w-3 ml-3 mr-1" />
          <span>45:00</span>
          {playingFirst && (
            <span className="ml-4 inline-flex items-center text-green-600 font-bold animate-pulse">
              <Play className="h-4 w-4 mr-1" /> Reproduzindo
            </span>
          )}
        </div>
      </div>
      
      {/* Spotify Player */}
      <div className="p-4">
        {oembedLoading && (
          <div className="flex items-center justify-center h-[352px] bg-gray-50 rounded-lg">
            <div className="text-gray-500">Carregando player...</div>
          </div>
        )}
        
        {oembedData && !oembedLoading && (
          <div
            dangerouslySetInnerHTML={{ __html: oembedData.html }}
            className="spotify-embed"
          />
        )}
        
        {/* Fallback to original iframe if oEmbed fails or is loading */}
        {(!oembedData || oembedError) && !oembedLoading && embedUrl && (
          <iframe
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allowTransparency={true}
            allow="encrypted-media"
            className="rounded-lg"
            title={`${podcastTitle} - Spotify Player`}
          />
        )}
      </div>
      
      {/* Display oEmbed metadata if available */}
      {oembedData?.thumbnail_url && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <img 
              src={oembedData.thumbnail_url} 
              alt="Episode thumbnail"
              className="w-8 h-8 rounded object-cover"
            />
            <span>Powered by {oembedData.provider_name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayerSection;
