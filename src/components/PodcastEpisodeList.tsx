import React, { useImperativeHandle, useState, forwardRef, useCallback } from "react";
import { usePodcastProgramEpisodes } from "@/hooks/usePodcastProgramEpisodes";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import EpisodesHeader from "./PodcastEpisodeList/EpisodesHeader";
import EpisodeItem from "./PodcastEpisodeList/EpisodeItem";

export interface PodcastEpisodeListHandles {
  playLatest: () => void;
}

interface PodcastEpisodeListProps {
  podcastTitle: string; // Nome do programa do podcast
  currentEpisodeId?: string; // ID do episódio atual para destacar
  embedUrl?: string; // URL do player principal
}

interface SelectedEpisode {
  id: string;
  title: string;
  description: string;
  date: string;
  duration: string;
  embedUrl?: string;
}

const PodcastEpisodeList = forwardRef<PodcastEpisodeListHandles, PodcastEpisodeListProps>(
  ({ podcastTitle, currentEpisodeId, embedUrl }, ref) => {
    const {
      episodes,
      programInfo,
      loading,
      loadingMore,
      error,
      hasMore,
      totalEpisodes,
      loadMoreEpisodes
    } = usePodcastProgramEpisodes(podcastTitle, 10);

    // Selected episode state
    const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    const [playingFirst, setPlayingFirst] = useState(false);

    // Infinite scroll hook
    const { loadingRef } = useInfiniteScroll({
      hasMore,
      loading: loadingMore,
      onLoadMore: loadMoreEpisodes,
      threshold: 200
    });

    // Handle episode selection
    const handleEpisodeSelect = (episode: any) => {
      const selectedEpisodeData: SelectedEpisode = {
        id: episode.episodio_id || episode.id.toString(),
        title: episode.title,
        description: episode.description,
        date: new Date().toLocaleDateString('pt-BR'), // Fallback date
        duration: episode.duration || "45:00",
        embedUrl: episode.embedUrl
      };

      setSelectedEpisode(selectedEpisodeData);
      setPlayingFirst(true);

      // Scroll to main player
      const section = document.getElementById("all-episodes-list");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Expose "playLatest" method to parent
    useImperativeHandle(ref, () => ({
      playLatest: () => {
        setPlayingFirst(true);
        setSelectedEpisode(null); // Reset to show original player
      },
    }));

    if (loading) {
      return (
        <section className="mt-10" id="all-episodes-list">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Carregando episódios...</span>
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="mt-10" id="all-episodes-list">
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar episódios
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section className="mt-10" id="all-episodes-list">
        <EpisodesHeader
          hasRealData={true}
          episodeCount={totalEpisodes}
          total={totalEpisodes}
          episodesLoading={false}
        />
        
        <div className="flex flex-col gap-5">
          {/* Main Player Section */}
          {embedUrl && (
            <div className="bg-white rounded-xl border shadow-sm px-6 pt-6 pb-6">
              <h3 className="font-semibold text-lg mb-4">
                {selectedEpisode ? selectedEpisode.title : "Player Principal"}
              </h3>
              <div className="aspect-video w-full rounded-lg overflow-hidden">
                <iframe
                  src={selectedEpisode?.embedUrl || embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="encrypted-media"
                  className="w-full h-full"
                  title={selectedEpisode?.title || "Podcast Player"}
                />
              </div>
            </div>
          )}
          
          {/* Episodes List */}
          {episodes.length > 0 ? (
            episodes.map((episode) => (
              <EpisodeItem
                key={episode.id}
                episode={episode}
                isSpotifyEpisode={false}
                isSelected={
                  selectedEpisode?.id === (episode.episodio_id || episode.id.toString()) ||
                  currentEpisodeId === (episode.episodio_id || episode.id.toString())
                }
                onEpisodeSelect={() => handleEpisodeSelect(episode)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum episódio encontrado para este programa.</p>
            </div>
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
                  onClick={loadMoreEpisodes} 
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
          {!hasMore && episodes.length > 0 && (
            <div className="text-center py-6 text-gray-500">
              <p>Você visualizou todos os {episodes.length} episódios disponíveis</p>
            </div>
          )}
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
