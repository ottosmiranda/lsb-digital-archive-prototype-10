
import React from "react";
import SpotifyPlayerSection from "./SpotifyPlayerSection";
import EpisodesList from "./EpisodesList";
import LoadMoreSection from "./LoadMoreSection";

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

interface PodcastContentProps {
  embedUrl?: string;
  selectedEpisode: SelectedEpisode | null;
  playingFirst: boolean;
  podcastTitle: string;
  oembedData: any;
  oembedLoading: boolean;
  oembedError: string | null;
  authStatus: 'idle' | 'success' | 'failed' | 'not-configured';
  apiError: string | null;
  hasRealData: boolean;
  spotifyEpisodes: any[];
  generatedEpisodes: any[];
  onEpisodeSelect: (episode: any, isSpotifyEpisode: boolean) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  displayEpisodes: any[];
}

const PodcastContent = ({
  embedUrl,
  selectedEpisode,
  playingFirst,
  podcastTitle,
  oembedData,
  oembedLoading,
  oembedError,
  authStatus,
  apiError,
  hasRealData,
  spotifyEpisodes,
  generatedEpisodes,
  onEpisodeSelect,
  hasMore,
  loadingMore,
  onLoadMore,
  displayEpisodes
}: PodcastContentProps) => {
  return (
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
        onEpisodeSelect={onEpisodeSelect}
      />

      {/* Loading indicator and Load More button */}
      <LoadMoreSection
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        episodeCount={displayEpisodes.length}
      />
    </div>
  );
};

export default PodcastContent;
