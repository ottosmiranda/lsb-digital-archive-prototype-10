
import React, { useImperativeHandle, useState, forwardRef } from "react";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { generateEpisodes } from "@/utils/episodeGenerator";
// Removed: import SpotifyPlayerSection from "./PodcastEpisodeList/SpotifyPlayerSection";
import EpisodeItem from "./PodcastEpisodeList/EpisodeItem";
import EpisodesHeader from "./PodcastEpisodeList/EpisodesHeader";

export interface PodcastEpisodeListHandles {
  playLatest: () => void;
}
interface PodcastEpisodeListProps {
  total: number;
  podcastTitle: string;
  embedUrl?: string;
  // new:
  onEpisodeSelect?: (ep: any) => void;
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
  ({ total, podcastTitle, embedUrl, onEpisodeSelect }, ref) => {
    const { oembedData, loading: oembedLoading, error: oembedError } = useSpotifyOEmbed(embedUrl);
    const { episodes: spotifyEpisodes, loading: episodesLoading, hasRealData } = useSpotifyEpisodes(embedUrl);

    const fallbackEpisodes = generateEpisodes(total, podcastTitle);
    const displayEpisodes = hasRealData ? spotifyEpisodes : fallbackEpisodes;

    // Remove own player state; operate stateless, notify parent
    // const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    // const [playingFirst, setPlayingFirst] = useState(false);

    // Notify parent of episode selection
    const handleEpisodeSelect = (episode: any, isSpotifyEpisode: boolean) => {
      let episodeEmbedUrl = null;
      if (isSpotifyEpisode && episode.external_urls?.spotify) {
        // @ts-ignore: need embedUrl
        const { generateEpisodeEmbedUrl } = require("@/utils/spotifyUtils");
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
      onEpisodeSelect?.(selectedEpisodeData);
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
        onEpisodeSelect?.(null);
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
          {/* --- Player removed; unified player is above --- */}
          {/* --- Only show episode selection list now --- */}
          {hasRealData ? (
            // Real Spotify Episodes
            spotifyEpisodes.map((episode, index) => (
              <EpisodeItem
                key={episode.id}
                episode={episode}
                isSpotifyEpisode={true}
                index={index}
                // Remove isSelected: selection now handled by parent/player in Hero
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
