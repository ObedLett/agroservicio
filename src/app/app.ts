import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Aviso } from './aviso';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Aviso],
  template: `<router-outlet /><app-aviso />`
})
export class App {}
