import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ResourceBreadcrumb from "./ResourceBreadcrumb";
import BackButton from "./BackButton";
import PodcastDetailHero from "@/components/PodcastDetailHero";
import PodcastEpisodeList from "@/components/PodcastEpisodeList";
import { useSpotifyOEmbed } from "@/hooks/useSpotifyOEmbed";
import { useSpotifyEpisodes } from "@/hooks/useSpotifyEpisodes";
import { generateEpisodes } from "@/utils/episodeGenerator";
import { generateEpisodeEmbedUrl } from "@/utils/spotifyUtils";
import { Resource } from "@/types/resourceTypes";
import React, { useRef, useState } from "react";

interface PodcastDetailViewProps {
  podcast: Resource;
}

const PodcastDetailView = ({ podcast }: PodcastDetailViewProps) => {
  const episodesListRef = useRef<any>(null);

  // New: Keep main player state in this component!
  const { oembedData, loading: oembedLoading, error: oembedError } = useSpotifyOEmbed(podcast.embedUrl);
  const { episodes: spotifyEpisodes, loading: episodesLoading, hasRealData } = useSpotifyEpisodes(podcast.embedUrl);
  const fallbackEpisodes = generateEpisodes(Number(podcast.episodes) || 1, podcast.title);
  const displayEpisodes = hasRealData ? spotifyEpisodes : fallbackEpisodes;

  // Unified main player state:
  const [selectedEpisode, setSelectedEpisode] = useState<any | null>(null);
  const [playingFirst, setPlayingFirst] = useState(true);

  // Play latest scroll & reset
  const handlePlayLatest = () => {
    const section = document.getElementById("all-episodes-list");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setPlayingFirst(true);
    setSelectedEpisode(null);
  };

  // Handle episode selection from episode list
  const handleEpisodeSelect = (episode: any) => {
    setSelectedEpisode(episode);
    setPlayingFirst(false);
    // Make sure player scrolls into view on episode select
    const hero = document.querySelector(".PodcastHeroPlayer") || document.getElementById("PodcastHeroPlayer");
    if (hero) {
      hero.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
        <ResourceBreadcrumb title={podcast.title} />
        <BackButton />
        <div id="PodcastHeroPlayer" className="PodcastHeroPlayer">
          <PodcastDetailHero
            cover={podcast.thumbnail}
            title={podcast.title}
            publisher={podcast.author}
            episodeCount={parseInt(`${podcast.episodes}`) || 1}
            year={podcast.year}
            categories={podcast.subject ? [podcast.subject] : []}
            description={podcast.description}
            embedUrl={podcast.embedUrl}
            podcastTitle={podcast.title}
            selectedEpisode={selectedEpisode}
            playingFirst={playingFirst}
            oembedData={oembedData}
            oembedLoading={oembedLoading}
            oembedError={oembedError}
            onEpisodeChange={setSelectedEpisode}
          />
        </div>
        <PodcastEpisodeList
          ref={episodesListRef}
          total={parseInt(`${podcast.episodes}`) || 1}
          podcastTitle={podcast.title}
          embedUrl={podcast.embedUrl}
          onEpisodeSelect={handleEpisodeSelect}
        />
      </div>
      <Footer />
    </div>
  );
};

export default PodcastDetailView;
