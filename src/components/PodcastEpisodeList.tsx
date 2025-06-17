
import React, { useImperativeHandle, useState, forwardRef } from "react";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { useEpisodeManagement } from "@/hooks/useEpisodeManagement";
import { useEpisodeSelector } from "./PodcastEpisodeList/EpisodeSelector";
import EpisodesHeader from "./PodcastEpisodeList/EpisodesHeader";
import SpotifyPlayerSection from "./PodcastEpisodeList/SpotifyPlayerSection";
import EpisodesList from "./PodcastEpisodeList/EpisodesList";
import LoadMoreSection from "./PodcastEpisodeList/LoadMoreSection";

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
  spotifyUrl?: string;
}

const PodcastEpisodeList = forwardRef<PodcastEpisodeListHandles, PodcastEpisodeListProps>(
  ({ total, podcastTitle, embedUrl }, ref) => {
    const { oembedData, loading: oembedLoading, error: oembedError } = useSpotifyOEmbed(embedUrl);
    const { 
      episodes: spotifyEpisodes, 
      loading: episodesLoading, 
      loadingMore: spotifyLoadingMore,
      totalEpisodes,
      hasRealData, 
      hasMore: spotifyHasMore,
      authStatus,
      apiError,
      loadMoreEpisodes: loadMoreSpotifyEpisodes
    } = useSpotifyEpisodes(embedUrl, 10);
    
    const {
      generatedEpisodes,
      generatedHasMore,
      generatedLoadingMore,
      loadMoreGeneratedEpisodes
    } = useEpisodeManagement(total, podcastTitle);

    // Use real Spotify episodes if available, otherwise fall back to generated ones
    const displayEpisodes = hasRealData ? spotifyEpisodes : generatedEpisodes;
    const hasMore = hasRealData ? spotifyHasMore : generatedHasMore;
    const loadingMore = hasRealData ? spotifyLoadingMore : generatedLoadingMore;

    // Selected episode state
    const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    const [playingFirst, setPlayingFirst] = useState(false);

    // Episode selection logic
    const { handleEpisodeSelect } = useEpisodeSelector({
      onEpisodeSelect: setSelectedEpisode,
      setPlayingFirst
    });

    // Universal load more function
    const loadMore = () => {
      if (hasRealData) {
        loadMoreSpotifyEpisodes();
      } else {
        loadMoreGeneratedEpisodes();
      }
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
          episodeCount={hasRealData ? totalEpisodes : total}
          total={total}
          episodesLoading={episodesLoading}
        />
        
        <div className="flex flex-col gap-5">
          {/* Enhanced Spotify Player with auth status */}
          {embedUrl && (
            <SpotifyPlayerSection
              embedUrl={selectedEpisode?.embedUrl || embedUrl}
              playingFirst={playingFirst}
              podcastTitle={podcastTitle}
              selectedEpisode={selectedEpisode}
              oembedData={oembedData}
              oembedLoading={oembedLoading}
              oembedError={oembedError}
              authStatus={authStatus}
              apiError={apiError}
            />
          )}
          
          {/* Episodes List */}
          <EpisodesList
            hasRealData={hasRealData}
            spotifyEpisodes={spotifyEpisodes}
            generatedEpisodes={generatedEpisodes}
            selectedEpisode={selectedEpisode}
            onEpisodeSelect={handleEpisodeSelect}
          />

          {/* Loading indicator and Load More button */}
          <LoadMoreSection
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={loadMore}
            episodeCount={displayEpisodes.length}
          />
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
