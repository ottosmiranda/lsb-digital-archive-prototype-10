
import { Badge } from "@/components/ui/badge";

interface EpisodesHeaderProps {
  episodeCount: number;
  episodesLoading: boolean;
}

const EpisodesHeader = ({
  episodeCount,
  episodesLoading
}: EpisodesHeaderProps) => {
  return (
    <>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-xl">Todos os Episódios</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-lsb-primary/90 text-white">
            {episodeCount} episódios
          </Badge>
        </div>
      </div>

      {episodesLoading && (
        <div className="text-center py-8 text-gray-500">
          Carregando episódios da API...
        </div>
      )}
    </>
  );
};

export default EpisodesHeader;
