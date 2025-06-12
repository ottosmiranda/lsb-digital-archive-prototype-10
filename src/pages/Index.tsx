
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import FeaturedHighlights from '@/components/FeaturedHighlights';
import QuickAccess from '@/components/QuickAccess';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <FeaturedHighlights />
      <QuickAccess />
      <Footer />
    </div>
  );
};

export default Index;
