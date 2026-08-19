import type { Router } from '@web-loom/router-core';
import type { CommandPaletteBehavior } from '@web-loom/ui-patterns';
import { uiStore } from './infrastructure/store/ui-store';
import { disposeTheme, initTheme } from './theme/init-theme';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartModel } from './features/cart/CartModel';
import { CartViewModel } from './features/cart/CartViewModel';
import { TemplateAppActions } from './app/actions';
import { createTemplateAppPalette } from './app/palette';
import { createTemplateAppState, type TemplateAppState } from './app/state';
import { createTemplateAppSubscriptions } from './app/subscriptions';

export class TemplateAppViewModel {
  readonly state: TemplateAppState;
  readonly actions: TemplateAppActions;
  readonly palette: CommandPaletteBehavior;
  readonly catalog: CatalogViewModel;
  readonly cart: CartViewModel;

  private readonly catalogModel: CatalogModel;
  private readonly cartModel: CartModel;
  private subscriptions: Array<() => void> = [];
  private started = false;

  /** `router` is owned and destroyed by the composition root (`app/index.ts`). */
  constructor(
    catalogModel: CatalogModel,
    cartModel: CartModel,
    private readonly router: Router,
  ) {
    this.catalogModel = catalogModel;
    this.cartModel = cartModel;
    this.catalog = new CatalogViewModel(catalogModel);
    this.cart = new CartViewModel(cartModel);
    this.state = createTemplateAppState(uiStore.getState().theme, this.cart.checkoutForm.getState());
    this.actions = new TemplateAppActions({
      catalog: this.catalog,
      cart: this.cart,
      state: this.state,
      navigate: (path) => this.navigate(path),
    });
    const palette = createTemplateAppPalette(this.actions);
    this.actions.bindPalette(palette);
    this.palette = palette;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await initTheme();
    this.catalog.activate();
    this.cart.activate();
    this.subscriptions = createTemplateAppSubscriptions({
      state: this.state,
      cart: this.cart,
      palette: this.palette,
      actions: this.actions,
    });
  }

  async navigate(path: string): Promise<void> {
    await this.router.push(path);
  }

  dispose(): void {
    this.subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
    this.actions.dispose();
    this.palette.destroy();
    disposeTheme();
    this.catalog.deactivate();
    this.cart.deactivate();
    this.catalog.dispose();
    this.cart.dispose();
    this.catalogModel.dispose();
    this.cartModel.dispose();
    this.started = false;
  }
}
