
import EpisodeItem from "./EpisodeItem";

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

interface EpisodesListProps {
  hasRealData: boolean;
  spotifyEpisodes: any[];
  generatedEpisodes: any[];
  selectedEpisode: SelectedEpisode | null;
  onEpisodeSelect: (episode: any, isSpotifyEpisode: boolean) => void;
}

const EpisodesList = ({
  hasRealData,
  spotifyEpisodes,
  generatedEpisodes,
  selectedEpisode,
  onEpisodeSelect
}: EpisodesListProps) => {
  return (
    <>
      {hasRealData ? (
        // Real Spotify Episodes
        spotifyEpisodes.map((episode, index) => (
          <EpisodeItem
            key={episode.id}
            episode={episode}
            isSpotifyEpisode={true}
            index={index}
            isSelected={selectedEpisode?.id === episode.id}
            onEpisodeSelect={() => onEpisodeSelect(episode, true)}
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
            onEpisodeSelect={() => onEpisodeSelect(ep, false)}
          />
        ))
      )}
    </>
  );
};

export default EpisodesList;
