import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Table.css';

/**
 * Componente Table riutilizzabile
 * 
 * @param {Object} props - Proprietà del componente
 * @param {Array} props.data - Array di oggetti da visualizzare nella tabella
 * @param {Array} props.columns - Configurazione delle colonne 
 * @param {Boolean} props.sortable - Se la tabella può essere ordinata
 * @param {Boolean} props.pagination - Se abilitare la paginazione
 * @param {Number} props.pageSize - Numero di elementi per pagina (default: 10)
 * @param {Boolean} props.striped - Se la tabella deve avere righe alternate
 * @param {Boolean} props.hoverable - Se le righe devono evidenziarsi al passaggio del mouse
 * @param {Boolean} props.bordered - Se la tabella deve avere bordi
 * @param {Function} props.onRowClick - Callback quando una riga viene cliccata
 * @param {JSX.Element} props.actions - Elemento JSX per le azioni sulla tabella
 * @param {Boolean} props.loading - Se la tabella è in caricamento
 * @param {JSX.Element} props.emptyState - Elemento da mostrare quando non ci sono dati
 */
const Table = ({
  data = [],
  columns = [],
  sortable = true,
  pagination = true,
  pageSize = 10,
  striped = true,
  hoverable = true,
  bordered = true,
  onRowClick = null,
  actions = null,
  loading = false,
  emptyState = null,
  className = '',
  selectableRows = false,
  onRowSelect = () => {},
  selectedRows = [],
  customRowClass = () => ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRowsState, setSelectedRowsState] = useState(selectedRows || []);
  const [filteredData, setFilteredData] = useState([]);

  // Effetto per aggiornare i dati filtrati quando cambiano i dati di input
  useEffect(() => {
    let sortedData = [...data];
    
    // Ordinamento
    if (sortConfig.key) {
      sortedData.sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];
        
        if (valueA < valueB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredData(sortedData);
  }, [data, sortConfig]);

  // Funzione per cambiare l'ordinamento
  const requestSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Gestisce la selezione/deselezione di una riga
  const handleRowSelect = (row, index) => {
    let newSelectedRows;
    
    if (selectedRowsState.includes(index)) {
      newSelectedRows = selectedRowsState.filter(idx => idx !== index);
    } else {
      newSelectedRows = [...selectedRowsState, index];
    }
    
    setSelectedRowsState(newSelectedRows);
    onRowSelect(newSelectedRows.map(idx => data[idx]));
  };

  // Calcola i dati da mostrare nella pagina corrente
  const getCurrentPageData = () => {
    if (!pagination) return filteredData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  };

  // Calcola il numero totale di pagine
  const totalPages = pagination ? Math.ceil(filteredData.length / pageSize) : 1;

  // Cambia pagina
  const changePage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Genera la classe CSS per una riga
  const getRowClassName = (item, index) => {
    let className = '';
    
    if (striped && index % 2 === 0) className += ' table-row-striped';
    if (hoverable) className += ' table-row-hover';
    if (onRowClick) className += ' table-row-clickable';
    if (selectedRowsState.includes(index)) className += ' table-row-selected';
    
    // Aggiungi classi personalizzate dalla funzione customRowClass
    const customClass = customRowClass(item, index);
    if (customClass) className += ` ${customClass}`;
    
    return className.trim();
  };

  // Genera la paginazione
  const renderPagination = () => {
    if (!pagination || totalPages <= 1) return null;
    
    const pages = [];
    
    // Aggiungi pulsante "Precedente"
    pages.push(
      <button 
        key="prev" 
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
        className="table-pagination-button"
      >
        &laquo;
      </button>
    );
    
    // Mostra al massimo 5 numeri di pagina
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => changePage(i)}
          className={`table-pagination-button ${currentPage === i ? 'table-pagination-active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Aggiungi pulsante "Successivo"
    pages.push(
      <button 
        key="next" 
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="table-pagination-button"
      >
        &raquo;
      </button>
    );
    
    return (
      <div className="table-pagination">
        <div className="table-pagination-info">
          Mostrando {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} - {Math.min(currentPage * pageSize, filteredData.length)} di {filteredData.length} risultati
        </div>
        <div className="table-pagination-buttons">
          {pages}
        </div>
      </div>
    );
  };

  // Rendering per lo stato vuoto
  const renderEmptyState = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={columns.length + (selectableRows ? 1 : 0)} className="table-loading">
            <div className="table-loading-spinner"></div>
            <div>Caricamento in corso...</div>
          </td>
        </tr>
      );
    }
    
    if (filteredData.length === 0) {
      return (
        <tr>
          <td colSpan={columns.length + (selectableRows ? 1 : 0)} className="table-empty-state">
            {emptyState || <div>Nessun dato disponibile</div>}
          </td>
        </tr>
      );
    }
    
    return null;
  };

  // Rendering principale della tabella
  return (
    <div className={`table-container ${className}`}>
      {/* Area per le azioni */}
      {actions && <div className="table-actions">{actions}</div>}
      
      {/* Tabella */}
      <table className={`table ${bordered ? 'table-bordered' : ''}`}>
        <thead>
          <tr>
            {/* Colonna per checkbox di selezione */}
            {selectableRows && (
              <th className="table-checkbox-header">
                <input 
                  type="checkbox" 
                  checked={selectedRowsState.length === getCurrentPageData().length && getCurrentPageData().length > 0} 
                  onChange={() => {
                    if (selectedRowsState.length === getCurrentPageData().length) {
                      setSelectedRowsState([]);
                      onRowSelect([]);
                    } else {
                      const allIndexes = getCurrentPageData().map((_, idx) => idx + (currentPage - 1) * pageSize);
                      setSelectedRowsState(allIndexes);
                      onRowSelect(getCurrentPageData());
                    }
                  }}
                />
              </th>
            )}
            
            {/* Intestazioni colonne */}
            {columns.map((column, index) => (
              <th 
                key={index}
                onClick={() => column.sortable !== false && requestSort(column.field)}
                className={`${column.sortable !== false && sortable ? 'table-sortable' : ''} ${column.className || ''}`}
                style={column.style}
              >
                <div className="table-header-content">
                  {column.header || column.field}
                  {sortable && column.sortable !== false && sortConfig.key === column.field && (
                    <span className={`table-sort-icon ${sortConfig.direction}`}>
                      {sortConfig.direction === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Stato vuoto o di caricamento */}
          {renderEmptyState() || 
            // Righe di dati
            getCurrentPageData().map((item, rowIndex) => {
              const actualIndex = pagination ? (currentPage - 1) * pageSize + rowIndex : rowIndex;
              
              return (
                <tr 
                  key={rowIndex}
                  className={getRowClassName(item, actualIndex)}
                  onClick={() => {
                    if (onRowClick) onRowClick(item, actualIndex);
                    if (selectableRows) handleRowSelect(item, actualIndex);
                  }}
                >
                  {/* Checkbox per selezione riga */}
                  {selectableRows && (
                    <td className="table-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRowsState.includes(actualIndex)}
                        onChange={() => handleRowSelect(item, actualIndex)}
                      />
                    </td>
                  )}
                  
                  {/* Celle dati */}
                  {columns.map((column, colIndex) => (
                    <td 
                      key={colIndex}
                      className={column.cellClassName || ''}
                      style={column.cellStyle}
                    >
                      {column.render 
                        ? column.render(item, actualIndex)
                        : item[column.field]
                      }
                    </td>
                  ))}
                </tr>
              );
            })
          }
        </tbody>
      </table>
      
      {/* Paginazione */}
      {renderPagination()}
    </div>
  );
};

Table.propTypes = {
  data: PropTypes.array.isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.string.isRequired,
      header: PropTypes.string,
      render: PropTypes.func,
      sortable: PropTypes.bool,
      className: PropTypes.string,
      style: PropTypes.object,
      cellClassName: PropTypes.string,
      cellStyle: PropTypes.object
    })
  ).isRequired,
  sortable: PropTypes.bool,
  pagination: PropTypes.bool,
  pageSize: PropTypes.number,
  striped: PropTypes.bool,
  hoverable: PropTypes.bool,
  bordered: PropTypes.bool,
  onRowClick: PropTypes.func,
  actions: PropTypes.node,
  loading: PropTypes.bool,
  emptyState: PropTypes.node,
  className: PropTypes.string,
  selectableRows: PropTypes.bool,
  onRowSelect: PropTypes.func,
  selectedRows: PropTypes.array,
  customRowClass: PropTypes.func
};

export default Table;