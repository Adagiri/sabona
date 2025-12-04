import React, { useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  IconButton,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Chip,
} from '@mui/material';
import { ViewColumn, MoreVert } from '@mui/icons-material';

export interface DataTableColumn<T = any> {
  id: string;
  label: string;
  minWidth?: number;
  render?: (row: T) => React.ReactNode;
  accessor?: keyof T | ((row: T) => any);
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  hideable?: boolean; // Can this column be hidden?
  defaultVisible?: boolean; // Is it visible by default?
}

export interface DataTableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  show?: (row: T) => boolean; // Conditional visibility
  color?: 'inherit' | 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  actions?: DataTableAction<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  rowKey: keyof T | ((row: T) => string); // Unique identifier for each row
}

function DataTable<T = any>({
  columns,
  data,
  actions = [],
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  stickyHeader = true,
  maxHeight = '70vh',
  rowKey,
}: DataTableProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = col.defaultVisible !== undefined ? col.defaultVisible : true;
    });
    return initial;
  });

  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const visibleColumnsList = columns.filter((col) => visibleColumns[col.id]);
  const hasActions = actions.length > 0;

  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey] || index);
  };

  const getCellValue = (row: T, column: DataTableColumn<T>) => {
    if (column.render) {
      return column.render(row);
    }
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      return row[column.accessor];
    }
    return null;
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Column Visibility Toggle Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Tooltip title="Toggle Columns">
          <IconButton onClick={handleColumnMenuOpen} size="small">
            <ViewColumn />
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleColumnMenuClose}
          PaperProps={{
            sx: { maxHeight: 400, width: 250 },
          }}
        >
          <MenuItem disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
            Toggle Columns
          </MenuItem>
          {columns
            .filter((col) => col.hideable !== false)
            .map((col) => (
              <MenuItem key={col.id} onClick={() => toggleColumnVisibility(col.id)}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visibleColumns[col.id]}
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                  label={col.label}
                  sx={{ width: '100%', m: 0 }}
                />
              </MenuItem>
            ))}
        </Menu>
      </Box>

      {/* Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer
          sx={{
            maxHeight: maxHeight,
            position: 'relative',
            '&::-webkit-scrollbar': {
              height: 8,
              width: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f1f1f1',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#888',
              borderRadius: 4,
              '&:hover': {
                backgroundColor: '#555',
              },
            },
          }}
        >
          <Table stickyHeader={stickyHeader}>
            <TableHead>
              <TableRow>
                {visibleColumnsList.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sx={{
                      minWidth: column.minWidth || 100,
                      fontWeight: 'bold',
                      backgroundColor: (theme) => theme.palette.secondary.main,
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {column.label}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      backgroundColor: (theme) => theme.palette.secondary.main,
                      color: 'white',
                      position: 'sticky',
                      right: 0,
                      zIndex: 2,
                      minWidth: 120,
                      boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                    }}
                  >
                    Actions
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsList.length + (hasActions ? 1 : 0)}
                    align="center"
                    sx={{ py: 10 }}
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnsList.length + (hasActions ? 1 : 0)}
                    align="center"
                    sx={{ py: 10 }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow
                    key={getRowKey(row, index)}
                    onClick={() => onRowClick?.(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: onRowClick ? '#f5f5f5' : 'inherit',
                      },
                    }}
                  >
                    {visibleColumnsList.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        {getCellValue(row, column) || 'N/A'}
                      </TableCell>
                    ))}
                    {hasActions && (
                      <TableCell
                        align="center"
                        sx={{
                          position: 'sticky',
                          right: 0,
                          backgroundColor: 'white',
                          zIndex: 1,
                          boxShadow: '-2px 0 5px rgba(0,0,0,0.1)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          {actions
                            .filter((action) => !action.show || action.show(row))
                            .map((action, actionIndex) => (
                              <Tooltip key={actionIndex} title={action.label}>
                                <IconButton
                                  size="small"
                                  onClick={() => action.onClick(row)}
                                  color={action.color || 'default'}
                                >
                                  {action.icon || <MoreVert />}
                                </IconButton>
                              </Tooltip>
                            ))}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default DataTable;
