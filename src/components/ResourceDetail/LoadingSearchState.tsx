
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";

interface LoadingSearchStateProps {
  searchingId?: string;
}

const LoadingSearchState = ({ searchingId }: LoadingSearchStateProps) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Search className="h-12 w-12 text-gray-300" />
                  <Loader2 className="h-6 w-6 text-lsb-primary animate-spin absolute -top-1 -right-1" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Buscando recurso...
              </h2>
              
              {searchingId && (
                <p className="text-gray-600 mb-4">
                  Procurando pelo recurso com ID{' '}
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                    {searchingId}
                  </span>
                </p>
              )}
              
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Verificando dados locais...</p>
                <p>• Consultando API...</p>
                <p>• Preparando conteúdo...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingSearchState;
