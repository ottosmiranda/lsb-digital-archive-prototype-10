
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import FeaturedHighlights from '@/components/FeaturedHighlights';
import QuickAccess from '@/components/QuickAccess';
import FeaturedMedia from '@/components/FeaturedMedia';
import RecentAdditions from '@/components/RecentAdditions';
import MostAccessed from '@/components/MostAccessed';
import ExternalResources from '@/components/ExternalResources';
import Footer from '@/components/Footer';
import HomepageErrorState from '@/components/HomepageErrorState';
import { useHomepageContent } from '@/hooks/useHomepageContent';

const Index = () => {
  const { error, retry, isUsingFallback } = useHomepageContent();

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      
      {/* Show error state if there are issues with the API */}
      <HomepageErrorState 
        error={error} 
        onRetry={retry} 
        isUsingFallback={isUsingFallback} 
      />
      
      <FeaturedHighlights />
      <QuickAccess />
      <FeaturedMedia />
      <RecentAdditions />
      <MostAccessed />
      <ExternalResources />
      <Footer />
    </div>
  );
};

export default Index;
