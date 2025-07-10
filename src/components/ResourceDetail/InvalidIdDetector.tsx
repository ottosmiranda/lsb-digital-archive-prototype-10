
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { idValidationService } from '@/services/idValidationService';
import { useToast } from '@/hooks/use-toast';

interface InvalidIdDetectorProps {
  onInvalidId?: (id: string, reason: string) => void;
}

const InvalidIdDetector = ({ onInvalidId }: InvalidIdDetectorProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;

    console.group('🔍 INVALID ID DETECTOR');
    console.log('📋 Checking ID from URL:', id);

    const validation = idValidationService.validateId(id);
    console.log('📋 Validation result:', validation);

    if (!validation.isValid) {
      console.log('❌ INVALID ID DETECTED - Taking action');
      
      // ✅ Rastrear origem do ID inválido
      idValidationService.trackInvalidIdOrigin(id, 'URL_PARAMETER', {
        route: '/recurso/:id',
        currentUrl: window.location.href,
        referrer: document.referrer
      });

      // ✅ Notificar callback se fornecido
      if (onInvalidId) {
        onInvalidId(id, validation.errorReason || 'ID inválido');
      }

      // ✅ Mostrar toast informativo
      toast({
        title: "ID de recurso inválido",
        description: `O ID "${id.substring(0, 20)}..." não corresponde a nenhum recurso válido. Redirecionando para a busca.`,
        variant: "destructive",
      });

      // ✅ Redirecionar para busca após um breve delay
      setTimeout(() => {
        navigate('/buscar', { replace: true });
      }, 2000);

      console.groupEnd();
      return;
    }

    console.log('✅ ID is valid, proceeding normally');
    console.groupEnd();
  }, [id, navigate, toast, onInvalidId]);

  // Este componente não renderiza nada, apenas detecta IDs inválidos
  return null;
};

export default InvalidIdDetector;
