
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import FeaturedHighlights from '@/components/FeaturedHighlights';
import QuickAccess from '@/components/QuickAccess';
import FeaturedMedia from '@/components/FeaturedMedia';
import RecentAdditions from '@/components/RecentAdditions';
import MostAccessed from '@/components/MostAccessed';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <FeaturedHighlights />
      <QuickAccess />
      <FeaturedMedia />
      <RecentAdditions />
      <MostAccessed />
      <Footer />
    </div>
  );
};

export default Index;
