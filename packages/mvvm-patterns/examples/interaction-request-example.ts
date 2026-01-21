/**
 * Example: Interaction Request Pattern
 * 
 * This example demonstrates how to use InteractionRequest
 * to enable ViewModels to request UI interactions without
 * direct coupling to the View layer.
 */

import { BaseModel } from '@web-loom/mvvm-core';
import { BaseViewModel } from '@web-loom/mvvm-core';
import {
  ConfirmationRequest,
  NotificationRequest,
  InputRequest,
  SelectionRequest,
  IConfirmation,
} from '../src/interactions';

// Model
interface OrderData {
  id: string;
  customerName: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
}

class OrderModel extends BaseModel<OrderData, any> {
  constructor(initialData: OrderData) {
    super({ initialData });
  }

  updateStatus(status: OrderData['status']): void {
    const currentData = this._data$.value;
    if (currentData) {
      this.setData({ ...currentData, status });
    }
  }

  delete(): void {
    this.setData(null);
  }
}

// ViewModel with Interaction Requests
class OrderViewModel extends BaseViewModel<OrderModel> {
  // Interaction requests for different UI interactions
  readonly confirmDelete = new ConfirmationRequest();
  readonly confirmStatusChange = new ConfirmationRequest();
  readonly notifySuccess = new NotificationRequest();
  readonly notifyError = new NotificationRequest();
  readonly promptCustomerName = new InputRequest();
  readonly selectStatus = new SelectionRequest<OrderData['status']>();

  constructor(model: OrderModel) {
    super(model);
  }

  /**
   * Delete order with confirmation
   */
  async deleteOrder(): Promise<boolean> {
    const orderData = this.model._data$.value;
    if (!orderData) return false;

    // Request confirmation from the View
    const response = await this.confirmDelete.raiseAsync({
      title: 'Delete Order',
      content: `Are you sure you want to delete order #${orderData.id}?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (response.confirmed) {
      try {
        this.model.delete();
        
        // Notify success
        this.notifySuccess.raise({
          title: 'Success',
          content: 'Order deleted successfully',
        });
        
        return true;
      } catch (error) {
        this.notifyError.raise({
          title: 'Error',
          content: 'Failed to delete order',
        });
        return false;
      }
    }

    return false;
  }

  /**
   * Change order status with confirmation
   */
  async changeStatus(): Promise<void> {
    const orderData = this.model._data$.value;
    if (!orderData) return;

    // Request status selection
    const selectionResponse = await this.selectStatus.raiseAsync({
      title: 'Change Status',
      content: 'Select new order status:',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
      ],
    });

    if (!selectionResponse.selectedValue) return;

    // Confirm the change
    const confirmResponse = await this.confirmStatusChange.raiseAsync({
      title: 'Confirm Status Change',
      content: `Change status from "${orderData.status}" to "${selectionResponse.selectedValue}"?`,
      confirmText: 'Change',
      cancelText: 'Cancel',
    });

    if (confirmResponse.confirmed) {
      this.model.updateStatus(selectionResponse.selectedValue);
      
      this.notifySuccess.raise({
        title: 'Status Updated',
        content: `Order status changed to ${selectionResponse.selectedValue}`,
      });
    }
  }

  /**
   * Update customer name with input prompt
   */
  async updateCustomerName(): Promise<void> {
    const orderData = this.model._data$.value;
    if (!orderData) return;

    const response = await this.promptCustomerName.raiseAsync({
      title: 'Update Customer Name',
      content: 'Enter new customer name:',
      defaultValue: orderData.customerName,
      placeholder: 'Customer name',
      inputType: 'text',
    });

    if (response.inputValue && response.inputValue.trim()) {
      const currentData = this.model._data$.value;
      if (currentData) {
        this.model.setData({
          ...currentData,
          customerName: response.inputValue.trim(),
        });

        this.notifySuccess.raise({
          content: 'Customer name updated',
        });
      }
    }
  }

  public override dispose(): void {
    // Clean up interaction requests
    this.confirmDelete.dispose();
    this.confirmStatusChange.dispose();
    this.notifySuccess.dispose();
    this.notifyError.dispose();
    this.promptCustomerName.dispose();
    this.selectStatus.dispose();
    
    super.dispose();
  }
}

// Simulated View Handler (would be in React/Vue/Angular component)
class ViewHandler {
  constructor(private vm: OrderViewModel) {
    this.setupInteractionHandlers();
  }

  private setupInteractionHandlers(): void {
    // Handle confirmation requests
    this.vm.confirmDelete.requested$.subscribe((event) => {
      console.log(`\n📋 Confirmation Dialog:`);
      console.log(`   Title: ${event.context.title}`);
      console.log(`   Message: ${event.context.content}`);
      console.log(`   [${event.context.confirmText}] [${event.context.cancelText}]`);
      
      // Simulate user clicking "Delete"
      const confirmed = true;
      event.callback({ ...event.context, confirmed });
    });

    this.vm.confirmStatusChange.requested$.subscribe((event) => {
      console.log(`\n📋 Confirmation Dialog:`);
      console.log(`   Title: ${event.context.title}`);
      console.log(`   Message: ${event.context.content}`);
      
      // Simulate user confirming
      const confirmed = true;
      event.callback({ ...event.context, confirmed });
    });

    // Handle notifications
    this.vm.notifySuccess.requested$.subscribe((event) => {
      console.log(`\n✅ Success Notification:`);
      if (event.context.title) {
        console.log(`   ${event.context.title}`);
      }
      console.log(`   ${event.context.content}`);
    });

    this.vm.notifyError.requested$.subscribe((event) => {
      console.log(`\n❌ Error Notification:`);
      if (event.context.title) {
        console.log(`   ${event.context.title}`);
      }
      console.log(`   ${event.context.content}`);
    });

    // Handle input requests
    this.vm.promptCustomerName.requested$.subscribe((event) => {
      console.log(`\n📝 Input Dialog:`);
      console.log(`   Title: ${event.context.title}`);
      console.log(`   Message: ${event.context.content}`);
      console.log(`   Default: ${event.context.defaultValue}`);
      
      // Simulate user entering new name
      const inputValue = 'Jane Smith';
      event.callback({ ...event.context, inputValue });
    });

    // Handle selection requests
    this.vm.selectStatus.requested$.subscribe((event) => {
      console.log(`\n📋 Selection Dialog:`);
      console.log(`   Title: ${event.context.title}`);
      console.log(`   Message: ${event.context.content}`);
      console.log(`   Options:`);
      event.context.options.forEach((opt) => {
        console.log(`     - ${opt.label}`);
      });
      
      // Simulate user selecting "shipped"
      const selectedValue = 'shipped' as OrderData['status'];
      event.callback({ ...event.context, selectedValue });
    });
  }
}

// Demo execution
export async function runInteractionRequestExample(): Promise<void> {
  console.log('=== Interaction Request Pattern Example ===\n');

  const model = new OrderModel({
    id: 'ORD-001',
    customerName: 'John Doe',
    total: 99.99,
    status: 'pending',
  });

  const vm = new OrderViewModel(model);
  const viewHandler = new ViewHandler(vm);

  console.log('Initial Order:', model._data$.value);

  // Test 1: Update customer name
  console.log('\n--- Test 1: Update Customer Name ---');
  await vm.updateCustomerName();
  console.log('Updated Order:', model._data$.value);

  // Test 2: Change status
  console.log('\n--- Test 2: Change Order Status ---');
  await vm.changeStatus();
  console.log('Updated Order:', model._data$.value);

  // Test 3: Delete order
  console.log('\n--- Test 3: Delete Order ---');
  const deleted = await vm.deleteOrder();
  console.log('Deleted:', deleted);
  console.log('Final Order:', model._data$.value);

  // Cleanup
  vm.dispose();
  console.log('\n=== Example Complete ===');
}

// Uncomment to run the example
// runInteractionRequestExample();
