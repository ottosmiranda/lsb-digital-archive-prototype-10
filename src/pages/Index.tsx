
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import QuickAccess from "@/components/QuickAccess";
import FeaturedHighlights from "@/components/FeaturedHighlights";
import MostAccessed from "@/components/MostAccessed";
import RecentAdditions from "@/components/RecentAdditions";
import FeaturedMedia from "@/components/FeaturedMedia";
import FeaturedCollections from "@/components/FeaturedCollections";
import ExternalResources from "@/components/ExternalResources";
import Footer from "@/components/Footer";
import EndpointTester from "@/components/EndpointTester";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle auth state changes if needed
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      
      {/* Componente temporário para testes */}
      <div className="container mx-auto px-4 py-8">
        <EndpointTester />
      </div>
      
      <div className="container mx-auto px-4 space-y-16 pb-16">
        <QuickAccess />
        <FeaturedHighlights />
        <MostAccessed />
        <RecentAdditions />
        <FeaturedMedia />
        <FeaturedCollections />
        <ExternalResources />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
