
import { useCallback } from "react";
import { generateEpisodeEmbedUrl } from "@/utils/spotifyUtils";

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

interface EpisodeSelectorProps {
  onEpisodeSelect: (episode: SelectedEpisode) => void;
  setPlayingFirst: (playing: boolean) => void;
}

export const useEpisodeSelector = ({ onEpisodeSelect, setPlayingFirst }: EpisodeSelectorProps) => {
  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return "45:00";
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEpisodeSelect = useCallback((episode: any, isSpotifyEpisode: boolean) => {
    let episodeEmbedUrl = null;
    let spotifyUrl = null;
    
    if (isSpotifyEpisode && episode.external_urls?.spotify) {
      episodeEmbedUrl = generateEpisodeEmbedUrl(episode.external_urls.spotify);
      spotifyUrl = episode.external_urls.spotify;
    }

    const selectedEpisodeData: SelectedEpisode = {
      id: isSpotifyEpisode ? episode.id : episode.id.toString(),
      title: isSpotifyEpisode ? episode.name : episode.title,
      description: isSpotifyEpisode ? episode.description : episode.desc,
      date: isSpotifyEpisode ? episode.release_date : episode.date,
      duration: isSpotifyEpisode ? formatDuration(episode.duration_ms) : episode.duration,
      embedUrl: episodeEmbedUrl || undefined,
      isSpotifyEpisode,
      spotifyUrl
    };

    onEpisodeSelect(selectedEpisodeData);
    setPlayingFirst(true);

    // Scroll to main player
    const section = document.getElementById("all-episodes-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [onEpisodeSelect, setPlayingFirst]);

  return { handleEpisodeSelect };
};

export default useEpisodeSelector;
