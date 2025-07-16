
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import MinhaBlioteca from '@/components/MinhaBlioteca';
import FeaturedHighlights from '@/components/FeaturedHighlights';
import MostAccessed from '@/components/MostAccessed';
import FeaturedMedia from '@/components/FeaturedMedia';
import RecentAdditions from '@/components/RecentAdditions';
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
      
      {/* Nova seção Minha Biblioteca */}
      <MinhaBlioteca />
      
      {/* Show error state if there are issues with the API */}
      <HomepageErrorState 
        error={error} 
        onRetry={retry} 
        isUsingFallback={isUsingFallback} 
      />
      
      {/* Seções da homepage sem o QuickAccess */}
      <FeaturedHighlights />
      <MostAccessed />
      <FeaturedMedia />
      <RecentAdditions />
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
