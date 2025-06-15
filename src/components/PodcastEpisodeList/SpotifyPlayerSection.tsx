import { Calendar, Clock, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import React, { useEffect, useRef, useState } from "react";

interface SelectedEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  embedUrl?: string;
  isSpotifyEpisode: boolean;
}

interface SpotifyPlayerSectionProps {
  embedUrl: string;
  playingFirst: boolean;
  podcastTitle: string;
  selectedEpisode?: SelectedEpisode | null;
  oembedData: any;
  oembedLoading: boolean;
  oembedError: string | null;
  onEpisodeChange?: (ep: any) => void; // add: to allow updating from here if ever needed, not required for this task
}

const SpotifyPlayerSection = ({
  embedUrl,
  playingFirst,
  podcastTitle,
  selectedEpisode,
  oembedData,
  oembedLoading,
  oembedError,
  // onEpisodeChange,
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

  // -- Start new: loading state for iframe --
  const [iframeLoading, setIframeLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // --- Autoplay fallback detection ---
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
      }, 4000); // 4 seconds: if not playing, show message
    }
  };

  // If the user dismisses the autoplay warning
  const handleDismissAutoplayMsg = () => {
    setDismissedAutoplayMsg(true);
  };

  // Clean up timer if component unmounts or URL changes
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
  return <div className={`bg-white border rounded-xl shadow-sm overflow-hidden ${playingFirst ? "ring-2 ring-green-500" : ""}`}>
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
      
      {/* Spotify Player */}
      <div className="p-4 relative">
        {oembedLoading && <div className="flex items-center justify-center h-[352px] bg-gray-50 rounded-lg">
            <div className="text-gray-500">Carregando player...</div>
          </div>}

        {/* Overlay for loading new episode */}
        {iframeLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 pointer-events-none">
            <div className="text-green-700 animate-pulse font-medium">
              Iniciando reprodução...
            </div>
          </div>}

        {/* --- Autoplay blocked overlay --- */}
        {autoplayBlocked && !dismissedAutoplayMsg && <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/90 p-4 rounded-lg border border-green-200">
            <div className="text-green-700 text-base font-semibold mb-2 flex items-center gap-2">
              <Play className="h-5 w-5" /> Reprodução automática bloqueada
            </div>
            <div className="text-gray-700 text-sm mb-4 text-center max-w-xs">
              Seu navegador não permite reprodução automática.<br />
              Clique no botão <span className="font-bold">▶️</span> no player do Spotify para iniciar o episódio manualmente.
            </div>
            <button onClick={handleDismissAutoplayMsg} className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors focus:outline-none">
              Entendi
            </button>
          </div>}

        {oembedData && !oembedLoading && !selectedEpisode && <div dangerouslySetInnerHTML={{
        __html: oembedData.html
      }} className="spotify-embed" />}
        
        {/* Use selected episode embed URL or fallback to original iframe */}
        {(selectedEpisode?.embedUrl || (!oembedData || oembedError) && !oembedLoading) && currentEmbedUrl && <iframe ref={iframeRef} key={currentEmbedUrl} // forces a reload on embedUrl change
      src={currentEmbedUrl} width="100%" height="352" frameBorder="0" allowTransparency={true} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="rounded-lg" title={`${displayTitle} - Spotify Player`} onLoad={handleIframeLoad} style={{
        minHeight: 352
      }} />}
        
        {/* Fallback for generated episodes without embed */}
        {selectedEpisode && !selectedEpisode.isSpotifyEpisode && !selectedEpisode.embedUrl && <div className="flex items-center justify-center h-[352px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-center text-gray-500">
              <Play className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">Episódio Selecionado</p>
              <p className="text-sm">Player não disponível para episódios de exemplo</p>
            </div>
          </div>}
      </div>
      
      {/* Display oEmbed metadata if available and no selected episode */}
      {oembedData?.thumbnail_url && !selectedEpisode && <div className="px-4 pb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <img src={oembedData.thumbnail_url} alt="Episode thumbnail" className="w-8 h-8 rounded object-cover" />
            <span>Powered by {oembedData.provider_name}</span>
          </div>
        </div>}
    </div>;
};

export default SpotifyPlayerSection;
