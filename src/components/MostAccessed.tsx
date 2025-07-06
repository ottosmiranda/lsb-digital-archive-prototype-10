import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useHomepageContent } from '@/hooks/useHomepageContent';
import { useNavigate } from 'react-router-dom';
import { useTopItems } from './MostAccessed/useTopItems';
import MostAccessedTableRow from './MostAccessed/MostAccessedTableRow';
import MostAccessedSkeleton from '@/components/skeletons/MostAccessedSkeleton';

const MostAccessed = () => {
  const { content, loading } = useHomepageContent();
  const navigate = useNavigate();
  const allData = [...content.videos, ...content.books, ...content.podcasts];
  const topItems = useTopItems(allData);

  const handleItemClick = (id: number) => {
    navigate(`/recurso/${id}`);
  };

  if (loading) {
    return <MostAccessedSkeleton />;
  }

  if (topItems.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-lsb-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
              Mais Acessados
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Os conteúdos mais populares da nossa biblioteca digital
            </p>
          </div>
          <div className="text-center my-12 text-lg text-gray-400">
            Nenhum conteúdo encontrado.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-lsb-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold lsb-primary mb-4">
            Mais Acessados
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Os conteúdos mais populares da nossa biblioteca digital
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden animate-slide-up">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Tipo</TableHead>
                <TableHead className="hidden lg:table-cell">Autor</TableHead>
                <TableHead className="text-right">Visualizações</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.map((item) => (
                <MostAccessedTableRow
                  key={`${item.id}-${item.type}`}
                  item={item}
                  onItemClick={handleItemClick}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default MostAccessed;
