
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { TopAccessedItem } from './types';
import { getTypeIcon, getTypeColor, getTypeLabel, getTrendIcon } from './displayUtils';
import { formatViews } from './dataUtils';

interface MostAccessedTableRowProps {
  item: TopAccessedItem;
  onItemClick: (id: number) => void;
}

const MostAccessedTableRow = ({ item, onItemClick }: MostAccessedTableRowProps) => {
  return (
    <TableRow 
      key={`${item.id}-${item.type}`}
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => onItemClick(item.id)}
    >
      <TableCell className="font-medium">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          item.rank <= 3 ? 'bg-lsb-accent text-lsb-primary' : 'bg-gray-100 text-gray-600'
        }`}>
          {item.rank}
        </div>
      </TableCell>
      <TableCell>
        <div className="font-medium text-sm mb-1 line-clamp-1 hover:text-lsb-primary transition-colors">
          {item.title}
        </div>
        <div className="md:hidden">
          <Badge className={`${getTypeColor(item.type)} mr-2`}>
            <span className="flex items-center space-x-1">
              {getTypeIcon(item.type)}
              <span>{getTypeLabel(item.type)}</span>
            </span>
          </Badge>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge className={getTypeColor(item.type)}>
          <span className="flex items-center space-x-1">
            {getTypeIcon(item.type)}
            <span>{getTypeLabel(item.type)}</span>
          </span>
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-gray-600">
        {item.author}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end space-x-1">
          <Eye className="h-3 w-3 text-gray-400" />
          <span className="text-sm font-medium">{formatViews(item.views)}</span>
        </div>
      </TableCell>
      <TableCell>
        {getTrendIcon(item.trend)}
      </TableCell>
    </TableRow>
  );
};

export default MostAccessedTableRow;
