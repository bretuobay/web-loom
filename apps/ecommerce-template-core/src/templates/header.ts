import { defineComponent } from '@web-loom/view';
import template from './header.loom';

export interface HeaderProps {
  theme: string;
  cartCount: number;
  onNavigate: (event: Event) => void;
  onOpenPalette: () => void;
  onToggleTheme: () => void;
  onOpenCart: () => void;
}

export const header = defineComponent<HeaderProps>({
  name: 'header',
  props: ['theme', 'cartCount', 'onNavigate', 'onOpenPalette', 'onToggleTheme', 'onOpenCart'],
  template,
});
