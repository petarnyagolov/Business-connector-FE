import { Component } from '@angular/core';
import { CardPageComponent } from './card-page/card-page.component'; 
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './component/header/header.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [RouterModule, HeaderComponent]
})

export class AppComponent {
  title = 'Business-connector-FE';
}

