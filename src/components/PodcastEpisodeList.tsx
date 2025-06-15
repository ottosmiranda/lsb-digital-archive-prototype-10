
import React, { useImperativeHandle, useState, forwardRef } from "react";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { generateEpisodes } from "@/utils/episodeGenerator";
import { generateEpisodeEmbedUrl } from "@/utils/spotifyUtils";
import EpisodesHeader from "./PodcastEpisodeList/EpisodesHeader";
import SpotifyPlayerSection from "./PodcastEpisodeList/SpotifyPlayerSection";
import EpisodeItem from "./PodcastEpisodeList/EpisodeItem";

export interface PodcastEpisodeListHandles {
  playLatest: () => void;
}

interface PodcastEpisodeListProps {
  total: number;
  podcastTitle: string;
  embedUrl?: string;
}

interface SelectedEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  embedUrl?: string;
  isSpotifyEpisode: boolean;
}

const PodcastEpisodeList = forwardRef<PodcastEpisodeListHandles, PodcastEpisodeListProps>(
  ({ total, podcastTitle, embedUrl }, ref) => {
    const { oembedData, loading: oembedLoading, error: oembedError } = useSpotifyOEmbed(embedUrl);
    const { episodes: spotifyEpisodes, loading: episodesLoading, hasRealData } = useSpotifyEpisodes(embedUrl);
    
    // Use real Spotify episodes if available, otherwise fall back to generated ones
    const fallbackEpisodes = generateEpisodes(total, podcastTitle);
    const displayEpisodes = hasRealData ? spotifyEpisodes : fallbackEpisodes;

    // Selected episode state
    const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    const [playingFirst, setPlayingFirst] = useState(false);

    // Handle episode selection
    const handleEpisodeSelect = (episode: any, isSpotifyEpisode: boolean) => {
      let episodeEmbedUrl = null;
      
      if (isSpotifyEpisode && episode.external_urls?.spotify) {
        episodeEmbedUrl = generateEpisodeEmbedUrl(episode.external_urls.spotify);
      }

      const selectedEpisodeData: SelectedEpisode = {
        id: isSpotifyEpisode ? episode.id : episode.id.toString(),
        title: isSpotifyEpisode ? episode.name : episode.title,
        description: isSpotifyEpisode ? episode.description : episode.desc,
        date: isSpotifyEpisode ? episode.release_date : episode.date,
        duration: isSpotifyEpisode ? formatDuration(episode.duration_ms) : episode.duration,
        embedUrl: episodeEmbedUrl || undefined,
        isSpotifyEpisode
      };

      setSelectedEpisode(selectedEpisodeData);
      setPlayingFirst(true);

      // Scroll to main player
      const section = document.getElementById("all-episodes-list");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const formatDuration = (durationMs?: number) => {
      if (!durationMs) return "45:00";
      const minutes = Math.floor(durationMs / 60000);
      const seconds = Math.floor((durationMs % 60000) / 1000);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Expose "playLatest" method to parent
    useImperativeHandle(ref, () => ({
      playLatest: () => {
        setPlayingFirst(true);
        setSelectedEpisode(null); // Reset to show original player
      },
    }));

    return (
      <section className="mt-10" id="all-episodes-list">
        <EpisodesHeader
          hasRealData={hasRealData}
          episodeCount={spotifyEpisodes.length}
          total={total}
          episodesLoading={episodesLoading}
        />
        
        <div className="flex flex-col gap-5">
          {/* Spotify Player - First Episode or Selected Episode */}
          {embedUrl && (
            <SpotifyPlayerSection
              embedUrl={selectedEpisode?.embedUrl || embedUrl}
              playingFirst={playingFirst}
              podcastTitle={podcastTitle}
              selectedEpisode={selectedEpisode}
              oembedData={oembedData}
              oembedLoading={oembedLoading}
              oembedError={oembedError}
            />
          )}
          
          {/* Episodes List - Real or Generated */}
          {hasRealData ? (
            // Real Spotify Episodes
            spotifyEpisodes.map((episode, index) => (
              <EpisodeItem
                key={episode.id}
                episode={episode}
                isSpotifyEpisode={true}
                index={index}
                isSelected={selectedEpisode?.id === episode.id}
                onEpisodeSelect={() => handleEpisodeSelect(episode, true)}
              />
            ))
          ) : (
            // Generated Episodes List (Fallback)
            fallbackEpisodes.map((ep) => (
              <EpisodeItem
                key={ep.id}
                episode={ep}
                isSpotifyEpisode={false}
                isSelected={selectedEpisode?.id === ep.id.toString()}
                onEpisodeSelect={() => handleEpisodeSelect(ep, false)}
              />
            ))
          )}
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
