import { Search, Filter, Book, Play, Headphones, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
interface SearchWelcomeStateProps {
  onQuickSearch: (query: string) => void;
}
const SearchWelcomeState = ({
  onQuickSearch
}: SearchWelcomeStateProps) => {
  const navigate = useNavigate();
  const popularTopics = ['Educação', 'Cultura Surda', 'Inclusão', 'Tecnologia', 'Literatura', 'História', 'Comunicação', 'Direitos'];
  const contentTypes = [{
    icon: <Play className="h-8 w-8" />,
    title: 'Vídeos',
    description: 'Aulas, palestras e documentários em Libras',
    color: 'bg-red-50 border-red-200'
  }, {
    icon: <Book className="h-8 w-8" />,
    title: 'Livros e Artigos',
    description: 'Literatura, pesquisas e materiais didáticos',
    color: 'bg-blue-50 border-blue-200'
  }, {
    icon: <Headphones className="h-8 w-8" />,
    title: 'Podcasts',
    description: 'Conversas e discussões sobre diversos temas',
    color: 'bg-purple-50 border-purple-200'
  }];
  const handleTopicClick = (topic: string) => {
    onQuickSearch(topic);
  };
  return <div className="text-center py-12 max-w-4xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-12">
        <div className="w-20 h-20 mx-auto mb-6 bg-lsb-accent rounded-full flex items-center justify-center">
          <Search className="h-10 w-10 text-lsb-primary" />
        </div>
        
        <h1 className="text-3xl font-bold lsb-primary mb-4">
          Bem-vindo à Biblioteca Digital
        </h1>
        
        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">Explore nossa coleção de recursos educacionais. Use a busca para encontrar exatamente o que você precisa ou navegue pelos nossos tópicos populares.</p>
      </div>

      {/* Content Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {contentTypes.map((type, index) => <Card key={index} className={`${type.color} border-2 hover-lift`}>
            <CardContent className="p-6 text-center">
              <div className="text-lsb-primary mb-4 flex justify-center">
                {type.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2 lsb-primary">
                {type.title}
              </h3>
              <p className="text-sm text-gray-600">
                {type.description}
              </p>
            </CardContent>
          </Card>)}
      </div>

      {/* Search Tips */}
      <div className="bg-lsb-section rounded-lg p-8 mb-12 text-left">
        <div className="flex items-center mb-4">
          <Sparkles className="h-5 w-5 text-lsb-primary mr-2" />
          <h3 className="font-semibold text-lg lsb-primary">Como usar a busca</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 lsb-primary">Dicas de busca:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use palavras-chave específicas</li>
              <li>• Combine termos com espaços</li>
              <li>• Experimente sinônimos</li>
              <li>• Use aspas para frases exatas</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 lsb-primary flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              Use os filtros para:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Filtrar por tipo de conteúdo</li>
              <li>• Escolher assuntos específicos</li>
              <li>• Buscar por autor</li>
              <li>• Filtrar por ano de publicação</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-6">
          <TrendingUp className="h-5 w-5 text-lsb-primary mr-2" />
          <h3 className="font-semibold text-lg lsb-primary">Tópicos Populares</h3>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {popularTopics.map((topic, index) => <Button key={index} variant="outline" onClick={() => handleTopicClick(topic)} className="border-lsb-primary text-lsb-primary hover:bg-lsb-primary hover:text-white transition-colors">
              {topic}
            </Button>)}
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Clique em qualquer tópico para começar a explorar
        </p>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-lsb-primary/10 to-lsb-accent/30 rounded-lg p-6">
        <h4 className="font-semibold text-lg lsb-primary mb-2">
          Pronto para começar?
        </h4>
        <p className="text-gray-600 mb-4">
          Digite sua busca na caixa acima ou use os filtros para explorar nossa coleção
        </p>
        <Button onClick={() => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        searchInput?.focus();
      }} className="bg-lsb-primary hover:bg-lsb-primary/90 text-white">
          <Search className="h-4 w-4 mr-2" />
          Começar Busca
        </Button>
      </div>
    </div>;
};
export default SearchWelcomeState;