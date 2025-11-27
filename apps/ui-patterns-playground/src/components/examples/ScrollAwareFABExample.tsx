import { useState, useEffect, useRef } from 'react';
import { createFloatingActionButton } from '@web-loom/ui-patterns';
import './examples.css';

/**
 * Scroll-Aware FAB Example
 * 
 * Demonstrates:
 * - Floating Action Button pattern
 * - hideOnScrollDown behavior
 * - Threshold configuration
 */
export function ScrollAwareFABExample() {
  const [messages, setMessages] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollThreshold, setScrollThreshold] = useState(100);
  const [hideOnScrollDown, setHideOnScrollDown] = useState(true);

  const fab = createFloatingActionButton({
    scrollThreshold,
    hideOnScrollDown,
    onVisibilityChange: (visible) => {
      addMessage(`FAB visibility changed: ${visible ? 'Visible' : 'Hidden'}`);
    },
  });

  useEffect(() => {
    fab.actions.setScrollThreshold(scrollThreshold);
  }, [scrollThreshold]);

  useEffect(() => {
    fab.actions.setHideOnScrollDown(hideOnScrollDown);
  }, [hideOnScrollDown]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    fab.actions.setScrollPosition(scrollTop);
  };

  const addMessage = (message: string) => {
    setMessages(prev => [
      `${new Date().toLocaleTimeString()}: ${message}`,
      ...prev
    ].slice(0, 10));
  };

  const handleFABClick = () => {
    addMessage('FAB clicked!');
    // Scroll to top
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const state = fab.getState();

  // Generate dummy content for scrolling
  const dummyContent = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `Content Block ${i + 1}`,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  }));

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Scroll-Aware Floating Action Button</h2>
        <p>
          This example demonstrates the <code>createFloatingActionButton</code> pattern
          with scroll-based visibility and threshold configuration.
        </p>
      </div>

      <div className="example-content">
        <div className="fab-controls">
          <div className="control-group">
            <label htmlFor="threshold">
              Scroll Threshold: {scrollThreshold}px
            </label>
            <input
              id="threshold"
              type="range"
              min="0"
              max="500"
              step="50"
              value={scrollThreshold}
              onChange={(e) => setScrollThreshold(Number(e.target.value))}
              className="threshold-slider"
            />
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hideOnScrollDown}
                onChange={(e) => setHideOnScrollDown(e.target.checked)}
              />
              Hide on scroll down
            </label>
          </div>

          <div className="fab-state-info">
            <div className="state-grid">
              <div className="state-item">
                <span className="state-label">Is Visible:</span>
                <span className={`state-value ${state.isVisible ? 'active' : ''}`}>
                  {state.isVisible ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="state-item">
                <span className="state-label">Scroll Position:</span>
                <span className="state-value">{Math.round(state.scrollPosition)}px</span>
              </div>
              <div className="state-item">
                <span className="state-label">Scroll Direction:</span>
                <span className="state-value">
                  {state.scrollDirection === 'up' && '↑ Up'}
                  {state.scrollDirection === 'down' && '↓ Down'}
                  {state.scrollDirection === null && '—'}
                </span>
              </div>
              <div className="state-item">
                <span className="state-label">Threshold:</span>
                <span className="state-value">{state.scrollThreshold}px</span>
              </div>
            </div>
          </div>
        </div>

        <div className="fab-demo-container">
          <div
            ref={scrollContainerRef}
            className="scrollable-content"
            onScroll={handleScroll}
          >
            <div className="scroll-indicator">
              <p>👇 Scroll down to see the FAB behavior</p>
            </div>

            {dummyContent.map((item) => (
              <div key={item.id} className="content-block">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}

            <div className="scroll-indicator">
              <p>👆 Scroll back up</p>
            </div>
          </div>

          {state.isVisible && (
            <button
              className="floating-action-button"
              onClick={handleFABClick}
              title="Scroll to top"
            >
              ↑
            </button>
          )}
        </div>

        <div className="event-log">
          <h3>Event Log</h3>
          {messages.length === 0 ? (
            <p className="empty-state">No events yet. Start scrolling!</p>
          ) : (
            <ul className="log-list">
              {messages.map((msg, index) => (
                <li key={index} className="log-item">
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="example-footer">
        <h3>Key Features</h3>
        <ul>
          <li>Threshold-based visibility (shows after scrolling past threshold)</li>
          <li>Hide on scroll down behavior (optional)</li>
          <li>Scroll direction detection</li>
          <li>Configurable threshold with live updates</li>
          <li>Event logging for visibility changes</li>
        </ul>
      </div>
    </div>
  );
}
