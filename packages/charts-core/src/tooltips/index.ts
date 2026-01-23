import type { TooltipConfig, TooltipData } from '../core/types';
import { applyCSSTransition, TRANSITION_CONFIG } from '../core/transitions';

export interface TooltipPosition {
  x: number;
  y: number;
}

export class TooltipManager {
  private tooltipElement?: HTMLElement;

  constructor(private config?: TooltipConfig) {}

  attach(container: HTMLElement): void {
    if (this.tooltipElement) {
      return;
    }
    const tooltip = document.createElement('div');
    tooltip.className = 'charts-core-tooltip';
    
    // Enhanced styling per requirements 1.6
    tooltip.style.position = 'absolute';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.display = 'none';
    tooltip.style.zIndex = '99';
    
    // Apply 12px padding
    tooltip.style.padding = '12px';
    
    // Apply 8px border-radius
    tooltip.style.borderRadius = '8px';
    
    // Background with subtle transparency
    tooltip.style.background = 'rgba(255, 255, 255, 0.98)';
    tooltip.style.color = '#1f2937';
    
    // Add shadow (0 4px 12px rgba(0,0,0,0.15))
    tooltip.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    
    // Set Inter font stack
    tooltip.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    tooltip.style.fontSize = '13px';
    tooltip.style.lineHeight = '1.5';
    
    // Add border for definition
    tooltip.style.border = '1px solid rgba(0, 0, 0, 0.08)';
    
    // Apply smooth transition for opacity changes
    applyCSSTransition(tooltip, ['opacity', 'transform'], TRANSITION_CONFIG.duration);
    
    // Start hidden with opacity 0
    tooltip.style.opacity = '0';
    
    container.appendChild(tooltip);
    this.tooltipElement = tooltip;
  }

  show(data: TooltipData, position?: TooltipPosition): void {
    if (!this.tooltipElement || this.config?.enabled === false) {
      return;
    }

    this.tooltipElement.textContent = this.config?.format?.(data) ?? `${data.seriesId}: ${data.point.y}`;
    
    if (this.config?.strategy === 'follow' && position) {
      this.tooltipElement.style.left = `${position.x + 6}px`;
      this.tooltipElement.style.top = `${position.y + 6}px`;
      this.tooltipElement.style.transform = 'translate(0, 0)';
    } else {
      this.tooltipElement.style.left = '1rem';
      this.tooltipElement.style.top = '1rem';
      this.tooltipElement.style.transform = 'translate(0, 0)';
    }

    // Fade in with smooth transition
    this.tooltipElement.style.display = 'block';
    // Force reflow to ensure transition applies
    void this.tooltipElement.offsetHeight;
    this.tooltipElement.style.opacity = '1';
  }

  hide(): void {
    if (!this.tooltipElement) {
      return;
    }

    // Fade out with smooth transition
    this.tooltipElement.style.opacity = '0';
    
    // Hide after transition completes
    setTimeout(() => {
      if (this.tooltipElement) {
        this.tooltipElement.style.display = 'none';
      }
    }, TRANSITION_CONFIG.duration);
  }
}
