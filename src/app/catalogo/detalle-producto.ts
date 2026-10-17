import { Component, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { AvisoService } from '../aviso.service';
import { CarritoService } from '../carrito.service';
import { DineroPipe } from '../dinero.pipe';
import { Producto, estadoStock, nombreCategoria } from '../models';

@Component({
  selector: 'app-detalle-producto',
  imports: [DineroPipe],
  templateUrl: './detalle-producto.html',
  styleUrl: './detalle-producto.css'
})
export class DetalleProducto {
  private readonly carrito = inject(CarritoService);
  private readonly avisos = inject(AvisoService);

  readonly producto = input<Producto | null>(null);
  readonly cerrado = output<void>();

  private readonly dlg = viewChild<ElementRef<HTMLDialogElement>>('dlg');

  readonly nombreCategoria = nombreCategoria;
  readonly estadoStock = estadoStock;

  readonly selId = signal('');
  readonly cant = signal(1);

  readonly actual = computed(() => this.producto()?.presentaciones.find(s => s.id === this.selId()) ?? null);
  readonly max = computed(() => Math.max(0, Number(this.actual()?.stock) || 0));
  /** Cantidad válida: entre 1 y el stock de la presentación elegida. */
  readonly cantEfectiva = computed(() => Math.min(Math.max(1, this.cant()), Math.max(1, this.max())));
  readonly subtotal = computed(() => (Number(this.actual()?.precio) || 0) * this.cantEfectiva());

  constructor() {
    // Abre o cierra el <dialog> nativo según haya un producto seleccionado.
    effect(() => {
      const p = this.producto();
      const d = this.dlg()?.nativeElement;
      if (!d) return;
      untracked(() => {
        if (p) {
          const primera = p.presentaciones.find(x => x.stock > 0) ?? p.presentaciones[0];
          this.selId.set(primera?.id ?? '');
          this.cant.set(1);
          if (!d.open) d.showModal();
        } else if (d.open) {
          d.close();
        }
      });
    });
  }

  cerrar(): void { this.dlg()?.nativeElement.close(); }

  clicFuera(e: MouseEvent): void {
    if (e.target === this.dlg()?.nativeElement) this.cerrar();
  }

  cambiarCantidad(valor: string): void { this.cant.set(parseInt(valor, 10) || 1); }

  agregar(): void {
    const p = this.producto(); const s = this.actual();
    if (!p || !s) return;
    this.carrito.agregar(p, s, this.cantEfectiva());
    this.avisos.mostrar(`${p.nombre} (${s.etiqueta}) agregado al carrito`);
    this.cerrar();
  }
}
