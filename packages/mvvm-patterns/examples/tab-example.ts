/**
 * Example: Tab-based interface with Active Awareness
 * 
 * This example demonstrates how to use ActiveAwareViewModel
 * in a tab-based interface where inactive tabs pause their updates.
 */

import { ActiveAwareViewModel } from '../src/viewmodels/ActiveAwareViewModel';
import { BaseModel } from '@web-loom/mvvm-core';
import { interval, Subscription } from 'rxjs';

// Model for tab data
interface TabData {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
}

class TabModel extends BaseModel<TabData, any> {
  constructor(initialData: TabData) {
    super({ initialData });
  }

  updateContent(content: string): void {
    const currentData = this._data$.value;
    if (currentData) {
      this.setData({
        ...currentData,
        content,
        lastUpdated: new Date(),
      });
    }
  }
}

// ViewModel with active awareness
class TabViewModel extends ActiveAwareViewModel<TabModel> {
  private updateSubscription?: Subscription;
  private updateCount = 0;

  constructor(model: TabModel) {
    super(model);
    console.log(`TabViewModel created for: ${model._data$.value?.title}`);
  }

  protected onIsActiveChanged(isActive: boolean, wasActive: boolean): void {
    const tabTitle = this.model._data$.value?.title || 'Unknown';
    
    if (isActive) {
      console.log(`✅ Tab "${tabTitle}" became active - starting updates`);
      this.startUpdates();
    } else {
      console.log(`⏸️  Tab "${tabTitle}" became inactive - pausing updates`);
      this.stopUpdates();
    }
  }

  private startUpdates(): void {
    // Simulate periodic updates (e.g., polling API)
    this.updateSubscription = interval(2000).subscribe(() => {
      this.updateCount++;
      const tabTitle = this.model._data$.value?.title || 'Unknown';
      this.model.updateContent(`Updated content #${this.updateCount}`);
      console.log(`🔄 Tab "${tabTitle}" updated (count: ${this.updateCount})`);
    });
  }

  private stopUpdates(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
      this.updateSubscription = undefined;
    }
  }

  public override dispose(): void {
    const tabTitle = this.model._data$.value?.title || 'Unknown';
    console.log(`🗑️  Disposing TabViewModel for: ${tabTitle}`);
    this.stopUpdates();
    super.dispose();
  }
}

// Simulate a tab container
class TabContainer {
  private tabs: Map<string, TabViewModel> = new Map();
  private activeTabId: string | null = null;

  addTab(id: string, title: string): void {
    const model = new TabModel({
      id,
      title,
      content: `Initial content for ${title}`,
      lastUpdated: new Date(),
    });

    const viewModel = new TabViewModel(model);
    this.tabs.set(id, viewModel);
    console.log(`➕ Added tab: ${title}`);
  }

  selectTab(id: string): void {
    // Deactivate current tab
    if (this.activeTabId) {
      const currentTab = this.tabs.get(this.activeTabId);
      if (currentTab) {
        currentTab.deactivate();
      }
    }

    // Activate new tab
    const newTab = this.tabs.get(id);
    if (newTab) {
      newTab.activate();
      this.activeTabId = id;
      console.log(`🎯 Selected tab: ${id}`);
    }
  }

  removeTab(id: string): void {
    const tab = this.tabs.get(id);
    if (tab) {
      tab.dispose();
      this.tabs.delete(id);
      console.log(`➖ Removed tab: ${id}`);
    }
  }

  dispose(): void {
    console.log('🧹 Disposing all tabs...');
    this.tabs.forEach(tab => tab.dispose());
    this.tabs.clear();
  }
}

// Demo execution
export function runTabExample(): void {
  console.log('=== Tab Active Awareness Example ===\n');

  const container = new TabContainer();

  // Add tabs
  container.addTab('tab1', 'Dashboard');
  container.addTab('tab2', 'Analytics');
  container.addTab('tab3', 'Settings');

  console.log('\n--- Selecting Dashboard tab ---');
  container.selectTab('tab1');

  // Wait 5 seconds, then switch tabs
  setTimeout(() => {
    console.log('\n--- Switching to Analytics tab ---');
    container.selectTab('tab2');
  }, 5000);

  // Wait another 5 seconds, then switch back
  setTimeout(() => {
    console.log('\n--- Switching back to Dashboard tab ---');
    container.selectTab('tab1');
  }, 10000);

  // Clean up after 15 seconds
  setTimeout(() => {
    console.log('\n--- Cleaning up ---');
    container.dispose();
    console.log('\n=== Example Complete ===');
  }, 15000);
}

// Uncomment to run the example
// runTabExample();
