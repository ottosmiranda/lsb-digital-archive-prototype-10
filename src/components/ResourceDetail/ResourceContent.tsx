
import { Badge } from "@/components/ui/badge";
import { Play, BookOpen, Headphones } from "lucide-react";
import { getTypeLabel, getTypeBadgeColor } from "@/utils/resourceUtils";
import { Resource } from "@/types/resourceTypes";

const ResourceContent = ({ resource }: { resource: Resource }) => {
  // Lógica para decidir se deve mostrar a descrição completa
  const shouldShowFullDescription = resource.fullDescription && 
    resource.fullDescription !== resource.description &&
    resource.fullDescription.length > resource.description.length + 50;

  return (
    <div className="space-y-4 mb-16 lg:mb-[120px]">
      <div>
        <Badge className={`${getTypeBadgeColor(resource.type)} mb-2`}>
          {resource.type === 'video' && <Play className="h-3 w-3 mr-1" />}
          {resource.type === 'titulo' && <BookOpen className="h-3 w-3 mr-1" />}
          {resource.type === 'podcast' && <Headphones className="h-3 w-3 mr-1" />}
          {getTypeLabel(resource.type)}
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
        <p className="text-lg text-gray-600">{resource.description}</p>
      </div>

      {shouldShowFullDescription && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Descrição Completa</h2>
          <p className="text-gray-700 leading-relaxed">{resource.fullDescription}</p>
        </div>
      )}

      {resource.type === 'titulo' && resource.tableOfContents && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Sumário</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {resource.tableOfContents.map((chapter, index) => (
              <li key={index}>{chapter}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResourceContent;
