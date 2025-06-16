
export interface GeneratedEpisode {
  id: number;
  title: string;
  date: string;
  desc: string;
  duration: string;
  isNew: boolean;
}

export function generateEpisodes(
  total: number,
  podcastTitle: string,
  limit = 10,
  offset = 0
): GeneratedEpisode[] {
  const baseDesc =
    "Neste episódio, discutimos temas atuais de inovação, gestão e tecnologia no contexto empresarial.";
  const today = new Date();
  const episodes = [];
  
  const startEpisode = Math.max(1, total - offset);
  const endEpisode = Math.max(1, total - offset - limit + 1);
  
  for (let i = startEpisode; i >= endEpisode; i--) {
    const episodeIndex = total - i;
    const date = new Date(today);
    date.setDate(today.getDate() - episodeIndex * 7);
    
    const formattedDate = date
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
      .replace(/\./g, "");
    
    const isNew = episodeIndex < 2;
    
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

export function generateMoreEpisodes(
  total: number,
  podcastTitle: string,
  currentEpisodes: GeneratedEpisode[],
  limit = 10
): GeneratedEpisode[] {
  const offset = currentEpisodes.length;
  return generateEpisodes(total, podcastTitle, limit, offset);
}
