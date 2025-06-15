import { Badge } from "@/components/ui/badge";
interface EpisodesHeaderProps {
  hasRealData: boolean;
  episodeCount: number;
  total: number;
  episodesLoading: boolean;
}
const EpisodesHeader = ({
  hasRealData,
  episodeCount,
  total,
  episodesLoading
}: EpisodesHeaderProps) => {
  return <>
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-xl">Todos os Episódios</h2>
        <div className="flex items-center gap-2">
          {hasRealData}
          <Badge className="bg-lsb-primary/90 text-white">
            {hasRealData ? episodeCount : total} episódios
          </Badge>
        </div>
      </div>

      {episodesLoading && <div className="text-center py-8 text-gray-500">
          Carregando episódios do Spotify...
        </div>}
    </>;
};
export default EpisodesHeader;