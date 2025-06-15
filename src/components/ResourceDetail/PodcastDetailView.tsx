
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ResourceBreadcrumb from "./ResourceBreadcrumb";
import BackButton from "./BackButton";
import PodcastDetailHero from "@/components/PodcastDetailHero";
import PodcastEpisodeList from "@/components/PodcastEpisodeList";
import { Resource } from "@/types/resourceTypes";
import { useRef } from "react";

interface PodcastDetailViewProps {
  podcast: Resource;
}

const PodcastDetailView = ({ podcast }: PodcastDetailViewProps) => {
  const episodesListRef = useRef<any>(null);
  const handlePlayLatest = () => {
    const section = document.getElementById("all-episodes-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (episodesListRef.current && typeof episodesListRef.current.playLatest === "function") {
      episodesListRef.current.playLatest();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
        <ResourceBreadcrumb title={podcast.title} />
        <BackButton />
        <PodcastDetailHero
          cover={podcast.thumbnail}
          title={podcast.title}
          publisher={podcast.author}
          episodeCount={parseInt(`${podcast.episodes}`) || 1}
          year={podcast.year}
          categories={podcast.subject ? [podcast.subject] : []}
          description={podcast.description}
          onPlayLatest={handlePlayLatest}
        />
        <PodcastEpisodeList
          ref={episodesListRef}
          total={parseInt(`${podcast.episodes}`) || 1}
          podcastTitle={podcast.title}
          embedUrl={podcast.embedUrl}
        />
      </div>
      <Footer />
    </div>
  );
};

export default PodcastDetailView;
