# React Framework Examples - UI Patterns

This document provides comprehensive React examples for all UI Patterns.

## Table of Contents

1. [Hub & Spoke Navigation](#hub--spoke-navigation)
2. [Grid/Card Layout](#gridcard-layout)
3. [Floating Action Button](#floating-action-button)
4. [Modal (Enhanced)](#modal-enhanced)
5. [Sidebar Shell (Enhanced)](#sidebar-shell-enhanced)
6. [Toast Queue (Enhanced)](#toast-queue-enhanced)
7. [Tabbed Interface (Enhanced)](#tabbed-interface-enhanced)
8. [Command Palette (Enhanced)](#command-palette-enhanced)

---

## Hub & Spoke Navigation

### Basic Settings Interface

```tsx
import React, { useState } from 'react';
import { useHubAndSpoke } from '@web-loom/ui-patterns/react';

interface Spoke {
  id: string;
  label: string;
  icon: string;
}

function SettingsInterface() {
  const spokes: Spoke[] = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
  ];

  const hubSpoke = useHubAndSpoke({
    spokes,
    onSpokeActivate: (spokeId) => console.log('Activated:', spokeId),
    onReturnToHub: () => console.log('Returned to hub'),
  });

  const state = hubSpoke.getState();

  return (
    <div className="settings-interface">
      {state.isOnHub ? (
        <div className="hub">
          <h1>Settings</h1>
          <div className="spoke-grid">
            {spokes.map(spoke => (
              <button
                key={spoke.id}
                onClick={() => hubSpoke.activateSpoke(spoke.id)}
                className="spoke-card"
              >
                <span className="icon">{spoke.icon}</span>
                <span className="label">{spoke.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="spoke">
          <nav className="breadcrumbs">
            <button onClick={() => hubSpoke.returnToHub()}>
              ← Settings
            </button>
            {state.breadcrumbs.map((crumb, index) => (
              <span key={index}> / {crumb}</span>
            ))}
          </nav>

          <div className="spoke-content">
            {state.activeSpoke === 'profile' && <ProfileSettings />}
            {state.activeSpoke === 'security' && <SecuritySettings />}
            {state.activeSpoke === 'notifications' && <NotificationSettings />}
            {state.activeSpoke === 'appearance' && <AppearanceSettings />}
          </div>
        </div>
      )}
    </div>
  );
}

// Spoke components
function ProfileSettings() {
  return <div>Profile Settings Content</div>;
}

function SecuritySettings() {
  return <div>Security Settings Content</div>;
}

function NotificationSettings() {
  return <div>Notification Settings Content</div>;
}

function AppearanceSettings() {
  return <div>Appearance Settings Content</div>;
}

export default SettingsInterface;
```

### Nested Spokes Example

```tsx
import React from 'react';
import { useHubAndSpoke } from '@web-loom/ui-patterns/react';

function NestedSettingsInterface() {
  const spokes = [
    {
      id: 'account',
      label: 'Account',
      icon: '👤',
      subSpokes: [
        { id: 'profile', label: 'Profile', icon: '📝' },
        { id: 'privacy', label: 'Privacy', icon: '🔒' },
      ],
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: '⚙️',
      subSpokes: [
        { id: 'theme', label: 'Theme', icon: '🎨' },
        { id: 'language', label: 'Language', icon: '🌐' },
      ],
    },
  ];

  const hubSpoke = useHubAndSpoke({
    spokes,
    onSpokeActivate: (spokeId) => console.log('Activated:', spokeId),
  });

  const state = hubSpoke.getState();

  const renderHub = () => (
    <div className="hub">
      <h1>Settings Hub</h1>
      <div className="spoke-grid">
        {spokes.map(spoke => (
          <button
            key={spoke.id}
            onClick={() => hubSpoke.activateSpoke(spoke.id)}
            className="spoke-card"
          >
            <span className="icon">{spoke.icon}</span>
            <span className="label">{spoke.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpoke = () => {
    const currentSpoke = spokes.find(s => s.id === state.activeSpoke);
    
    return (
      <div className="spoke">
        <nav className="breadcrumbs">
          <button onClick={() => hubSpoke.returnToHub()}>
            ← Hub
          </button>
          <span> / {currentSpoke?.label}</span>
        </nav>

        {currentSpoke?.subSpokes && (
          <div className="sub-spokes">
            {currentSpoke.subSpokes.map(subSpoke => (
              <button
                key={subSpoke.id}
                onClick={() => hubSpoke.activateSpoke(subSpoke.id)}
                className="sub-spoke-card"
              >
                <span className="icon">{subSpoke.icon}</span>
                <span className="label">{subSpoke.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="nested-settings">
      {state.isOnHub ? renderHub() : renderSpoke()}
    </div>
  );
}

export default NestedSettingsInterface;
```

---

## Grid/Card Layout

### Photo Gallery

```tsx
import React, { useState, useEffect } from 'react';
import { useGridLayout } from '@web-loom/ui-patterns/react';

interface Photo {
  id: string;
  url: string;
  title: string;
}

function PhotoGallery() {
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  const photos: Photo[] = Array.from({ length: 20 }, (_, i) => ({
    id: `photo-${i}`,
    url: `https://picsum.photos/300/200?random=${i}`,
    title: `Photo ${i + 1}`,
  }));

  const grid = useGridLayout({
    items: photos,
    getId: (photo) => photo.id,
    breakpoints: [
      { minWidth: 0, columns: 1 },
      { minWidth: 640, columns: 2 },
      { minWidth: 1024, columns: 3 },
      { minWidth: 1280, columns: 4 },
    ],
    selectionMode: 'multi',
    wrap: true,
    onSelectionChange: (selected) => {
      console.log('Selected photos:', selected);
    },
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setViewportWidth(width);
      grid.updateViewportWidth(width);
    };

    window.addEventListener('resize', handleResize);
    grid.updateViewportWidth(viewportWidth);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      grid.navigateUp();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      grid.navigateDown();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      grid.navigateLeft();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      grid.navigateRight();
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const state = grid.getState();
      const focusedPhoto = photos[state.focusedIndex];
      if (focusedPhoto) {
        grid.selectItem(focusedPhoto.id);
      }
    }
  };

  const state = grid.getState();

  return (
    <div className="photo-gallery" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="gallery-header">
        <h2>Photo Gallery</h2>
        <p>
          {state.columns} columns • {state.selectedItems.length} selected
        </p>
      </div>

      <div
        className="photo-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
          gap: '16px',
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
            onClick={() => grid.selectItem(photo.id)}
            tabIndex={state.focusedIndex === index ? 0 : -1}
          >
            <img src={photo.url} alt={photo.title} />
            <p>{photo.title}</p>
          </div>
        ))}
      </div>

      <div className="keyboard-help">
        <p>Use arrow keys to navigate, Space/Enter to select</p>
      </div>
    </div>
  );
}

export default PhotoGallery;
```

### Product Grid

```tsx
import React, { useState } from 'react';
import { useGridLayout } from '@web-loom/ui-patterns/react';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
}

function ProductGrid() {
  const products: Product[] = [
    { id: '1', name: 'Product 1', price: 29.99, image: '/product1.jpg' },
    { id: '2', name: 'Product 2', price: 39.99, image: '/product2.jpg' },
    { id: '3', name: 'Product 3', price: 49.99, image: '/product3.jpg' },
    // ... more products
  ];

  const grid = useGridLayout({
    items: products,
    getId: (product) => product.id,
    breakpoints: [
      { minWidth: 0, columns: 1 },
      { minWidth: 768, columns: 2 },
      { minWidth: 1024, columns: 3 },
      { minWidth: 1440, columns: 4 },
    ],
    selectionMode: 'single',
    onSelectionChange: (selected) => {
      console.log('Selected product:', selected[0]);
    },
  });

  React.useEffect(() => {
    const handleResize = () => {
      grid.updateViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    grid.updateViewportWidth(window.innerWidth);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const state = grid.getState();

  return (
    <div className="product-grid">
      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.columns}, 1fr)`,
          gap: '24px',
        }}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`product-card ${
              state.selectedItems.includes(product.id) ? 'selected' : ''
            }`}
            onClick={() => grid.selectItem(product.id)}
          >
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProductGrid;
```

---

## Floating Action Button

### Scroll-Aware FAB

```tsx
import React, { useEffect } from 'react';
import { useFloatingActionButton } from '@web-loom/ui-patterns/react';

function ScrollAwareFAB() {
  const fab = useFloatingActionButton({
    scrollThreshold: 200,
    hideOnScrollDown: true,
    onVisibilityChange: (visible) => {
      console.log('FAB visibility:', visible);
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      fab.setScrollPosition(window.scrollY);
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    return () => window.removeEventListener('scroll', throttledScroll);
  }, []);

  const state = fab.getState();

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      className={`fab ${state.isVisible ? 'visible' : 'hidden'}`}
      onClick={handleClick}
      aria-label="Scroll to top"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        opacity: state.isVisible ? 1 : 0,
        transform: state.isVisible ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.3s ease',
      }}
    >
      ↑
    </button>
  );
}

export default ScrollAwareFAB;
```

### Create New Item FAB

```tsx
import React, { useState } from 'react';
import { useFloatingActionButton } from '@web-loom/ui-patterns/react';

function CreateItemFAB() {
  const [showDialog, setShowDialog] = useState(false);

  const fab = useFloatingActionButton({
    scrollThreshold: 100,
    hideOnScrollDown: false, // Always visible
  });

  React.useEffect(() => {
    const handleScroll = () => {
      fab.setScrollPosition(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const state = fab.getState();

  return (
    <>
      <button
        className={`fab create ${state.isVisible ? 'visible' : 'hidden'}`}
        onClick={() => setShowDialog(true)}
        aria-label="Create new item"
      >
        +
      </button>

      {showDialog && (
        <div className="dialog">
          <h2>Create New Item</h2>
          <button onClick={() => setShowDialog(false)}>Close</button>
        </div>
      )}
    </>
  );
}

export default CreateItemFAB;
```

---

## Modal (Enhanced)

### Modal with Escape and Backdrop Close

```tsx
import React, { useState } from 'react';
import { useModal } from '@web-loom/ui-patterns/react';

function EnhancedModalExample() {
  const modal = useModal();

  const openSettings = () => {
    modal.openModal({
      id: 'settings',
      content: { title: 'Settings' },
      priority: 1,
      closeOnEscape: true,
      closeOnBackdropClick: true,
    });
  };

  const openConfirmation = () => {
    modal.openModal({
      id: 'confirmation',
      content: { title: 'Confirm Action' },
      priority: 2,
      closeOnEscape: false, // Prevent accidental close
      closeOnBackdropClick: false,
    });
  };

  const state = modal.getState();
  const topModal = state.stack[state.stack.length - 1];

  return (
    <div>
      <button onClick={openSettings}>Open Settings</button>
      <button onClick={openConfirmation}>Open Confirmation</button>

      {topModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (topModal.closeOnBackdropClick) {
              modal.closeTopModal();
            }
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{topModal.content.title}</h2>
            <button onClick={() => modal.closeTopModal()}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedModalExample;
```

---

## Sidebar Shell (Enhanced)

### Responsive Sidebar with Mobile Mode

```tsx
import React, { useEffect } from 'react';
import { useSidebarShell } from '@web-loom/ui-patterns/react';

function ResponsiveSidebar() {
  const sidebar = useSidebarShell({
    sections: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'projects', label: 'Projects', icon: '📁' },
      { id: 'team', label: 'Team', icon: '👥' },
      { id: 'settings', label: 'Settings', icon: '⚙️' },
    ],
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      sidebar.setMobileMode(isMobile);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const state = sidebar.getState();

  const handleSectionSelect = (sectionId: string) => {
    sidebar.selectSection(sectionId);
    
    // Auto-collapse on mobile
    if (state.isMobile) {
      sidebar.collapse();
    }
  };

  return (
    <div className="app-layout">
      {state.isMobile && (
        <button
          className="mobile-toggle"
          onClick={() => sidebar.toggleMobile()}
        >
          ☰
        </button>
      )}

      <aside
        className={`sidebar ${state.isCollapsed ? 'collapsed' : ''} ${
          state.isMobile ? 'mobile' : ''
        }`}
      >
        {state.sections.map(section => (
          <button
            key={section.id}
            onClick={() => handleSectionSelect(section.id)}
            className={state.activeSection === section.id ? 'active' : ''}
          >
            <span className="icon">{section.icon}</span>
            {!state.isCollapsed && <span>{section.label}</span>}
          </button>
        ))}
      </aside>

      <main className="content">
        <h1>{state.activeSection}</h1>
      </main>
    </div>
  );
}

export default ResponsiveSidebar;
```

---

## Toast Queue (Enhanced)

### Toast with Position Configuration

```tsx
import React from 'react';
import { useToastQueue } from '@web-loom/ui-patterns/react';

type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

function ToastExample() {
  const toast = useToastQueue({
    maxVisible: 3,
    defaultDuration: 3000,
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    toast.addToast({
      id: Date.now().toString(),
      message,
      type,
      duration: 3000,
    });
  };

  const changePosition = (position: ToastPosition) => {
    toast.setPosition(position);
  };

  const state = toast.getState();

  return (
    <div>
      <div className="controls">
        <button onClick={() => showToast('Success!', 'success')}>
          Show Success
        </button>
        <button onClick={() => showToast('Error occurred', 'error')}>
          Show Error
        </button>
        <button onClick={() => showToast('Info message', 'info')}>
          Show Info
        </button>

        <select
          value={state.position}
          onChange={(e) => changePosition(e.target.value as ToastPosition)}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>

      <div className={`toast-container ${state.position}`}>
        {state.queue.slice(0, state.maxVisible).map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <p>{t.message}</p>
            <button onClick={() => toast.removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ToastExample;
```

---

## Tabbed Interface (Enhanced)

### Tabs with Keyboard Navigation

```tsx
import React from 'react';
import { useTabbedInterface } from '@web-loom/ui-patterns/react';

function TabbedExample() {
  const tabs = useTabbedInterface({
    tabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'details', label: 'Details' },
      { id: 'settings', label: 'Settings' },
    ],
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      tabs.focusNextTab();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      tabs.focusPreviousTab();
    }
  };

  const state = tabs.getState();

  return (
    <div className="tabbed-interface">
      <div className="tab-list" role="tablist" onKeyDown={handleKeyDown}>
        {state.tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={state.activeTab === tab.id}
            tabIndex={state.activeTab === tab.id ? 0 : -1}
            onClick={() => tabs.activateTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-panel" role="tabpanel">
        {state.activeTab === 'overview' && <div>Overview Content</div>}
        {state.activeTab === 'details' && <div>Details Content</div>}
        {state.activeTab === 'settings' && <div>Settings Content</div>}
      </div>
    </div>
  );
}

export default TabbedExample;
```

---

## Command Palette (Enhanced)

### Command Palette with Navigation

```tsx
import React, { useState } from 'react';
import { useCommandPalette } from '@web-loom/ui-patterns/react';

function CommandPaletteExample() {
  const [isOpen, setIsOpen] = useState(false);

  const commands = [
    { id: 'new-file', label: 'New File', action: () => console.log('New file') },
    { id: 'open-file', label: 'Open File', action: () => console.log('Open file') },
    { id: 'save', label: 'Save', action: () => console.log('Save') },
    { id: 'settings', label: 'Settings', action: () => console.log('Settings') },
  ];

  const palette = useCommandPalette({
    commands,
    onCommandExecute: (command) => {
      command.action();
      setIsOpen(false);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      palette.selectNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      palette.selectPrevious();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      palette.executeSelected();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const state = palette.getState();

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}>
        Open Command Palette (Ctrl+K)
      </button>
    );
  }

  return (
    <div className="command-palette-overlay">
      <div className="command-palette" onKeyDown={handleKeyDown}>
        <input
          type="text"
          placeholder="Type a command..."
          value={state.query}
          onChange={(e) => palette.setQuery(e.target.value)}
          autoFocus
        />

        <ul className="command-list">
          {state.filteredCommands.map((command, index) => (
            <li
              key={command.id}
              className={state.selectedIndex === index ? 'selected' : ''}
              onClick={() => {
                palette.executeCommand(command.id);
                setIsOpen(false);
              }}
            >
              {command.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default CommandPaletteExample;
```

---

## Best Practices

### 1. Responsive Design

```tsx
useEffect(() => {
  const handleResize = () => {
    grid.updateViewportWidth(window.innerWidth);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### 2. Keyboard Accessibility

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowUp':
      e.preventDefault();
      grid.navigateUp();
      break;
    case 'ArrowDown':
      e.preventDefault();
      grid.navigateDown();
      break;
    // ... more keys
  }
};
```

### 3. Throttle Scroll Events

```tsx
useEffect(() => {
  let ticking = false;
  
  const handleScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        fab.setScrollPosition(window.scrollY);
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

### 4. Clean Up Resources

```tsx
useEffect(() => {
  // Setup
  const pattern = createPattern();

  return () => {
    // Cleanup
    pattern.destroy();
  };
}, []);
```

---

This completes the React examples for UI Patterns. For UI Core behavior examples, see the UI Core documentation.
