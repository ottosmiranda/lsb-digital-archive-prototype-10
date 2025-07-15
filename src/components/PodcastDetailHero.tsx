
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, Tag, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareButtons from "@/components/ShareButtons";
import ThumbnailPlaceholder from "@/components/ui/ThumbnailPlaceholder";
import { useThumbnailFallback } from "@/hooks/useThumbnailFallback";
import React from "react";

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
  const { handleImageError } = useThumbnailFallback();
  const shareUrl = window.location.href;
  const shareTitle = title;
  const shareDescription = description;

  return (
    <section className="relative mb-6 md:mb-8 px-4 md:px-0">
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col space-y-6 md:space-y-0 md:flex-row md:gap-6 lg:gap-8 py-2 md:py-[7px]">
        {/* Cover Image - Full width on mobile, left on desktop */}
        <div className="flex justify-center md:justify-start flex-shrink-0">
          <div className="w-full h-64 sm:w-48 sm:h-48 md:w-60 md:h-60 relative overflow-hidden rounded-lg border shadow-md bg-gray-200">
            {cover && (
              <img 
                src={cover} 
                alt={title} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            )}
            <ThumbnailPlaceholder
              type="podcast"
              className="w-full h-full absolute inset-0 rounded-lg"
              size="large"
              style={{ display: cover ? 'none' : 'flex' }}
            />
          </div>
        </div>

        {/* Content - Centered on mobile, left-aligned on desktop */}
        <div className="flex-1 flex flex-col justify-between text-center md:text-left md:py-2">
          {/* Category badges */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3 md:mb-2">
            {categories.length > 0 && categories.map(cat => (
              <Badge variant="outline" key={cat} className="text-xs">
                <Tag className="inline h-3 w-3 mr-1" />
                {cat}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 md:mb-1 leading-tight">
            {title}
          </h1>
          
          <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mb-3 md:mb-4 mt-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm md:text-base text-gray-700">{publisher}</span>
          </div>
          
          <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-muted-foreground mb-4 md:mb-3">
            <Calendar className="h-4 w-4" />
            <span>Desde {year}</span>
          </div>
          
          {/* Play Button - Full width on mobile */}
          <div className="mt-2 w-full md:w-auto">
            <Button 
              data-testid="play-last-episode" 
              className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow transition" 
              onClick={onPlayLatest} 
              aria-label="Ouça o episódio"
            >
              <Play className="h-5 w-5 mr-2" />
              Ouça o episódio
            </Button>
          </div>

          {/* Share Card - Moved below play button on mobile */}
          <div className="mt-4 w-full md:hidden">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 text-center">
                    Compartilhar
                  </h3>
                  <ShareButtons
                    shareUrl={shareUrl}
                    shareTitle={shareTitle}
                    shareDescription={shareDescription}
                    layout="horizontal"
                    iconSize={32}
                    showCopyButton={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Share Card - Desktop only sidebar */}
        <div className="hidden md:block w-auto flex-shrink-0">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 text-center md:text-left">
                  Compartilhar
                </h3>
                <ShareButtons
                  shareUrl={shareUrl}
                  shareTitle={shareTitle}
                  shareDescription={shareDescription}
                  layout="horizontal"
                  iconSize={32}
                  showCopyButton={true}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 md:mt-7">
        <Card>
          <CardContent className="p-4 md:p-6">
            <h2 className="font-semibold text-lg md:text-xl mb-3 md:mb-2 text-center md:text-left">
              Sobre o Podcast
            </h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PodcastDetailHero;
