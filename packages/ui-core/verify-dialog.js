// Simple verification script for dialog behavior
import { createDialogBehavior } from './dist/ui-core.es.js';

console.log('Testing Dialog Behavior...\n');

// Test 1: Initial state
const dialog = createDialogBehavior({ id: 'test-dialog' });
const initialState = dialog.getState();
console.log('✓ Initial state:', initialState);
console.assert(initialState.isOpen === false, 'Dialog should be closed initially');
console.assert(initialState.id === 'test-dialog', 'Dialog should have correct ID');

// Test 2: Open dialog
dialog.actions.open({ title: 'Test Dialog' });
const openState = dialog.getState();
console.log('✓ After open:', openState);
console.assert(openState.isOpen === true, 'Dialog should be open');
console.assert(openState.content.title === 'Test Dialog', 'Dialog should have correct content');

// Test 3: Close dialog
dialog.actions.close();
const closedState = dialog.getState();
console.log('✓ After close:', closedState);
console.assert(closedState.isOpen === false, 'Dialog should be closed');

// Test 4: Toggle dialog
dialog.actions.toggle({ title: 'Toggled' });
const toggledState = dialog.getState();
console.log('✓ After toggle (open):', toggledState);
console.assert(toggledState.isOpen === true, 'Dialog should be open after toggle');

dialog.actions.toggle();
const toggledClosedState = dialog.getState();
console.log('✓ After toggle (close):', toggledClosedState);
console.assert(toggledClosedState.isOpen === false, 'Dialog should be closed after second toggle');

// Test 5: Callbacks
let openCalled = false;
let closeCalled = false;

const dialogWithCallbacks = createDialogBehavior({
  onOpen: (content) => {
    openCalled = true;
    console.log('✓ onOpen callback called with:', content);
  },
  onClose: () => {
    closeCalled = true;
    console.log('✓ onClose callback called');
  },
});

dialogWithCallbacks.actions.open({ test: 'data' });
console.assert(openCalled, 'onOpen callback should be called');

dialogWithCallbacks.actions.close();
console.assert(closeCalled, 'onClose callback should be called');

// Test 6: Subscription
let subscriptionCalled = false;
const dialogWithSub = createDialogBehavior();
const unsubscribe = dialogWithSub.subscribe((state) => {
  subscriptionCalled = true;
  console.log('✓ Subscription called with state:', state);
});

dialogWithSub.actions.open({ test: 'subscription' });
console.assert(subscriptionCalled, 'Subscription should be called on state change');

unsubscribe();
dialogWithSub.destroy();

console.log('\n✅ All dialog behavior tests passed!');
