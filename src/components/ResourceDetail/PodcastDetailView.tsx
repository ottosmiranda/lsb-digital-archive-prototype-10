
import { useEffect, useRef } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ResourceBreadcrumb from "./ResourceBreadcrumb";
import BackButton from "./BackButton";
import PodcastDetailHero from "@/components/PodcastDetailHero";
import PodcastEpisodeList from "@/components/PodcastEpisodeList";
import { Resource } from "@/types/resourceTypes";

interface PodcastDetailViewProps {
  podcast: Resource;
}

const PodcastDetailView = ({ podcast }: PodcastDetailViewProps) => {
  const episodesListRef = useRef<any>(null);

  // Scroll to top when component mounts or when podcast changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [podcast.id]);

  const handlePlayLatest = () => {
    const section = document.getElementById("all-episodes-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (episodesListRef.current && typeof episodesListRef.current.playLatest === "function") {
      episodesListRef.current.playLatest();
    }
  };

  // ✅ CORRIGIDO: Usar podcast_titulo para título, subject para badges
  const programTitle = (podcast as any).podcast_titulo || podcast.title;
  const badgeCategory = podcast.subject; // Para badges (categorias da API)
  
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
        <ResourceBreadcrumb title={programTitle} />
        <BackButton />
        <PodcastDetailHero
          cover={podcast.thumbnail}
          title={programTitle}
          publisher={podcast.author}
          episodeCount={podcast.episodes ? parseInt(`${podcast.episodes}`) : 0}
          year={podcast.year}
          categories={badgeCategory ? [badgeCategory] : []}
          description={podcast.description || `Programa de podcast "${programTitle}" com episódios disponíveis.`}
          onPlayLatest={handlePlayLatest}
        />
        <PodcastEpisodeList
          ref={episodesListRef}
          podcastTitle={programTitle}
          currentEpisodeId={podcast.id.toString()}
          embedUrl={podcast.embedUrl}
        />
      </div>
      <Footer />
    </div>
  );
};

export default PodcastDetailView;
