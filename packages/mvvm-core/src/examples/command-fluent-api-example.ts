import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Command, ICommand } from '../commands/Command';
import { BaseViewModel } from '../viewmodels/BaseViewModel';
import { BaseModel } from '../models/BaseModel';

/**
 * Example demonstrating Command Fluent API enhancements
 */

// Mock data types
interface RegistrationData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

/**
 * Registration Form ViewModel demonstrating fluent command configuration
 */
class RegistrationFormViewModel extends BaseViewModel<BaseModel<RegistrationData, any>> {
  // Form fields as observables
  public readonly username$ = new BehaviorSubject<string>('');
  public readonly email$ = new BehaviorSubject<string>('');
  public readonly password$ = new BehaviorSubject<string>('');
  public readonly confirmPassword$ = new BehaviorSubject<string>('');
  public readonly hasAcceptedTerms$ = new BehaviorSubject<boolean>(false);

  // Derived validation states
  public readonly isEmailValid$: Observable<boolean>;
  public readonly isPasswordValid$: Observable<boolean>;
  public readonly passwordsMatch$: Observable<boolean>;
  public readonly isNotBusy$: Observable<boolean>;

  // Submit command with fluent configuration
  public readonly submitCommand: ICommand<void, void>;

  // Clear form command
  public readonly clearFormCommand: ICommand<void, void>;

  constructor(model: BaseModel<RegistrationData, any>) {
    super(model);

    // Email validation (simple regex)
    this.isEmailValid$ = this.email$.pipe(map((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)));

    // Password validation (min 8 chars, has number and special char)
    this.isPasswordValid$ = this.password$.pipe(
      map((pwd) => {
        return pwd.length >= 8 && /\d/.test(pwd) && /[!@#$%^&*]/.test(pwd);
      }),
    );

    // Passwords match
    this.passwordsMatch$ = this.password$.pipe(map((pwd) => pwd === this.confirmPassword$.value && pwd.length > 0));

    // Not busy
    this.isNotBusy$ = this.isLoading$.pipe(map((loading) => !loading));

    // Fluent command configuration - all conditions must be true
    this.submitCommand = this.registerCommand(
      new Command(() => this.register())
        .observesProperty(this.username$) // Must have username
        .observesProperty(this.email$) // Must have email
        .observesCanExecute(this.isEmailValid$) // Email must be valid format
        .observesCanExecute(this.isPasswordValid$) // Password must meet requirements
        .observesCanExecute(this.passwordsMatch$) // Passwords must match
        .observesCanExecute(this.hasAcceptedTerms$) // Must accept terms
        .observesCanExecute(this.isNotBusy$), // Not currently loading
    );

    // Clear form command - only disabled when busy
    this.clearFormCommand = this.registerCommand(
      new Command(() => this.clearForm()).observesCanExecute(this.isNotBusy$),
    );
  }

  private async register(): Promise<void> {
    console.log('Registering user:', {
      username: this.username$.value,
      email: this.email$.value,
    });

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));

    this.model.setData({
      username: this.username$.value,
      email: this.email$.value,
      password: this.password$.value,
      confirmPassword: this.confirmPassword$.value,
      acceptedTerms: this.hasAcceptedTerms$.value,
    });
  }

  private async clearForm(): Promise<void> {
    this.username$.next('');
    this.email$.next('');
    this.password$.next('');
    this.confirmPassword$.next('');
    this.hasAcceptedTerms$.next(false);
  }
}

/**
 * Shopping Cart ViewModel demonstrating observesProperty with multiple items
 */
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

class ShoppingCartViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly items$ = new BehaviorSubject<CartItem[]>([]);
  public readonly selectedItemId$ = new BehaviorSubject<string | null>(null);
  public readonly couponCode$ = new BehaviorSubject<string>('');

  // Derived observables
  public readonly hasItems$: Observable<boolean>;
  public readonly hasSelectedItem$: Observable<boolean>;
  public readonly totalAmount$: Observable<number>;
  public readonly canApplyCoupon$: Observable<boolean>;

  // Commands with fluent API
  public readonly checkoutCommand: ICommand<void, void>;
  public readonly removeSelectedCommand: ICommand<void, void>;
  public readonly applyCouponCommand: ICommand<void, void>;
  public readonly clearCartCommand: ICommand<void, void>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    this.hasItems$ = this.items$.pipe(map((items) => items.length > 0));

    this.hasSelectedItem$ = this.selectedItemId$.pipe(map((id) => id !== null));

    this.totalAmount$ = this.items$.pipe(
      map((items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    );

    this.canApplyCoupon$ = this.couponCode$.pipe(map((code) => code.length >= 3));

    // Checkout requires items and not busy
    this.checkoutCommand = this.registerCommand(
      new Command(() => this.checkout())
        .observesCanExecute(this.hasItems$)
        .observesCanExecute(this.isLoading$.pipe(map((l) => !l))),
    );

    // Remove selected requires selection
    this.removeSelectedCommand = this.registerCommand(
      new Command(() => this.removeSelected()).observesCanExecute(this.hasSelectedItem$),
    );

    // Apply coupon requires valid code and items
    this.applyCouponCommand = this.registerCommand(
      new Command(() => this.applyCoupon()).observesCanExecute(this.hasItems$).observesCanExecute(this.canApplyCoupon$),
    );

    // Clear cart requires items
    this.clearCartCommand = this.registerCommand(
      new Command(() => this.clearCart()).observesCanExecute(this.hasItems$),
    );
  }

  private async checkout(): Promise<void> {
    console.log('Checking out with items:', this.items$.value);
    await new Promise((r) => setTimeout(r, 500));
  }

  private async removeSelected(): Promise<void> {
    const selectedId = this.selectedItemId$.value;
    if (selectedId) {
      const items = this.items$.value.filter((item) => item.id !== selectedId);
      this.items$.next(items);
      this.selectedItemId$.next(null);
    }
  }

  private async applyCoupon(): Promise<void> {
    console.log('Applying coupon:', this.couponCode$.value);
    await new Promise((r) => setTimeout(r, 300));
  }

  private async clearCart(): Promise<void> {
    this.items$.next([]);
    this.selectedItemId$.next(null);
  }
}

/**
 * Document Editor ViewModel demonstrating raiseCanExecuteChanged
 */
class DocumentEditorViewModel extends BaseViewModel<BaseModel<any, any>> {
  public readonly content$ = new BehaviorSubject<string>('');
  public readonly isDirty$ = new BehaviorSubject<boolean>(false);

  // External state not tracked by observables
  private clipboardHasContent = false;
  private selectedText: string | null = null;

  // Commands (using Command type to access raiseCanExecuteChanged)
  public readonly saveCommand: Command<void, void>;
  public readonly pasteCommand: Command<void, void>;
  public readonly cutCommand: Command<void, void>;
  public readonly copyCommand: Command<void, void>;

  constructor(model: BaseModel<any, any>) {
    super(model);

    // Save requires dirty state
    this.saveCommand = this.registerCommand(
      new Command(() => this.save()).observesCanExecute(this.isDirty$),
    ) as Command<void, void>;

    // Paste requires clipboard content (external state)
    this.pasteCommand = this.registerCommand(new Command(() => this.paste())) as Command<void, void>;

    // Cut/Copy require selection (external state)
    this.cutCommand = this.registerCommand(new Command(() => this.cut())) as Command<void, void>;

    this.copyCommand = this.registerCommand(new Command(() => this.copy())) as Command<void, void>;
  }

  // Called when clipboard state changes (external event)
  public onClipboardChanged(hasContent: boolean): void {
    this.clipboardHasContent = hasContent;
    // Manually trigger re-evaluation since clipboard is external state
    this.pasteCommand.raiseCanExecuteChanged();
  }

  // Called when text selection changes (external event)
  public onSelectionChanged(text: string | null): void {
    this.selectedText = text;
    // Manually trigger re-evaluation
    this.cutCommand.raiseCanExecuteChanged();
    this.copyCommand.raiseCanExecuteChanged();
  }

  private async save(): Promise<void> {
    console.log('Saving document');
    await new Promise((r) => setTimeout(r, 300));
    this.isDirty$.next(false);
  }

  private async paste(): Promise<void> {
    if (!this.clipboardHasContent) {
      console.log('Cannot paste: clipboard is empty');
      return;
    }
    console.log('Pasting content');
    this.isDirty$.next(true);
  }

  private async cut(): Promise<void> {
    if (!this.selectedText) {
      console.log('Cannot cut: no text selected');
      return;
    }
    console.log('Cutting text:', this.selectedText);
    this.clipboardHasContent = true;
    this.isDirty$.next(true);
  }

  private async copy(): Promise<void> {
    if (!this.selectedText) {
      console.log('Cannot copy: no text selected');
      return;
    }
    console.log('Copying text:', this.selectedText);
    this.clipboardHasContent = true;
  }
}

/**
 * Example: React component usage (pseudo-code)
 */
/*
function RegistrationForm() {
  const [vm] = useState(() => new RegistrationFormViewModel(new BaseModel({ initialData: null })));
  const [canRegister, setCanRegister] = useState(false);

  useEffect(() => {
    const sub = vm.registerCommand.canExecute$.subscribe(setCanRegister);
    return () => {
      sub.unsubscribe();
      vm.dispose();
    };
  }, []);

  return (
    <form>
      <input 
        type="text" 
        placeholder="Username"
        onChange={e => vm.username$.next(e.target.value)}
      />
      <input 
        type="email" 
        placeholder="Email"
        onChange={e => vm.email$.next(e.target.value)}
      />
      <input 
        type="password" 
        placeholder="Password"
        onChange={e => vm.password$.next(e.target.value)}
      />
      <input 
        type="password" 
        placeholder="Confirm Password"
        onChange={e => vm.confirmPassword$.next(e.target.value)}
      />
      <label>
        <input 
          type="checkbox"
          onChange={e => vm.hasAcceptedTerms$.next(e.target.checked)}
        />
        I accept the terms and conditions
      </label>
      <button 
        disabled={!canRegister}
        onClick={() => vm.registerCommand.execute()}
      >
        Register
      </button>
    </form>
  );
}
*/

/**
 * Example: Angular component usage (pseudo-code)
 */
/*
@Component({
  selector: 'app-registration',
  template: `
    <form>
      <input type="text" placeholder="Username" 
             (input)="vm.username$.next($event.target.value)">
      <input type="email" placeholder="Email" 
             (input)="vm.email$.next($event.target.value)">
      <input type="password" placeholder="Password" 
             (input)="vm.password$.next($event.target.value)">
      <input type="password" placeholder="Confirm Password" 
             (input)="vm.confirmPassword$.next($event.target.value)">
      <label>
        <input type="checkbox" 
               (change)="vm.hasAcceptedTerms$.next($event.target.checked)">
        I accept the terms and conditions
      </label>
      <button [disabled]="!(vm.registerCommand.canExecute$ | async)"
              (click)="vm.registerCommand.execute()">
        Register
      </button>
    </form>
  `
})
export class RegistrationComponent implements OnDestroy {
  vm = new RegistrationFormViewModel(new BaseModel({ initialData: null }));

  ngOnDestroy() {
    this.vm.dispose();
  }
}
*/

/**
 * Example: Vue component usage (pseudo-code)
 */
/*
<template>
  <form>
    <input type="text" placeholder="Username" 
           @input="vm.username$.next($event.target.value)">
    <input type="email" placeholder="Email" 
           @input="vm.email$.next($event.target.value)">
    <input type="password" placeholder="Password" 
           @input="vm.password$.next($event.target.value)">
    <input type="password" placeholder="Confirm Password" 
           @input="vm.confirmPassword$.next($event.target.value)">
    <label>
      <input type="checkbox" 
             @change="vm.hasAcceptedTerms$.next($event.target.checked)">
      I accept the terms and conditions
    </label>
    <button :disabled="!canRegister"
            @click="vm.registerCommand.execute()">
      Register
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const vm = new RegistrationFormViewModel(new BaseModel({ initialData: null }));
const canRegister = ref(false);

let sub: Subscription;

onMounted(() => {
  sub = vm.registerCommand.canExecute$.subscribe(val => canRegister.value = val);
});

onUnmounted(() => {
  sub?.unsubscribe();
  vm.dispose();
});
</script>
*/

export { RegistrationFormViewModel, ShoppingCartViewModel, DocumentEditorViewModel };
