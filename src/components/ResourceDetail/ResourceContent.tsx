
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, BookOpen, Headphones } from "lucide-react";
import { getTypeLabel, getTypeBadgeColor } from "@/utils/resourceUtils";
import { Resource } from "@/types/resourceTypes";

const ResourceContent = ({ resource }: { resource: Resource }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Lógica para decidir se deve mostrar a descrição completa
  const shouldShowFullDescription = resource.fullDescription && 
    resource.fullDescription !== resource.description &&
    resource.fullDescription.length > resource.description.length + 50;

  // Lógica para truncagem da descrição principal
  const shouldTruncateDescription = resource.description.length > 500;
  const truncatedDescription = shouldTruncateDescription 
    ? resource.description.substring(0, 500) 
    : resource.description;
  
  const displayedDescription = shouldTruncateDescription && !isDescriptionExpanded 
    ? truncatedDescription 
    : resource.description;

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  return (
    <div className="space-y-4 mb-12 lg:mb-[80px]">
      <div>
        <Badge className={`${getTypeBadgeColor(resource.type)} mb-2`}>
          {resource.type === 'video' && <Play className="h-3 w-3 mr-1" />}
          {resource.type === 'titulo' && <BookOpen className="h-3 w-3 mr-1" />}
          {resource.type === 'podcast' && <Headphones className="h-3 w-3 mr-1" />}
          {getTypeLabel(resource.type)}
        </Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{resource.title}</h1>
        <div className="text-lg text-gray-600">
          {displayedDescription}
          {shouldTruncateDescription && (
            <Button
              variant="link"
              onClick={toggleDescription}
              className="p-0 h-auto text-sm text-blue-600 hover:text-blue-800 ml-1"
            >
              {isDescriptionExpanded ? "Ver menos" : "Ver mais"}
            </Button>
          )}
        </div>
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
