
export interface TopAccessedItem {
  rank: number;
  id: number;
  title: string;
  type: string;
  author: string;
  views: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ViewData {
  views: number;
  trend: 'up' | 'down' | 'stable';
}
