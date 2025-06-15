
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
  podcastTitle: string
): GeneratedEpisode[] {
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
