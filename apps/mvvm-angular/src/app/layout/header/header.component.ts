import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { navigationViewModel } from '@repo/shared/view-models/NavigationViewModel';

@Component({
  selector: 'app-header',
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  public navigationList$ = navigationViewModel.navigationList.items$;

  constructor() {}
}
