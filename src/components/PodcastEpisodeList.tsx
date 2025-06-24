
import React, { useImperativeHandle, useState, forwardRef, useCallback } from "react";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { useGlobalSpotifyAuth } from "@/hooks/useGlobalSpotifyAuth";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { generateEpisodes, generateMoreEpisodes } from "@/utils/episodeGenerator";
import { generateEpisodeEmbedUrl } from "@/utils/spotifyUtils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import EpisodesHeader from "./PodcastEpisodeList/EpisodesHeader";
import SpotifyPlayerSection from "./PodcastEpisodeList/SpotifyPlayerSection";
import EpisodeItem from "./PodcastEpisodeList/EpisodeItem";
import SpotifyErrorDisplay from "./PodcastEpisodeList/SpotifyErrorDisplay";

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
    const { 
      isConfigured,
      isLoading: globalAuthLoading,
      error: authError,
      token
    } = useGlobalSpotifyAuth();
    
    const { 
      episodes: spotifyEpisodes, 
      loading: episodesLoading, 
      loadingMore: spotifyLoadingMore,
      error: episodesError,
      totalEpisodes,
      hasRealData, 
      hasMore: spotifyHasMore,
      loadMoreEpisodes: loadMoreSpotifyEpisodes
    } = useSpotifyEpisodes(embedUrl, 10);
    
    // Generated episodes state for fallback
    const [generatedEpisodes, setGeneratedEpisodes] = useState(() => 
      generateEpisodes(total, podcastTitle, 10, 0)
    );
    const [generatedHasMore, setGeneratedHasMore] = useState(total > 10);
    const [generatedLoadingMore, setGeneratedLoadingMore] = useState(false);

    // Use real Spotify episodes if available, otherwise fall back to generated ones
    const displayEpisodes = hasRealData ? spotifyEpisodes : generatedEpisodes;
    const hasMore = hasRealData ? spotifyHasMore : generatedHasMore;
    const loadingMore = hasRealData ? spotifyLoadingMore : generatedLoadingMore;

    // Selected episode state
    const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    const [playingFirst, setPlayingFirst] = useState(false);

    // Load more generated episodes
    const loadMoreGeneratedEpisodes = useCallback(() => {
      if (!generatedHasMore || generatedLoadingMore) return;
      
      setGeneratedLoadingMore(true);
      
      // Simulate loading delay
      setTimeout(() => {
        const moreEpisodes = generateMoreEpisodes(total, podcastTitle, generatedEpisodes, 10);
        setGeneratedEpisodes(prev => [...prev, ...moreEpisodes]);
        setGeneratedHasMore(generatedEpisodes.length + moreEpisodes.length < total);
        setGeneratedLoadingMore(false);
      }, 500);
    }, [total, podcastTitle, generatedEpisodes, generatedHasMore, generatedLoadingMore]);

    // Universal load more function
    const loadMore = useCallback(() => {
      if (hasRealData) {
        loadMoreSpotifyEpisodes();
      } else {
        loadMoreGeneratedEpisodes();
      }
    }, [hasRealData, loadMoreSpotifyEpisodes, loadMoreGeneratedEpisodes]);

    // Infinite scroll hook
    const { loadingRef } = useInfiniteScroll({
      hasMore,
      loading: loadingMore,
      onLoadMore: loadMore,
      threshold: 200
    });

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

    // Determine which error to show
    const displayError = episodesError || authError;
    
    // Enhanced error retry function
    const handleErrorRetry = () => {
      // For global auth errors, redirect to settings
      if (authError || !isConfigured) {
        window.location.href = '/settings';
      } else if (episodesError) {
        // Trigger re-fetch by calling loadMore
        loadMore();
      }
    };

    const handleConfigure = () => {
      // Navigate to settings for admin configuration
      window.location.href = '/settings';
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
          {/* Show error if authentication or episodes failed */}
          {displayError && (
            <SpotifyErrorDisplay
              error={displayError}
              onRetry={displayError.retryable ? handleErrorRetry : undefined}
              onConfigure={!isConfigured ? handleConfigure : undefined}
              authStatus={isConfigured ? 'success' : 'not_configured'}
              browserName="Browser"
              isConfigured={isConfigured}
            />
          )}
          
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
          
          {/* Episodes List */}
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
            generatedEpisodes.map((ep) => (
              <EpisodeItem
                key={ep.id}
                episode={ep}
                isSpotifyEpisode={false}
                isSelected={selectedEpisode?.id === ep.id.toString()}
                onEpisodeSelect={() => handleEpisodeSelect(ep, false)}
              />
            ))
          )}

          {/* Loading indicator and Load More button */}
          {hasMore && (
            <div ref={loadingRef} className="flex flex-col items-center gap-4 py-6">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Carregando mais episódios...</span>
                </div>
              ) : (
                <Button 
                  onClick={loadMore} 
                  variant="outline" 
                  className="w-48"
                  disabled={loadingMore}
                >
                  Carregar mais episódios
                </Button>
              )}
            </div>
          )}

          {/* End of list message */}
          {!hasMore && displayEpisodes.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>Você visualizou todos os {displayEpisodes.length} episódios disponíveis</p>
            </div>
          )}
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
