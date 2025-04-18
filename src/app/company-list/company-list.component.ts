import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-company-list',
  imports: [MatCardModule, MatButtonModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss',
  standalone:true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyListComponent {

}
