
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import FeaturedHighlights from '@/components/FeaturedHighlights';
import MostAccessed from '@/components/MostAccessed';
import FeaturedMedia from '@/components/FeaturedMedia';
import RecentAdditions from '@/components/RecentAdditions';
import QuickAccess from '@/components/QuickAccess';
import ExternalResources from '@/components/ExternalResources';
import Footer from '@/components/Footer';
import HomepageErrorState from '@/components/HomepageErrorState';
import { HomepageContentProvider, useHomepageContentContext } from '@/contexts/HomepageContentContext';

const IndexContent = () => {
  const { error, retry, isUsingFallback } = useHomepageContentContext();

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
      
      {/* Nova ordem das seções conforme solicitado */}
      <FeaturedHighlights />
      <MostAccessed />
      <FeaturedMedia />
      <RecentAdditions />
      <QuickAccess />
      <ExternalResources />
      <Footer />
    </div>
  );
};

const Index = () => {
  return (
    <HomepageContentProvider>
      <IndexContent />
    </HomepageContentProvider>
  );
};

export default Index;
