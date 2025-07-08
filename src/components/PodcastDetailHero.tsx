
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Tag, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareButtons from "@/components/ShareButtons";
import React from "react";

const fallbackImg = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80";

interface PodcastDetailHeroProps {
  cover?: string;
  title: string;
  publisher: string;
  episodeCount: number;
  year: number;
  categories: string[];
  description: string;
  onPlayLatest?: () => void;
}

const PodcastDetailHero = ({
  cover,
  title,
  publisher,
  episodeCount,
  year,
  categories,
  description,
  onPlayLatest
}: PodcastDetailHeroProps) => {
  const shareUrl = window.location.href;
  const shareTitle = title;
  const shareDescription = description;

  return (
    <section className="relative mb-8">
      {/* Hero: 3-column layout - Cover, Info + Button, Share Card */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 py-[7px]">
        {/* Column 1: Cover Image */}
        <div className="flex-shrink-0">
          <img 
            src={cover || fallbackImg} 
            alt={title} 
            className="w-48 h-48 md:w-60 md:h-60 object-cover rounded-2xl border shadow-md bg-gray-200" 
            onError={e => {
              (e.target as HTMLImageElement).src = fallbackImg;
            }} 
          />
        </div>

        {/* Column 2: Program Info and Play Button */}
        <div className="flex-1 flex flex-col justify-between py-2">
          {/* Category badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.length > 0 && categories.map(cat => (
              <Badge variant="outline" key={cat} className="text-xs">
                <Tag className="inline h-3 w-3 mr-1" />
                {cat}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{title}</h1>
          <div className="flex items-center gap-3 mb-4 mt-2">
            <User className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-base text-gray-700">{publisher}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span>Desde {year}</span>
          </div>
          
          {/* Play Button */}
          <div className="mt-2">
            <Button 
              data-testid="play-last-episode" 
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition" 
              onClick={onPlayLatest} 
              aria-label="Ouça o episódio"
            >
              <Play className="h-5 w-5 mr-2" />
              Ouça o episódio
            </Button>
          </div>
        </div>

        {/* Column 3: Share Card */}
        <div className="flex-shrink-0 w-full lg:w-auto">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Compartilhar</h3>
                <ShareButtons
                  shareUrl={shareUrl}
                  shareTitle={shareTitle}
                  shareDescription={shareDescription}
                  layout="vertical"
                  iconSize={32}
                  showCopyButton={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      <div className="mt-7">
        <Card>
          <CardContent className="p-4">
            <h2 className="font-semibold text-xl mb-2">Sobre o Podcast</h2>
            <p className="text-base text-gray-700">{description}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PodcastDetailHero;
