
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Calendar, BookOpen, Clock, Headphones, FileText, Tag } from "lucide-react";
import { Resource } from "@/types/resourceTypes";

const ResourceInfo = ({ resource }: { resource: Resource }) => (
  <Card>
    <CardContent className="p-4">
      <h3 className="font-semibold mb-3">Informações do Recurso</h3>
      <div className="space-y-2 text-sm">
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-gray-600">Autor:</span>
          <span className="ml-1 font-medium">{resource.author}</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-gray-600">Ano:</span>
          <span className="ml-1 font-medium">{resource.year}</span>
        </div>
        
        {/* Categories - Multiple badges */}
        {resource.categories && resource.categories.length > 0 && (
          <div className="flex items-start">
            <Tag className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <span className="text-gray-600">Categorias:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {resource.categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Fallback to single subject if no categories */}
        {(!resource.categories || resource.categories.length === 0) && (
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Assunto:</span>
            <span className="ml-1 font-medium">{resource.subject}</span>
          </div>
        )}
        
        {resource.type === 'video' && resource.duration && (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-600">Duração:</span>
            <span className="ml-1 font-medium">{resource.duration}</span>
          </div>
        )}
        {resource.type === 'titulo' && (
          <>
            {/* Document Type */}
            {resource.documentType && (
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-1 font-medium">{resource.documentType}</span>
              </div>
            )}
            {resource.pages && (
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Páginas:</span>
                <span className="ml-1 font-medium">{resource.pages}</span>
              </div>
            )}
            {resource.isbn && (
              <div className="flex items-center">
                <span className="text-gray-600">ISBN:</span>
                <span className="ml-1 font-medium">{resource.isbn}</span>
              </div>
            )}
            {resource.publisher && (
              <div className="flex items-center">
                <span className="text-gray-600">Editora:</span>
                <span className="ml-1 font-medium">{resource.publisher}</span>
              </div>
            )}
            {resource.edition && (
              <div className="flex items-center">
                <span className="text-gray-600">Edição:</span>
                <span className="ml-1 font-medium">{resource.edition}</span>
              </div>
            )}
          </>
        )}
        {resource.type === 'podcast' && (
          <>
            {resource.episodes && (
              <div className="flex items-center">
                <Headphones className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Episódios:</span>
                <span className="ml-1 font-medium">{resource.episodes}</span>
              </div>
            )}
            {resource.transcript && (
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-600">Transcrição:</span>
                <span className="ml-1 font-medium">Disponível</span>
              </div>
            )}
          </>
        )}
        {resource.language && (
          <div className="flex items-center">
            <span className="text-gray-600">Idioma:</span>
            <span className="ml-1 font-medium">{resource.language}</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default ResourceInfo;
