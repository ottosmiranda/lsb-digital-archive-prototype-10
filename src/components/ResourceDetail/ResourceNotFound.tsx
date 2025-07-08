
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ResourceNotFound = () => (
  <div className="min-h-screen bg-white">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Recurso não encontrado</h1>
        <Link to="/buscar">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar à busca
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

export default ResourceNotFound;
