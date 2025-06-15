
export const extractEpisodeId = (spotifyUrl: string): string | null => {
  // Extract episode ID from Spotify URLs
  const patterns = [
    /\/episode\/([a-zA-Z0-9]+)/,  // /episode/ID
    /spotify:episode:([a-zA-Z0-9]+)/, // spotify:episode:ID
  ];
  
  for (const pattern of patterns) {
    const match = spotifyUrl.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const generateEpisodeEmbedUrl = (spotifyUrl: string): string | null => {
  const episodeId = extractEpisodeId(spotifyUrl);
  if (!episodeId) return null;
  
  return `https://open.spotify.com/embed/episode/${episodeId}?utm_source=generator&theme=0`;
};
