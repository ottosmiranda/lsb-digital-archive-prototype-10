
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Settings as SettingsIcon, Shield, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const navigate = useNavigate();
  const { state, actions } = useAuth();

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      navigate('/auth');
    }
  }, [state.isAuthenticated, state.isLoading, navigate]);

  const handleSignOut = async () => {
    await actions.signOut();
    navigate('/auth');
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto py-8 px-4 md:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-lsb-primary" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Configurações da Plataforma</h1>
                <p className="text-sm text-gray-500 mt-1">Administrador: {state.user?.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sair
            </Button>
          </div>
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Você está acessando as configurações da plataforma. 
              Essas configurações se aplicam ao sistema global.
            </AlertDescription>
          </Alert>
          <p className="text-gray-600">
            Configure as preferências globais da plataforma. Todo o conteúdo é fornecido pela API própria da plataforma.
          </p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurações Gerais
            </h2>
            <div className="bg-white rounded-lg border p-6">
              <p className="text-gray-600">
                A plataforma utiliza sua API própria para fornecer todo o conteúdo, 
                incluindo vídeos, podcasts, livros e artigos. Não são necessárias 
                configurações adicionais de terceiros.
              </p>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Settings;
