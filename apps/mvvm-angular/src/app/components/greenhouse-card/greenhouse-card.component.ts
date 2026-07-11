import { Component, OnInit, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // For async pipe, ngIf
import { greenHouseViewModel, GreenhouseListData } from '@repo/view-models/GreenHouseViewModel'; // Adjusted import path
import { BackIconComponent } from '../back-icon/back-icon.component';

export const GREENHOUSE_VIEW_MODEL = new InjectionToken<typeof greenHouseViewModel>('GREENHOUSE_VIEW_MODEL');

@Component({
  selector: 'app-greenhouse-card',
  standalone: true,
  imports: [RouterModule, CommonModule], // Added CommonModule
  templateUrl: './greenhouse-card.component.html',
  styleUrl: './greenhouse-card.component.scss',
  providers: [
    {
      provide: GREENHOUSE_VIEW_MODEL,
      useValue: greenHouseViewModel,
    },
  ],
})
export class GreenhouseCardComponent implements OnInit {
  // Expose the view model instance directly to the template
  public vm: typeof greenHouseViewModel;

  // For cleaner template access if needed, though async pipe can access vm.data$ directly
  public data$!: Signal<GreenhouseListData | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  private destroyRef = inject(DestroyRef);

  constructor(@Inject(GREENHOUSE_VIEW_MODEL) vm: typeof greenHouseViewModel) {
    this.vm = vm;
  }

  ngOnInit(): void {
    this.data$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    // Initial data fetch if not done automatically by view model
    // Assuming a fetch method exists, or it fetches on instantiation.
    // If GreenHouseViewModel's constructor or init logic fetches data, this might not be needed.
    // For now, let's assume we might need to call a method like `load()` or `fetch()`.
    // This is a common pattern. If the VM fetches on init, this call can be removed.
    // if (typeof (this.vm as any).fetchCommand === 'function') {
    this.vm.fetchCommand.execute();
    // } else if (typeof (this.vm as any).load === 'function') {
    // (this.vm as any).fetchCommand.execute();
    // }
  }
}
