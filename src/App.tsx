
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ElfsightAccessibilityWidget from "@/components/ElfsightAccessibilityWidget";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import ResourceDetail from "./pages/ResourceDetail";
import Midia from "./pages/Midia";
import Sobre from "./pages/Sobre";
import Regulamento from "./pages/Regulamento";
import Equipe from "./pages/Equipe";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/buscar" element={<SearchResults />} />
          <Route path="/recurso/:id" element={<ResourceDetail />} />
          <Route path="/midia" element={<Midia />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/regulamento" element={<Regulamento />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth" element={<Auth />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Elfsight Accessibility Widget - Global implementation */}
      <ElfsightAccessibilityWidget />
    </AuthProvider>
  </TooltipProvider>
);

export default App;
