
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DataRefreshButtonProps {
  onRefresh: () => Promise<void>;
  loading: boolean;
  usingFallback: boolean;
}

const DataRefreshButton = ({ onRefresh, loading, usingFallback }: DataRefreshButtonProps) => {
  const { toast } = useToast();

  const handleRefresh = async () => {
    try {
      await onRefresh();
      toast({
        title: "Dados atualizados",
        description: "Os dados foram recarregados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível recarregar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!usingFallback) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex-1">
        <p className="text-sm text-yellow-800">
          Os dados podem não estar atualizados. Clique para recarregar.
        </p>
      </div>
      <Button
        onClick={handleRefresh}
        disabled={loading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Recarregando...' : 'Atualizar'}
      </Button>
    </div>
  );
};

export default DataRefreshButton;
