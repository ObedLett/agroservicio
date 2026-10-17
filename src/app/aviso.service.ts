import { Injectable, signal } from '@angular/core';

export interface MensajeAviso { texto: string; tipo: '' | 'nuevo' | 'mal'; }

@Injectable({ providedIn: 'root' })
export class AvisoService {
  readonly actual = signal<MensajeAviso | null>(null);
  private temporizador?: ReturnType<typeof setTimeout>;

  mostrar(texto: string, tipo: MensajeAviso['tipo'] = ''): void {
    this.actual.set({ texto, tipo });
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.actual.set(null), 3500);
  }
}
