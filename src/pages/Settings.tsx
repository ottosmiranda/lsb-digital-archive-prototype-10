
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SpotifyConfig from "@/components/SpotifyConfig";
import { Settings as SettingsIcon } from "lucide-react";

const Settings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon className="h-8 w-8 text-lsb-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">
            Configure as integrações e preferências da plataforma.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Integração com Spotify
            </h2>
            <SpotifyConfig />
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
