
import { Calendar, Clock, Play, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React, { useEffect, useRef, useState } from "react";

interface SelectedEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  embedUrl?: string;
  isSpotifyEpisode: boolean;
  spotifyUrl?: string;
}

interface SpotifyPlayerSectionProps {
  embedUrl: string;
  playingFirst: boolean;
  podcastTitle: string;
  selectedEpisode?: SelectedEpisode | null;
  oembedData: any;
  oembedLoading: boolean;
  oembedError: string | null;
  authStatus?: 'idle' | 'success' | 'failed' | 'not-configured';
  apiError?: string | null;
}

const SpotifyPlayerSection = ({
  embedUrl,
  playingFirst,
  podcastTitle,
  selectedEpisode,
  oembedData,
  oembedLoading,
  oembedError,
  authStatus = 'idle',
  apiError
}: SpotifyPlayerSectionProps) => {
  const formatDate = (dateString: string) => {
    if (!selectedEpisode?.isSpotifyEpisode) return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).replace(/\./g, "");
  };

  // Loading state for iframe
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Autoplay fallback detection
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [dismissedAutoplayMsg, setDismissedAutoplayMsg] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  // Start loading when embedUrl changes
  useEffect(() => {
    if (selectedEpisode?.isSpotifyEpisode && selectedEpisode.embedUrl) {
      setIframeLoading(true);
      setAutoplayBlocked(false);
      setDismissedAutoplayMsg(false);
    } else {
      setAutoplayBlocked(false);
      setDismissedAutoplayMsg(false);
    }
  }, [selectedEpisode?.embedUrl]);

  // When the iframe loads, start a timer to detect autoplay block
  const handleIframeLoad = () => {
    setIframeLoading(false);
    setAutoplayBlocked(false);
    setDismissedAutoplayMsg(false);

    // Only do autoplay detection for Spotify embed
    if (selectedEpisode?.isSpotifyEpisode && iframeRef.current) {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
      autoplayTimer.current = setTimeout(() => {
        setAutoplayBlocked(true);
      }, 4000);
    }
  };

  const handleDismissAutoplayMsg = () => {
    setDismissedAutoplayMsg(true);
  };

  // Clean up timer
  useEffect(() => {
    return () => {
      if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    };
  }, [selectedEpisode?.embedUrl]);

  const displayTitle = selectedEpisode ? selectedEpisode.title : oembedData?.title || `Episódio 1: ${podcastTitle} - Episódio Mais Recente`;
  const displayDescription = selectedEpisode ? selectedEpisode.description : "Ouça o episódio mais recente diretamente no Spotify";
  const displayDate = selectedEpisode ? formatDate(selectedEpisode.date) : new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).replace(/\./g, "");
  const displayDuration = selectedEpisode ? selectedEpisode.duration : "45:00";
  const currentEmbedUrl = selectedEpisode?.embedUrl || embedUrl;

  // Determine if we should show error state
  const showSpotifyError = authStatus === 'failed' || authStatus === 'not-configured' || apiError;
  const isGeneratedEpisode = selectedEpisode && !selectedEpisode.isSpotifyEpisode;

  const openInSpotify = () => {
    if (selectedEpisode?.spotifyUrl) {
      window.open(selectedEpisode.spotifyUrl, '_blank');
    } else {
      // Convert embed URL to regular Spotify URL
      const spotifyUrl = embedUrl.replace('/embed/', '/').split('?')[0];
      window.open(spotifyUrl, '_blank');
    }
  };

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${playingFirst ? "ring-2 ring-green-500" : ""}`}>
      <div className="p-4 border-b">
        <div className="flex gap-2 items-center mb-2">
          <h3 className="font-semibold line-clamp-2">
            {displayTitle}
          </h3>
          {(!selectedEpisode || selectedEpisode.id === "1") && <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>}
        </div>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {displayDescription}
        </p>
        <div className="flex gap-4 text-xs text-gray-500 items-center">
          <Calendar className="h-3 w-3 mr-1" />
          <span>{displayDate}</span>
          <Clock className="h-3 w-3 ml-3 mr-1" />
          <span>{displayDuration}</span>
          {playingFirst && <span className="ml-4 inline-flex items-center text-green-600 font-bold animate-pulse">
              <Play className="h-4 w-4 mr-1" /> Reproduzindo
            </span>}
        </div>
      </div>
      
      {/* Player Section */}
      <div className="p-4 relative">
        {/* Loading state */}
        {oembedLoading && (
          <div className="flex items-center justify-center h-[352px] bg-gray-50 rounded-lg">
            <div className="text-gray-500">Carregando player...</div>
          </div>
        )}

        {/* Loading overlay for new episode */}
        {iframeLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 pointer-events-none">
            <div className="text-green-700 animate-pulse font-medium">
              Iniciando reprodução...
            </div>
          </div>
        )}

        {/* Autoplay blocked overlay */}
        {autoplayBlocked && !dismissedAutoplayMsg && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 p-4 rounded-lg border border-green-200">
            <div className="text-green-700 text-base font-semibold mb-2 flex items-center gap-2">
              <Play className="h-5 w-5" /> Reprodução automática bloqueada
            </div>
            <div className="text-gray-700 text-sm mb-4 text-center max-w-xs">
              Seu navegador não permite reprodução automática.<br />
              Clique no botão <span className="font-bold">▶️</span> no player do Spotify para iniciar o episódio manualmente.
            </div>
            <button 
              onClick={handleDismissAutoplayMsg} 
              className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors focus:outline-none"
            >
              Entendi
            </button>
          </div>
        )}

        {/* Spotify Error State */}
        {showSpotifyError && (
          <div className="flex flex-col items-center justify-center h-[352px] bg-orange-50 rounded-lg border-2 border-orange-200 p-6">
            <AlertCircle className="h-12 w-12 text-orange-500 mb-4" />
            <div className="text-center">
              <h3 className="font-semibold text-orange-800 mb-2">
                {authStatus === 'not-configured' ? 'Spotify não configurado' : 'Erro na conexão com Spotify'}
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                {authStatus === 'not-configured' 
                  ? 'Configure suas credenciais do Spotify para ouvir episódios reais'
                  : 'Não foi possível carregar os episódios do Spotify. Isso pode acontecer em alguns navegadores ou dispositivos móveis.'
                }
              </p>
              <Button onClick={openInSpotify} className="bg-green-600 hover:bg-green-700 text-white">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Spotify
              </Button>
            </div>
          </div>
        )}

        {/* oEmbed Player */}
        {oembedData && !oembedLoading && !selectedEpisode && !showSpotifyError && (
          <div dangerouslySetInnerHTML={{ __html: oembedData.html }} className="spotify-embed" />
        )}
        
        {/* Spotify iframe */}
        {selectedEpisode?.embedUrl && selectedEpisode.isSpotifyEpisode && !showSpotifyError && (
          <iframe 
            ref={iframeRef}
            key={currentEmbedUrl}
            src={currentEmbedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allowTransparency={true}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-lg"
            title={`${displayTitle} - Spotify Player`}
            onLoad={handleIframeLoad}
            style={{ minHeight: 352 }}
          />
        )}

        {/* Fallback iframe when no episode selected and no oEmbed error */}
        {!selectedEpisode && (!oembedData || oembedError) && !oembedLoading && !showSpotifyError && currentEmbedUrl && (
          <iframe 
            ref={iframeRef}
            key={currentEmbedUrl}
            src={currentEmbedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allowTransparency={true}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="rounded-lg"
            title={`${displayTitle} - Spotify Player`}
            onLoad={handleIframeLoad}
            style={{ minHeight: 352 }}
          />
        )}
        
        {/* Generated episode fallback */}
        {isGeneratedEpisode && (
          <div className="flex flex-col items-center justify-center h-[352px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Play className="h-12 w-12 text-gray-400 mb-3" />
            <p className="font-medium text-gray-600 mb-2">Episódio de Exemplo</p>
            <p className="text-sm text-gray-500 mb-4 text-center max-w-xs">
              Este é um episódio de exemplo. Para ouvir episódios reais, configure sua integração com o Spotify.
            </p>
            <Button onClick={openInSpotify} variant="outline" className="mt-2">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver no Spotify
            </Button>
          </div>
        )}
      </div>
      
      {/* oEmbed metadata */}
      {oembedData?.thumbnail_url && !selectedEpisode && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <img src={oembedData.thumbnail_url} alt="Episode thumbnail" className="w-8 h-8 rounded object-cover" />
            <span>Powered by {oembedData.provider_name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotifyPlayerSection;
