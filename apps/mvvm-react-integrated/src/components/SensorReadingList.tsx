import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackArrow from '../assets/back-arrow.svg';
import { useAppContext } from '../providers/AppProvider';
import { type SensorReadingListData } from '@repo/view-models/SensorReadingViewModel';
import { type EndpointState } from '@web-loom/query-core';
import { useListSelection, useDialogBehavior } from '@web-loom/ui-core/react';

export const READINGS_ENDPOINT_KEY = 'posts';

async function fetchReadings(): Promise<SensorReadingListData> {
  const response = await fetch('http://localhost:3700/api/readings');
  if (!response.ok) {
    throw new Error('Network response was not ok for posts');
  }
  return response.json();
}

export function SensorReadingList() {
  const { queryCore } = useAppContext();

  const [readingList, setReadingList] = useState<EndpointState<SensorReadingListData>>({
    data: undefined,
    isLoading: true,
    isError: false,
    error: undefined,
    lastUpdated: undefined,
  });

  // Use ui-core's list selection for managing selected readings
  // Note: Not passing items array to allow selection of any ID
  // This is a workaround for dynamic/async loaded items
  const selection = useListSelection({
    mode: 'multi',
  });

  // Use ui-core's dialog behavior for delete confirmation
  const deleteDialog = useDialogBehavior({
    id: 'delete-readings-dialog',
    onOpen: (content) => {
      console.log('Delete dialog opened for:', content);
    },
  });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupEndpoint() {
      await queryCore.defineEndpoint<SensorReadingListData>(READINGS_ENDPOINT_KEY, fetchReadings);

      unsubscribe = queryCore.subscribe<SensorReadingListData>(READINGS_ENDPOINT_KEY, (state) => {
        setReadingList(state);
      });

      const currentState = queryCore.getState<SensorReadingListData>(READINGS_ENDPOINT_KEY);
      if (!currentState.isLoading && !currentState.data) {
        queryCore.refetch<SensorReadingListData>(READINGS_ENDPOINT_KEY);
      }
    }

    setupEndpoint();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleSelection = (readingId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      selection.actions.toggleSelection(readingId);
    } else {
      selection.actions.select(readingId);
    }
  };

  const handleSelectAll = () => {
    // Manually select all items by selecting each one
    if (readingList.data) {
      // Clear first, then select all
      selection.actions.clearSelection();
      readingList.data.forEach((reading) => {
        selection.actions.select(String(reading.id));
      });
    }
  };

  const handleDeleteSelected = () => {
    if (selection.selectedIds.length > 0) {
      // Open confirmation dialog
      deleteDialog.actions.open({
        count: selection.selectedIds.length,
        ids: selection.selectedIds,
      });
    }
  };

  const confirmDelete = () => {
    console.log('Deleting readings:', deleteDialog.content?.ids);
    // In a real app, you'd call an API to delete these readings
    // await queryCore.deleteReadings(deleteDialog.content?.ids);
    
    // Close dialog and clear selection
    deleteDialog.actions.close();
    selection.actions.clearSelection();
  };

  const isSelected = (id: string) => selection.selectedIds.includes(id);
  const hasSelection = selection.selectedIds.length > 0;
  const selectedCount = selection.selectedIds.length;

  return (
    <div className="page-container">
      <Link to="/" className="back-button">
        <img src={BackArrow} alt="Back to dashboard" />
        Back to Dashboard
      </Link>

      <div className="page-header-section">
        <h1 className="page-title">Sensor Readings</h1>
        <p className="page-description">
          View all sensor readings and their timestamps. Select readings to perform bulk actions.
        </p>
      </div>

      {hasSelection && (
        <div
          className="selection-toolbar"
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: 'var(--colors-brand-primary, #3b82f6)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            opacity: '0.9',
          }}
        >
          <span style={{ fontWeight: 500, color: 'var(--colors-text-primary)' }}>
            {selectedCount} reading{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDeleteSelected}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--colors-danger-default, #ef4444)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Delete Selected
            </button>
            <button
              onClick={() => selection.actions.clearSelection()}
              style={{
                padding: '6px 12px',
                backgroundColor: 'var(--colors-background-surface)',
                color: 'var(--colors-text-primary)',
                border: '1px solid var(--colors-border-default)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {readingList.isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading sensor readings...</p>
        </div>
      ) : readingList.data && readingList.data.length > 0 ? (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--colors-brand-primary, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Select All
            </button>
            {hasSelection && (
              <button
                onClick={() => selection.actions.clearSelection()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--colors-background-surface)',
                  color: 'var(--colors-text-primary)',
                  border: '1px solid var(--colors-border-default)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Deselect All
              </button>
            )}
          </div>
          <ul className="list-container">
            {readingList.data.map((reading) => {
              const readingId = String(reading.id);
              const selected = isSelected(readingId);

              return (
                <li
                  key={reading.id + reading.timestamp}
                  className="list-item-card"
                  style={{
                    backgroundColor: selected ? 'var(--colors-background-hover)' : 'var(--colors-background-surface)',
                    border: selected
                      ? '2px solid var(--colors-brand-primary)'
                      : '1px solid var(--colors-border-default)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={(e) => handleToggleSelection(readingId, e)}
                >
                  <div className="list-item-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          selection.actions.toggleSelection(readingId);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                        }}
                      />
                      <h3 className="list-item-title">Reading #{reading.id}</h3>
                    </div>
                    <span className="list-item-id">{new Date(reading.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="list-item-body">
                    <div className="list-item-field">
                      <span className="list-item-field-label">Sensor ID</span>
                      <span className="list-item-field-value">{reading.sensorId}</span>
                    </div>
                    <div className="list-item-field">
                      <span className="list-item-field-label">Value</span>
                      <span className="list-item-field-value">{reading.value}</span>
                    </div>
                    <div className="list-item-field">
                      <span className="list-item-field-label">Timestamp</span>
                      <span className="list-item-field-value">{new Date(reading.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">No sensor readings found</p>
          <p className="empty-state-description">Readings will appear here once sensors start collecting data</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => deleteDialog.actions.close()}
        >
          <div
            style={{
              backgroundColor: 'var(--colors-background-surface)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: 'var(--colors-text-primary)', fontSize: '20px', fontWeight: 600 }}>
                Delete Readings
              </h3>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ margin: 0, color: 'var(--colors-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to delete {deleteDialog.content?.count} reading
                {deleteDialog.content?.count !== 1 ? 's' : ''}? This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => deleteDialog.actions.close()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--colors-background-elevated)',
                  color: 'var(--colors-text-primary)',
                  border: '1px solid var(--colors-border-default)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--colors-danger-default)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
