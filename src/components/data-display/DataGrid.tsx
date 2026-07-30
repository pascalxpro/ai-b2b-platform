import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './DataGrid.module.css';

export interface Column<T> {
  key: string;
  header: string;
  width?: string | number;
  minWidth?: number;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: string;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  expandable?: boolean;
  renderExpanded?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ComponentType<any>;
  className?: string;
  stickyHeader?: boolean;
  compact?: boolean;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T, index: number) => string;
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  selectable,
  selectedKeys = new Set(),
  onSelectionChange,
  sortBy,
  sortOrder,
  onSort,
  page,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  expandable,
  renderExpanded,
  loading,
  emptyMessage = '目前沒有資料',
  emptyIcon: EmptyIcon,
  className = '',
  stickyHeader = true,
  compact,
  onRowClick,
  rowClassName,
}: DataGridProps<T>) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(new Set());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      onSelectionChange(new Set(data.map(item => item[keyField])));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectRow = (key: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newKeys = new Set(selectedKeys);
    if (checked) {
      newKeys.add(key);
    } else {
      newKeys.delete(key);
    }
    onSelectionChange(newKeys);
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    let newOrder: 'asc' | 'desc' = 'asc';
    if (sortBy === key && sortOrder === 'asc') {
      newOrder = 'desc';
    } else if (sortBy === key && sortOrder === 'desc') {
      // Typically reset to none, or keep asc/desc toggle. We'll toggle.
      newOrder = 'asc';
    }
    onSort(key, newOrder);
  };

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(internalExpanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setInternalExpanded(newExpanded);
  };

  const allSelected = data.length > 0 && selectedKeys.size === data.length;
  const someSelected = selectedKeys.size > 0 && selectedKeys.size < data.length;
  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.tableWrapper}>
        <table className={`${styles.table} ${compact ? styles.compact : ''}`}>
          <thead className={stickyHeader ? styles.stickyHeader : ''}>
            <tr>
              {selectable && (
                <th className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={allSelected}
                    ref={input => {
                      if (input) input.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {expandable && <th className={styles.expandCell}></th>}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, minWidth: col.minWidth, textAlign: col.align || 'left' }}
                  className={col.sortable ? styles.sortableHeader : ''}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={`${styles.headerContent} ${col.align === 'right' ? styles.justifyRight : col.align === 'center' ? styles.justifyCenter : ''}`}>
                    {col.header}
                    {col.sortable && (
                      <span className={styles.sortIcon}>
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                        ) : (
                          <ChevronUp size={16} className={styles.sortIconInactive} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={`skeleton-${i}`} className={styles.skeletonRow}>
                  {selectable && <td><div className={styles.skeletonBox} style={{width: 16, height: 16}} /></td>}
                  {expandable && <td><div className={styles.skeletonBox} style={{width: 16, height: 16}} /></td>}
                  {columns.map(col => (
                    <td key={`skeleton-${i}-${col.key}`}>
                      <div className={styles.skeletonBox} style={{width: '60%'}} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={(selectable ? 1 : 0) + (expandable ? 1 : 0) + columns.length} className={styles.emptyCell}>
                  <div className={styles.emptyState}>
                    {EmptyIcon && <EmptyIcon size={48} className={styles.emptyIcon} />}
                    <p className={styles.emptyMessage}>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = row[keyField];
                const isSelected = selectedKeys.has(key);
                const isExpanded = internalExpanded.has(key);
                
                return (
                  <React.Fragment key={key}>
                    <tr
                      className={`
                        ${styles.row}
                        ${isSelected ? styles.selectedRow : ''}
                        ${rowClassName ? rowClassName(row, index) : ''}
                      `}
                      onClick={() => onRowClick?.(row)}
                    >
                      {selectable && (
                        <td className={styles.checkboxCell} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(key, e.target.checked)}
                          />
                        </td>
                      )}
                      {expandable && (
                        <td className={styles.expandCell}>
                          <button
                            type="button"
                            className={styles.expandBtn}
                            onClick={(e) => toggleExpand(key, e)}
                          >
                            <ChevronRight size={16} className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`} />
                          </button>
                        </td>
                      )}
                      {columns.map(col => (
                        <td
                          key={`${key}-${col.key}`}
                          style={{ textAlign: col.align || 'left' }}
                        >
                          {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                    {expandable && isExpanded && renderExpanded && (
                      <tr className={styles.expandedRow}>
                        <td colSpan={(selectable ? 1 : 0) + (expandable ? 1 : 0) + columns.length}>
                          <div className={styles.expandedContent}>
                            {renderExpanded(row)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {page !== undefined && onPageChange && (
        <div className={styles.pagination}>
          <div className={styles.pageInfo}>
            共 <span className={styles.highlight}>{total}</span> 筆
            
            {onPageSizeChange && (
              <select 
                className={styles.pageSizeSelect}
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size} 筆/頁</option>
                ))}
              </select>
            )}
          </div>
          
          <div className={styles.pageControls}>
            <span className={styles.pageText}>第 {page} / {totalPages} 頁</span>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
