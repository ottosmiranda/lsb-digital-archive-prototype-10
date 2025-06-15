
import React, { useImperativeHandle, useState, forwardRef } from "react";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { generateEpisodes } from "@/utils/episodeGenerator";
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

const PodcastEpisodeList = forwardRef<PodcastEpisodeListHandles, PodcastEpisodeListProps>(
  ({ total, podcastTitle, embedUrl }, ref) => {
    const { oembedData, loading: oembedLoading, error: oembedError } = useSpotifyOEmbed(embedUrl);
    const { episodes: spotifyEpisodes, loading: episodesLoading, hasRealData } = useSpotifyEpisodes(embedUrl);
    
    // Use real Spotify episodes if available, otherwise fall back to generated ones
    const fallbackEpisodes = generateEpisodes(total, podcastTitle);
    const displayEpisodes = hasRealData ? spotifyEpisodes : fallbackEpisodes;

    // "Play" state management, allowing parent to set to playing
    const [playingFirst, setPlayingFirst] = useState(false);

    // Expose "playLatest" method to parent
    useImperativeHandle(ref, () => ({
      playLatest: () => {
        setPlayingFirst(true);
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
          {/* Spotify Player - First Episode */}
          {embedUrl && (
            <SpotifyPlayerSection
              embedUrl={embedUrl}
              playingFirst={playingFirst}
              podcastTitle={podcastTitle}
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
              />
            ))
          ) : (
            // Generated Episodes List (Fallback)
            fallbackEpisodes.map((ep) => (
              <EpisodeItem
                key={ep.id}
                episode={ep}
                isSpotifyEpisode={false}
              />
            ))
          )}
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
