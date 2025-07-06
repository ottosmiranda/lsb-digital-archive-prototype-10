
import { Book, Video, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useHomepageContentContext } from '@/contexts/HomepageContentContext';
import { useMemo } from 'react';
import QuickAccessSkeleton from '@/components/skeletons/QuickAccessSkeleton';

const QuickAccess = () => {
  const { contentCounts, countsLoading, loading } = useHomepageContentContext();

  // Calculate display counts with enhanced formatting and timeout protection
  const counts = useMemo(() => {
    console.log('📊 QuickAccess - Processing content counts:', contentCounts);
    
    const formatCount = (count: number): string => {
      // Show loading only for first 10 seconds, then show estimated values
      if (countsLoading && count === 0) return '...';
      if (count === 0) return '0'; // Changed from '...' to '0' when not loading
      if (count < 1000) return count.toString();
      if (count < 10000) return `${(count / 1000).toFixed(1)}k`.replace('.0k', 'k');
      return `${Math.floor(count / 1000)}k+`;
    };

    const result = {
      videos: formatCount(contentCounts.videos),
      books: formatCount(contentCounts.books),
      podcasts: formatCount(contentCounts.podcasts)
    };

    console.log('✅ QuickAccess - Formatted counts:', result);
    return result;
  }, [contentCounts, countsLoading]);

  const accessTypes = [
    {
      icon: Book,
      label: 'Livros',
      href: '/buscar?filtros=titulo',
      color: 'from-blue-500 to-blue-600',
      count: counts.books,
      realCount: contentCounts.books
    },
    {
      icon: Video,
      label: 'Vídeos',
      href: '/buscar?filtros=video',
      color: 'from-red-500 to-red-600',
      count: counts.videos,
      realCount: contentCounts.videos
    },
    {
      icon: Headphones,
      label: 'Podcasts',
      href: '/buscar?filtros=podcast',
      color: 'from-purple-500 to-purple-600',
      count: counts.podcasts,
      realCount: contentCounts.podcasts
    }
  ];

  if (loading) {
    return <QuickAccessSkeleton />;
  }

  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Acesso Rápido por Tipo de Material
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encontre rapidamente o tipo de conteúdo que você procura
          </p>
        </div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {accessTypes.map((type, index) => {
            const IconComponent = type.icon;
            const isCountLoading = countsLoading && type.realCount === 0;
            
            return (
              <Link
                key={type.label}
                to={type.href}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-center">
                  {/* Icon Circle */}
                  <div className={`relative mx-auto w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${type.color} rounded-full flex items-center justify-center mb-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}>
                    <IconComponent className="h-10 w-10 md:h-12 md:w-12 text-white" />
                    
                    {/* Floating Badge with Real Count */}
                    <div className="absolute -top-2 -right-2 bg-lsb-accent text-lsb-primary text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      {type.count}
                    </div>
                  </div>

                  {/* Label */}
                  <h3 className="text-lg md:text-xl font-semibold lsb-primary transition-colors duration-300">
                    {type.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isCountLoading 
                      ? 'Carregando...' 
                      : type.realCount === 0
                        ? 'Nenhum item'
                        : type.realCount === 1 
                          ? '1 item' 
                          : `${type.realCount.toLocaleString()} itens`
                    }
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12 animate-slide-up">
          <p className="text-gray-600">
            Todos os materiais estão disponíveis gratuitamente para estudantes e pesquisadores
          </p>
        </div>
      </div>
    </section>
  );
};

export default QuickAccess;
