import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown,
  Download, RefreshCw, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { Pagination, usePagination } from '@/components/common/Pagination';

//  TYPE DEFINITIONS 

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  hidden?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface StatCard {
  label: string;
  getValue: (data: any[]) => number | string;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export interface ActionItem<T> {
  label: string | ((item: T) => string);
  icon?: ReactNode | ((item: T) => ReactNode);
  onClick: (item: T) => void | Promise<void>;
  visible?: (item: T) => boolean;
  variant?: 'default' | 'destructive';
  separator?: boolean;
  disabled?: (item: T) => boolean;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange';
  options?: { label: string; value: any }[];
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface DataTableConfig<T> {
  title: string;
  description: string;
  emptyStateMessage?: string;
  headerActions?: ReactNode | ((data: T[]) => ReactNode);
  apiEndpoint: string;
  addButton?: {
    label: string;
    link: string;
    icon?: ReactNode;
  };
  enableRowSelection?: boolean;
  columns: ColumnConfig<T>[];
  stats?: StatCard[];
  actions?: ActionItem<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  customFilters?: (data: T[], searchQuery: string, filters: Record<string, any>) => T[];
  filters?: FilterConfig[];
  onDataLoad?: (data: T[]) => void;
  enableExport?: boolean;
  exportFormatter?: (data: T[]) => Record<string, any>[];
  enableColumnVisibility?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: SortConfig;
  refreshInterval?: number;
  bulkActions?: {
    label: string;
    icon: ReactNode;
    onClick: (items: T[]) => Promise<void> | void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    separator?: boolean;
    disabled?: (items: T[]) => boolean;
  }[];
}

interface DataTablePageProps<T> {
  config: DataTableConfig<T>;
}

//  SKELETON COMPONENTS 

const TableSkeleton = ({ 
  columns, 
  rows = 5,
  hasActions = false 
}: { 
  columns: ColumnConfig<any>[]; 
  rows?: number;
  hasActions?: boolean;
}) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                style={{ width: column.width }}
                className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
              >
                {column.label}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell 
                  key={column.key}
                  className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                >
                  <Skeleton className="h-5 w-full max-w-[200px]" />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell className="text-right">
                  <Skeleton className="h-8 w-8 rounded ml-auto" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

const StatCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-9 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </CardHeader>
  </Card>
);

//  MAIN COMPONENT 

export function DataTable<T extends Record<string, any> & {
  id: string | number;
}>({ config }: DataTablePageProps<T>) {
  // State management
  const [data, setData] = useState<T[]>([]);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    config.defaultSort || { key: '', direction: null }
  );
  const [activeFilters, _setActiveFilters] = useState<Record<string, any>>({});
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(config.columns.filter(col => !col.hidden).map(col => col.key))
  );

  // Pagination
  const {
    pagination,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    resetPagination,
  } = usePagination(
    filteredData.length,
    config.defaultPageSize || 10
  );

  //  DATA FETCHING 

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await apiService.get(config.apiEndpoint);
      const dataList = Array.isArray(response) ? response : (response?.data || []);
      
      setData(dataList);
      setFilteredData(dataList);
      resetPagination();

      if (config.onDataLoad) {
        config.onDataLoad(dataList);
      }

      if (isRefresh) {
        toast.success('Data refreshed successfully');
      }
    } catch (error: any) {
      console.error(`Failed to fetch data from ${config.apiEndpoint}:`, error);
      toast.error(`Failed to load ${config.title.toLowerCase()}`, {
        description: error?.message || 'Please try again later.',
      });
      setData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (config.refreshInterval) {
      const interval = setInterval(() => {
        fetchData(true);
      }, config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [config.refreshInterval]);

  //  SEARCH & FILTER 

  useEffect(() => {
    let result = [...data];

    // Apply search
    if (searchQuery.trim() !== '') {
      if (config.customFilters) {
        result = config.customFilters(result, searchQuery, activeFilters);
      } else {
        const query = searchQuery.toLowerCase();
        const searchKeys = config.searchKeys || config.columns
          .filter(col => col.searchable !== false)
          .map(col => col.key);

        result = result.filter((item: any) =>
          searchKeys.some(key => {
            const value = getNestedValue(item, key);
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(query);
          })
        );
      }
    }

    // Apply active filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        result = result.filter(item => {
          const itemValue = getNestedValue(item, key);
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortConfig.key);
        const bValue = getNestedValue(b, sortConfig.key);

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredData(result);
    resetPagination();
  }, [searchQuery, data, sortConfig, activeFilters]);

  //  HELPER FUNCTIONS 

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        const nextDirection = 
          prev.direction === 'asc' ? 'desc' : 
          prev.direction === 'desc' ? null : 'asc';
        return { key: nextDirection ? key : '', direction: nextDirection };
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  //  EXPORT 

  const exportToCSV = () => {
    let exportData;
    let headers: any[] = [];
    
    if (config.exportFormatter) {
      // Use custom formatter if provided
      const formattedData = config.exportFormatter(filteredData);
      if (formattedData.length > 0) {
        headers = Object.keys(formattedData[0]);
        exportData = formattedData.map(item => 
          headers.map(header => {
            const value = item[header] ?? '';
            return `"${String(value).replace(/"/g, '""')}"`; // Escape quotes in CSV
          }).join(',')
        );
      }
    } else {
      // Fall back to default behavior
      const exportColumns = config.columns.filter(col => 
        col.exportable !== false && visibleColumns.has(col.key)
      );
      
      headers = exportColumns.map(col => col.label);
      exportData = filteredData.map(item => 
        exportColumns.map(col => {
          const value = col.render ? 
            String(col.render(item)).replace(/"/g, '""') : // Escape quotes
            String(getNestedValue(item, col.key) || '');
          return `"${value}"`; // Wrap in quotes
        }).join(',')
      );
    }

    if (!exportData || exportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), // Escape header quotes
      ...exportData
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  //  RENDERING 

  const renderCellContent = (item: T, column: ColumnConfig<T>) => {
    if (column.render) {
      return column.render(item);
    }
    const value = getNestedValue(item, column.key);
    return value !== null && value !== undefined ? String(value) : '-';
  };

  const renderHeaderActions = () => {
    if (!config.headerActions) return null;
    if (typeof config.headerActions === 'function') {
      return config.headerActions(data);
    }
    return config.headerActions;
  };

  const paginatedData = getPaginatedData(filteredData);
  const visibleColumnsList = config.columns.filter(col => visibleColumns.has(col.key));

  //  RENDER 

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground mt-1">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* Export Button */}
          {config.enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={filteredData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}

          {/* Header Actions */}
          {renderHeaderActions()}

          {/* Add Button */}
          {config.addButton && (
            <Link to={config.addButton.link}>
              <Button className="gap-2">
                {config.addButton.icon || <Plus size={18} />}
                {config.addButton.label}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {config.stats && config.stats.length > 0 && (
        <div className={`grid gap-4 md:grid-cols-${Math.min(config.stats.length, 4)}`}>
          {isLoading ? (
            // Skeleton for stats
            Array.from({ length: config.stats.length }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          ) : (
            config.stats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardDescription>{stat.label}</CardDescription>
                  <CardTitle className="text-3xl">{stat.getValue(data)}</CardTitle>
                  {stat.description && (
                    <CardDescription className="text-xs mt-1">
                      {stat.description}
                    </CardDescription>
                  )}
                  {stat.trend && (
                    <Badge variant={stat.trend.isPositive ? "default" : "destructive"} className="mt-2 w-fit">
                      {stat.trend.value}
                    </Badge>
                  )}
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{config.title} List</CardTitle>
              <CardDescription>
                View and manage all {config.title.toLowerCase()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* Column Visibility */}
              {config.enableColumnVisibility && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {config.columns.map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.key}
                        checked={visibleColumns.has(column.key)}
                        onCheckedChange={(checked) => {
                          setVisibleColumns(prev => {
                            const newSet = new Set(prev);
                            if (checked) {
                              newSet.add(column.key);
                            } else {
                              newSet.delete(column.key);
                            }
                            return newSet;
                          });
                        }}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={config.searchPlaceholder || 'Search...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Skeleton loading state
            <TableSkeleton 
              columns={visibleColumnsList}
              rows={config.defaultPageSize || 10}
              hasActions={!!config.actions}
            />
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="h-12 w-12 text-muted-foreground mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No data found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : config.emptyStateMessage || 'Get started by adding your first item'}
              </p>
              {!searchQuery && config.addButton && (
                <Link to={config.addButton.link}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {config.addButton.label}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {visibleColumnsList.map((column) => (
                        <TableHead 
                          key={column.key}
                          style={{ width: column.width }}
                          className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                        >
                          {column.sortable !== false ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="-ml-3 h-8"
                              onClick={() => handleSort(column.key)}
                            >
                              {column.label}
                              {getSortIcon(column.key)}
                            </Button>
                          ) : (
                            column.label
                          )}
                        </TableHead>
                      ))}
                      {config.actions && (
                        <TableHead className="text-right">Actions</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => (
                      <TableRow key={item.id}>
                        {visibleColumnsList.map((column) => (
                          <TableCell 
                            key={column.key}
                            className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}
                          >
                            {renderCellContent(item, column)}
                          </TableCell>
                        ))}
                        {config.actions && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                {config.actions && config.actions.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {config.actions
                                      .filter((action) => !action.visible || action.visible(item))
                                      .map((action, index) => (
                                        <div key={index}>
                                          {action.separator && <DropdownMenuSeparator />}
                                          <DropdownMenuItem
                                            className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive' : ''}
                                            onClick={() => action.onClick(item)}
                                            disabled={action.disabled?.(item)}
                                          >
                                            {action.icon && (
                                              <span className="mr-2">
                                                {typeof action.icon === 'function' ? action.icon(item) : action.icon}
                                              </span>
                                            )}
                                            {typeof action.label === 'function' ? action.label(item) : action.label}
                                          </DropdownMenuItem>
                                        </div>
                                      ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <Pagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={config.pageSizeOptions}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}