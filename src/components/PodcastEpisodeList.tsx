
import React, { useImperativeHandle, useState, forwardRef } from "react";
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
  podcastTitle: string;
  currentEpisodeId?: string;
  embedUrl?: string;
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

    const [selectedEpisode, setSelectedEpisode] = useState<SelectedEpisode | null>(null);
    const [playingFirst, setPlayingFirst] = useState(false);

    const { loadingRef } = useInfiniteScroll({
      hasMore,
      loading: loadingMore,
      onLoadMore: loadMoreEpisodes,
      threshold: 200
    });

    const handleEpisodeSelect = (episode: any) => {
      const selectedEpisodeData: SelectedEpisode = {
        id: episode.episodio_id || episode.id.toString(),
        title: episode.title,
        description: episode.description,
        date: new Date().toLocaleDateString('pt-BR'),
        duration: episode.duration || "45:00",
        embedUrl: episode.embedUrl
      };

      setSelectedEpisode(selectedEpisodeData);
      setPlayingFirst(true);

      const section = document.getElementById("all-episodes-list");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    useImperativeHandle(ref, () => ({
      playLatest: () => {
        setPlayingFirst(true);
        setSelectedEpisode(null);
      },
    }));

    if (loading) {
      return (
        <section className="mt-8 md:mt-10 px-4 md:px-0" id="all-episodes-list">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            <span className="ml-2 text-gray-600">Carregando episódios...</span>
          </div>
        </section>
      );
    }

    if (error) {
      return (
        <section className="mt-8 md:mt-10 px-4 md:px-0" id="all-episodes-list">
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar episódios
            </h3>
            <p className="text-gray-600 mb-4 px-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </section>
      );
    }

    return (
      <section className="mt-8 md:mt-10 px-4 md:px-0" id="all-episodes-list">
        <EpisodesHeader
          episodeCount={totalEpisodes}
          episodesLoading={false}
        />
        
        <div className="flex flex-col gap-4 md:gap-5">
          {/* Main Player Section */}
          {embedUrl && (
            <div className="bg-white rounded-[2px] border shadow-sm p-4 md:px-6 md:pt-6 md:pb-6">
              <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4 text-center md:text-left">
                {selectedEpisode ? selectedEpisode.title : "Player Principal"}
              </h3>
              <div className="w-full rounded-[2px] overflow-hidden" style={{ height: '280px' }}>
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
                isSelected={
                  selectedEpisode?.id === (episode.episodio_id || episode.id.toString()) ||
                  currentEpisodeId === (episode.episodio_id || episode.id.toString())
                }
                onEpisodeSelect={() => handleEpisodeSelect(episode)}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 px-4">
              <p>Nenhum episódio encontrado para este programa.</p>
            </div>
          )}

          {/* Loading indicator and Load More button */}
          {hasMore && (
            <div ref={loadingRef} className="flex flex-col items-center gap-4 py-6">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm md:text-base">Carregando mais episódios...</span>
                </div>
              ) : (
                <Button 
                  onClick={loadMoreEpisodes} 
                  variant="outline" 
                  className="w-full sm:w-48"
                  disabled={loadingMore}
                >
                  Carregar mais episódios
                </Button>
              )}
            </div>
          )}

          {!hasMore && episodes.length > 0 && (
            <div className="text-center py-6 text-gray-500 px-4">
              <p className="text-sm md:text-base">
                Você visualizou todos os {episodes.length} episódios disponíveis
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }
);

export default PodcastEpisodeList;
