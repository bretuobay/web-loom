import { Component, OnInit, OnDestroy, Inject, InjectionToken, Signal, DestroyRef, inject } from '@angular/core';
import { fromLoomSignal } from '../../utils/loom-signals';
import { observe } from '@web-loom/signals-core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GreenhouseData, greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { BackIconComponent } from '../back-icon/back-icon.component';
import { RouterLink } from '@angular/router';

export const GREENHOUSE_VIEW_MODEL = new InjectionToken<typeof greenHouseViewModel>('GREENHOUSE_VIEW_MODEL');

@Component({
  selector: 'app-greenhouse-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BackIconComponent, RouterLink],
  templateUrl: './greenhouse-list.component.html',
  styleUrls: ['./greenhouse-list.component.scss'],
  providers: [
    {
      provide: GREENHOUSE_VIEW_MODEL,
      useValue: greenHouseViewModel,
    },
  ],
})
export class GreenhouseListComponent implements OnInit {
  public vm: typeof greenHouseViewModel;
  public greenhouses$!: Signal<GreenhouseData[] | null>;
  public loading$!: Signal<boolean>;
  public error$!: Signal<any>;

  greenhouseForm: FormGroup;
  editingGreenhouseId: string | null | undefined = null;
  greenhouses: GreenhouseData[] = [];
  private destroyRef = inject(DestroyRef);

  greenHouseSizeOptions = ['25sqm', '50sqm', '100sqm'] as const;

  constructor(
    private fb: FormBuilder,
    @Inject(GREENHOUSE_VIEW_MODEL) vm: typeof greenHouseViewModel,
  ) {
    this.vm = vm;
    this.greenhouseForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      size: ['', Validators.required],
      cropType: [''],
      id: [''], // Optional field for editing
    });
  }

  ngOnInit(): void {
    this.greenhouses$ = fromLoomSignal(this.vm.data$, this.destroyRef);
    this.loading$ = fromLoomSignal(this.vm.isLoading$, this.destroyRef);
    this.error$ = fromLoomSignal(this.vm.error$, this.destroyRef);

    this.vm.fetchCommand.execute();
    this.destroyRef.onDestroy(observe(this.vm.data$, (ghs) => (this.greenhouses = ghs || [])));
  }

  handleSubmit(): void {
    if (this.greenhouseForm.invalid) {
      console.error('Form is invalid');
      return;
    }

    const formDataValue = this.greenhouseForm.value;

    if (this.editingGreenhouseId) {
      const existingGreenhouse = this.greenhouses.find((gh) => gh.id === this.editingGreenhouseId);
      if (existingGreenhouse) {
        this.vm.updateCommand.execute({
          id: this.editingGreenhouseId,
          payload: {
            ...existingGreenhouse, // spread existing to keep other properties
            name: formDataValue.name,
            location: formDataValue.location,
            size: this.greenHouseSizeOptions.includes(formDataValue.size) ? formDataValue.size : '100sqm', // default to '25sqm' if not valid
            cropType: formDataValue.cropType,
          },
        });
      }
    } else {
      const existingGreenhouseByName = this.greenhouses.find((gh) => gh.name === formDataValue.name);
      if (existingGreenhouseByName) {
        console.error('Greenhouse with this name already exists:', formDataValue.name);
        this.vm.updateCommand.execute({
          id: existingGreenhouseByName.id || '',
          payload: {
            ...existingGreenhouseByName,
            name: formDataValue.name,
            location: formDataValue.location,
            size: this.greenHouseSizeOptions.includes(formDataValue.size) ? formDataValue.size : '100sqm', // default to '100sqm' if not valid
            cropType: formDataValue.cropType,
          },
        });
      } else {
        this.vm.createCommand.execute(formDataValue);
      }
    }

    this.greenhouseForm.reset();
    this.editingGreenhouseId = null;
  }

  handleUpdateForm(id?: string): void {
    if (!id) return;
    const greenhouse = this.greenhouses.find((gh) => gh.id === id);
    if (greenhouse) {
      this.editingGreenhouseId = greenhouse.id;
      this.greenhouseForm.patchValue({
        name: greenhouse.name,
        location: greenhouse.location,
        size: this.greenHouseSizeOptions.includes(greenhouse.size as (typeof this.greenHouseSizeOptions)[number])
          ? greenhouse.size
          : '100sqm', // Default to '100sqm' if invalid
        cropType: greenhouse.cropType || '',
      });
    } else {
      console.error('Greenhouse not found for update:', id);
    }
  }

  handleDelete(id?: string): void {
    if (!id) {
      console.error('No ID provided for deletion');
      return;
    }
    this.vm.deleteCommand.execute(id);
    // If the deleted greenhouse was being edited, reset the form
    if (this.editingGreenhouseId === id) {
      this.greenhouseForm.reset();
      this.editingGreenhouseId = null;
    }
  }
}
