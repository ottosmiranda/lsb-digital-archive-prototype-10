
import { Play, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Helper to generate human fake episode durations/titles/descriptions/dates
function generateEpisodes(
  total: number,
  podcastTitle: string
): {
  id: number;
  title: string;
  date: string;
  desc: string;
  duration: string;
  isNew: boolean;
}[] {
  const baseDesc =
    "Neste episódio, discutimos temas atuais de inovação, gestão e tecnologia no contexto empresarial.";
  const today = new Date();
  const episodes = [];
  // Start from episode 2 since episode 1 is now the Spotify player
  for (let i = total; i > 1; i--) {
    // Episodes are weekly, count back by 1 week each
    const date = new Date(today);
    date.setDate(today.getDate() - (total - i) * 7);
    const formattedDate = date
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      .replace(/\./g, "");
    const isNew = (total - i) < 2; // Last 2 are "NEW"
    episodes.push({
      id: i,
      title: `Episódio ${i}: ${podcastTitle} ${i}`,
      date: formattedDate,
      desc: baseDesc,
      duration: (20 + Math.floor(Math.random() * 16)) + ":" + String(Math.floor(Math.random() * 60)).padStart(2, "0"),
      isNew,
    });
  }
  return episodes;
}

interface PodcastEpisodeListProps {
  total: number;
  podcastTitle: string;
  embedUrl?: string;
}

const PodcastEpisodeList = ({ total, podcastTitle, embedUrl }: PodcastEpisodeListProps) => {
  const episodes = generateEpisodes(total, podcastTitle);
  
  return (
    <section className="mt-10">
      <div className="flex justify-between items-center mb-5">
        <h2 className="font-semibold text-xl">Todos os Episódios</h2>
        <Badge className="bg-lsb-primary/90 text-white">{total} episódios</Badge>
      </div>
      
      <div className="flex flex-col gap-5">
        {/* Spotify Player - First Episode */}
        {embedUrl && (
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex gap-2 items-center mb-2">
                <h3 className="font-semibold">Episódio 1: {podcastTitle} - Episódio Mais Recente</h3>
                <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Ouça o episódio mais recente diretamente no Spotify
              </p>
              <div className="flex gap-4 text-xs text-gray-500 items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "")}</span>
                <Clock className="h-3 w-3 ml-3 mr-1" />
                <span>45:00</span>
              </div>
            </div>
            
            {/* Spotify Iframe Player */}
            <div className="p-4">
              <iframe
                src={embedUrl}
                width="100%"
                height="352"
                frameBorder="0"
                allowTransparency="true"
                allow="encrypted-media"
                className="rounded-lg"
                title={`${podcastTitle} - Spotify Player`}
              />
            </div>
          </div>
        )}
        
        {/* Generated Episodes List */}
        {episodes.map((ep) => (
          <div
            key={ep.id}
            className="flex items-center gap-4 px-4 py-3 bg-white border rounded-xl shadow-sm"
          >
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                <Play className="h-7 w-7 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 items-center">
                <h3 className="font-semibold truncate">{ep.title}</h3>
                {ep.isNew && (
                  <Badge className="bg-green-600 text-white ml-1">NOVO</Badge>
                )}
              </div>
              <p className="text-sm line-clamp-2 text-gray-600">{ep.desc}</p>
              <div className="flex gap-4 mt-1 text-xs text-gray-500 items-center">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{ep.date}</span>
                <Clock className="h-3 w-3 ml-3 mr-1" />
                <span>{ep.duration}</span>
              </div>
            </div>
            <button
              className="ml-2 p-2 rounded-full bg-purple-600 hover:bg-purple-700 transition text-white"
              aria-label="Ouvir episódio"
            >
              <Play className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PodcastEpisodeList;
