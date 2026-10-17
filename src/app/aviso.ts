import { Component, inject } from '@angular/core';
import { AvisoService } from './aviso.service';

@Component({
  selector: 'app-aviso',
  template: `
    @if (avisos.actual(); as a) {
      <div class="aviso" [class.nuevo]="a.tipo === 'nuevo'" [class.mal]="a.tipo === 'mal'" role="status">{{ a.texto }}</div>
    }
  `,
  styleUrl: './aviso.css'
})
export class Aviso {
  readonly avisos = inject(AvisoService);
}
