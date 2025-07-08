
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, Database } from "lucide-react";

interface LoadingSearchStateProps {
  resourceId: string;
}

const LoadingSearchState = ({ resourceId }: LoadingSearchStateProps) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mx-auto max-w-lg">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Database className="h-12 w-12 text-gray-300" />
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin absolute -top-1 -right-1" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Buscando recurso
            </h2>
            
            <p className="text-gray-600 mb-4">
              Procurando o recurso com ID{' '}
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                {resourceId}
              </span>
            </p>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Search className="h-4 w-4" />
              <span>Consultando base de dados...</span>
            </div>
            
            <div className="mt-6 text-xs text-gray-400">
              Esta busca pode levar alguns segundos
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingSearchState;
