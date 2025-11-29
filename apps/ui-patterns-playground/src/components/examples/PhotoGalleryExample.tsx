import { useState, useEffect } from 'react';
import { createGridLayout } from '@web-loom/ui-patterns';
import './examples.css';

interface Photo {
  id: string;
  title: string;
  url: string;
  color: string;
}

/**
 * Photo Gallery Example with Grid Layout
 * 
 * Demonstrates:
 * - Grid layout pattern with responsive breakpoints
 * - Keyboard navigation (arrow keys)
 * - Breakpoint changes visualization
 */
export function PhotoGalleryExample() {
  const photos: Photo[] = [
    { id: '1', title: 'Mountain Sunset', url: '🏔️', color: '#FF6B6B' },
    { id: '2', title: 'Ocean Waves', url: '🌊', color: '#4ECDC4' },
    { id: '3', title: 'Forest Path', url: '🌲', color: '#95E1D3' },
    { id: '4', title: 'Desert Dunes', url: '🏜️', color: '#F38181' },
    { id: '5', title: 'City Lights', url: '🌃', color: '#AA96DA' },
    { id: '6', title: 'Starry Night', url: '⭐', color: '#FCBAD3' },
    { id: '7', title: 'Tropical Beach', url: '🏖️', color: '#FFFFD2' },
    { id: '8', title: 'Snowy Peak', url: '⛰️', color: '#A8D8EA' },
    { id: '9', title: 'Autumn Leaves', url: '🍂', color: '#FFB6B9' },
    { id: '10', title: 'Spring Flowers', url: '🌸', color: '#FEC8D8' },
    { id: '11', title: 'Northern Lights', url: '🌌', color: '#957DAD' },
    { id: '12', title: 'Waterfall', url: '💧', color: '#D4E4F7' },
  ];

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  const gridLayout = createGridLayout({
    items: photos,
    getId: (photo) => photo.id,
    breakpoints: [
      { minWidth: 0, columns: 1 },
      { minWidth: 480, columns: 2 },
      { minWidth: 768, columns: 3 },
      { minWidth: 1024, columns: 4 },
    ],
    selectionMode: 'single',
    wrap: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      gridLayout.actions.updateViewportWidth(width);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          gridLayout.actions.navigateUp();
          break;
        case 'ArrowDown':
          e.preventDefault();
          gridLayout.actions.navigateDown();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          gridLayout.actions.navigateLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          gridLayout.actions.navigateRight();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          const focusedPhoto = photos[gridLayout.getState().focusedIndex];
          if (focusedPhoto) {
            gridLayout.actions.selectItem(focusedPhoto.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const state = gridLayout.getState();
  const focusedPhoto = photos[state.focusedIndex];
  const selectedPhoto = state.selectedItems.length > 0
    ? photos.find(p => p.id === state.selectedItems[0])
    : null;

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Photo Gallery with Grid Layout</h2>
        <p>
          This example demonstrates the <code>createGridLayout</code> pattern
          with responsive breakpoints and keyboard navigation.
        </p>
      </div>

      <div className="example-content">
        <div className="gallery-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Viewport Width:</span>
              <span className="info-value">{viewportWidth}px</span>
            </div>
            <div className="info-item">
              <span className="info-label">Columns:</span>
              <span className="info-value">{state.columns}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Breakpoint:</span>
              <span className="info-value">
                {state.breakpoint.minWidth}px → {state.breakpoint.columns} cols
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Focused:</span>
              <span className="info-value">
                {focusedPhoto ? focusedPhoto.title : 'None'}
              </span>
            </div>
          </div>
        </div>

        <div className="keyboard-hint">
          <p>💡 Use arrow keys to navigate, Enter/Space to select</p>
        </div>

        <div 
          className="photo-gallery"
          style={{
            gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
          }}
        >
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`photo-card ${
                state.focusedIndex === index ? 'focused' : ''
              } ${
                state.selectedItems.includes(photo.id) ? 'selected' : ''
              }`}
              style={{ backgroundColor: photo.color }}
              onClick={() => {
                gridLayout.actions.selectItem(photo.id);
              }}
              tabIndex={0}
            >
              <div className="photo-emoji">{photo.url}</div>
              <div className="photo-title">{photo.title}</div>
              {state.focusedIndex === index && (
                <div className="focus-indicator">Focused</div>
              )}
            </div>
          ))}
        </div>

        {selectedPhoto && (
          <div className="selected-photo-detail">
            <h3>Selected Photo</h3>
            <div className="detail-card" style={{ backgroundColor: selectedPhoto.color }}>
              <div className="detail-emoji">{selectedPhoto.url}</div>
              <div className="detail-info">
                <h4>{selectedPhoto.title}</h4>
                <p>ID: {selectedPhoto.id}</p>
              </div>
            </div>
          </div>
        )}

        <div className="breakpoint-visualization">
          <h3>Responsive Breakpoints</h3>
          <div className="breakpoint-list">
            {[
              { minWidth: 0, columns: 1, label: 'Mobile' },
              { minWidth: 480, columns: 2, label: 'Small Tablet' },
              { minWidth: 768, columns: 3, label: 'Tablet' },
              { minWidth: 1024, columns: 4, label: 'Desktop' },
            ].map((bp) => (
              <div
                key={bp.minWidth}
                className={`breakpoint-item ${
                  state.breakpoint.minWidth === bp.minWidth ? 'active' : ''
                }`}
              >
                <div className="breakpoint-label">{bp.label}</div>
                <div className="breakpoint-spec">
                  {bp.minWidth}px+ → {bp.columns} columns
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Responsive grid with 4 breakpoints (1-4 columns)</li>
          <li>Keyboard navigation with arrow keys</li>
          <li>Visual focus and selection indicators</li>
          <li>Real-time breakpoint visualization</li>
          <li>Automatic column recalculation on resize</li>
        </ul>
      </div>
    </div>
  );
}
