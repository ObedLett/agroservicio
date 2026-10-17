import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AvisoService } from '../../aviso.service';
import { FirebaseService } from '../../firebase.service';
import { NEGOCIO } from '../../firebase.config';
import { dinero } from '../../dinero.pipe';
import { Pedido, Producto, alertasStock } from '../../models';
import { Inventario } from './inventario';
import { Pedidos } from './pedidos';

@Component({
  selector: 'app-panel',
  imports: [Inventario, Pedidos],
  templateUrl: './panel.html',
  styleUrl: './panel.css'
})
export class Panel {
  private readonly fb = inject(FirebaseService);
  private readonly router = inject(Router);
  private readonly avisos = inject(AvisoService);

  readonly negocio = NEGOCIO;
  readonly usuario = this.fb.usuario;
  readonly tab = signal<'inv' | 'ped'>('inv');

  readonly productos = signal<Producto[]>([]);
  readonly pedidos = signal<Pedido[]>([]);

  readonly alertas = computed(() => alertasStock(this.productos()).length);
  readonly nuevos = computed(() => this.pedidos().filter(p => p.estado === 'nuevo').length);

  constructor() {
    const error = (e: unknown) => {
      console.error(e);
      this.avisos.mostrar('No se pudieron leer los datos. Revise las reglas de Firestore.', 'mal');
    };
    const bajas = [
      this.fb.escucharInventario(p => this.productos.set(p), error),
      this.fb.escucharPedidos(
        p => this.pedidos.set(p),
        n => this.avisos.mostrar(`Nuevo pedido de ${n.cliente?.nombre || 'un cliente'} por ${dinero(n.total)}`, 'nuevo'),
        error
      )
    ];
    inject(DestroyRef).onDestroy(() => bajas.forEach(b => b()));
  }

  async salir(): Promise<void> {
    await this.fb.logout();
    await this.router.navigate(['/admin/login']);
  }
}
