import { useState, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MoreVertical, Download, FileSpreadsheet, FileJson } from 'lucide-react';
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
} from '@/components/ui/dropdown-menu';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

// Type definitions
export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  hidden?: boolean; // For columns that should export but not display
  exportValue?: (item: T) => string | number; // Custom export formatting
}

export interface StatCard {
  label: string;
  getValue: (data: any[]) => number | string;
  description?: string;
}

export interface ActionItem<T> {
  label: string | ((item: T) => string);
  icon?: ReactNode | ((item: T) => ReactNode);
  onClick: (item: T) => void;
  visible?: (item: T) => boolean;
  variant?: 'default' | 'destructive';
  separator?: boolean;
}

// Built-in export configuration
export interface ExportConfig {
  enableCSV?: boolean;
  enableJSON?: boolean;
  enableExcel?: boolean;
  filename?: string;
  excludeColumns?: string[]; // Columns to exclude from export
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
  columns: ColumnConfig<T>[];
  stats?: StatCard[];
  actions?: ActionItem<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  customFilters?: (data: T[], searchQuery: string) => T[];
  onDataLoad?: (data: T[]) => void;
  
  // Built-in export configuration
  export?: ExportConfig;
}

interface DataTablePageProps<T> {
  config: DataTableConfig<T>;
}


const exportToCSV = <T,>(data: T[], columns: ColumnConfig<T>[], filename: string) => {
  // Filter out hidden columns unless they have exportValue
  const exportColumns = columns.filter(col => 
    !col.hidden || col.exportValue
  );
  
  // Create CSV header
  const headers = exportColumns.map(col => col.label).join(',');
  
  // Create CSV rows
  const rows = data.map(item => {
    return exportColumns.map(col => {
      let value: any;
      
      // Use custom export value if provided
      if (col.exportValue) {
        value = col.exportValue(item);
      } else {
        // Get nested value
        value = col.key.split('.').reduce((obj: any, key) => obj?.[key], item);
      }
      
      // Format value for CSV
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma
      return stringValue.includes(',') || stringValue.includes('"') 
        ? `"${stringValue.replace(/"/g, '""')}"` 
        : stringValue;
    }).join(',');
  }).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
};

const exportToJSON = <T,>(data: T[], filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function DataTablePage<T extends Record<string, any> & {
  id: string | number;
}>({ config }: DataTablePageProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [filteredData, setFilteredData] = useState<T[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredData(data);
    } else {
      if (config.customFilters) {
        const filtered = config.customFilters(data, searchQuery);
        setFilteredData(filtered);
      } else {
        const query = searchQuery.toLowerCase();
        const searchKeys = config.searchKeys || config.columns
          .filter(col => col.searchable !== false)
          .map(col => col.key);
        
        const filtered = data.filter((item: any) =>
          searchKeys.some(key => {
            const value = key.split('.').reduce((obj, k) => obj?.[k], item);
            if (value === null || value === undefined) return false;
            return String(value).toLowerCase().includes(query);
          })
        );
        setFilteredData(filtered);
      }
    }
  }, [searchQuery, data, config]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get(config.apiEndpoint);
      const dataList = Array.isArray(response) ? response : (response?.data || []);
      setData(dataList);
      setFilteredData(dataList);
      
      if (config.onDataLoad) {
        config.onDataLoad(dataList);
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
    }
  };

  const renderCellContent = (item: T, column: ColumnConfig<T>) => {
    if (column.render) {
      return column.render(item);
    }
    const value = column.key.split('.').reduce((obj: any, key) => obj?.[key], item);
    return value !== null && value !== undefined ? String(value) : '-';
  };

  const renderHeaderActions = () => {
    if (!config.headerActions) return null;
    
    if (typeof config.headerActions === 'function') {
      return config.headerActions(data);
    }
    
    return config.headerActions;
  };

  // Built-in export handlers
  const handleExport = (type: 'csv' | 'json') => {
    const filename = config.export?.filename || 
      `${config.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`;
    
    if (type === 'csv') {
      exportToCSV(filteredData, config.columns, filename);
      toast.success('CSV exported successfully');
    } else if (type === 'json') {
      exportToJSON(filteredData, filename);
      toast.success('JSON exported successfully');
    }
  };

  // Render built-in export buttons
  const renderBuiltInExports = () => {
    if (!config.export) return null;

    const { enableCSV = true, enableJSON = false, enableExcel = false } = config.export;
    const hasExports = enableCSV || enableJSON || enableExcel;

    if (!hasExports) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Data</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {enableCSV && (
            <DropdownMenuItem onClick={() => handleExport('csv')}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
          )}
          {enableJSON && (
            <DropdownMenuItem onClick={() => handleExport('json')}>
              <FileJson className="h-4 w-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{config.title}</h1>
          <p className="text-muted-foreground mt-1">{config.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Built-in exports (CSV, JSON) */}
          {renderBuiltInExports()}
          
          {/* Custom header actions (PDF, XML) */}
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
          {config.stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.getValue(data)}</CardTitle>
                {stat.description && (
                  <CardDescription className="text-xs mt-1">{stat.description}</CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{config.title} List</CardTitle>
              <CardDescription>
                View and manage all {config.title.toLowerCase()}
              </CardDescription>
            </div>
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
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.columns
                      .filter(col => !col.hidden)
                      .map((column) => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    {config.actions && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      {config.columns
                        .filter(col => !col.hidden)
                        .map((column) => (
                          <TableCell key={column.key}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}