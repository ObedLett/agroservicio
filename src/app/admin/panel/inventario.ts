import { Component, computed, inject, input, signal, viewChild } from '@angular/core';
import { AvisoService } from '../../aviso.service';
import { FirebaseService } from '../../firebase.service';
import { DineroPipe } from '../../dinero.pipe';
import {
  Presentacion, Producto, TXT_STOCK, alertasStock, estadoStock, nombreCategoria, norm
} from '../../models';
import { EditorProducto } from './editor-producto';

@Component({
  selector: 'app-inventario',
  imports: [DineroPipe, EditorProducto],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css'
})
export class Inventario {
  private readonly fb = inject(FirebaseService);
  private readonly avisos = inject(AvisoService);

  readonly productos = input.required<Producto[]>();
  readonly editor = viewChild.required(EditorProducto);

  readonly nombreCategoria = nombreCategoria;
  readonly estadoStock = estadoStock;
  readonly TXT_STOCK = TXT_STOCK;

  readonly texto = signal('');
  readonly categoria = signal('');
  readonly soloBajo = signal(false);

  readonly categorias = computed(() =>
    [...new Set(this.productos().map(p => p.categoria).filter(Boolean))].sort());

  readonly ingredientes = computed(() =>
    [...new Set(this.productos().map(p => p.ingredienteActivo).filter(Boolean))]);

  readonly alertas = computed(() => alertasStock(this.productos()));

  readonly visibles = computed(() => {
    const palabras = norm(this.texto()).trim().split(/\s+/).filter(Boolean);
    const cat = this.categoria();
    return this.productos().filter(p => {
      if (cat && p.categoria !== cat) return false;
      if (this.soloBajo() && !p.presentaciones.some(s => estadoStock(s) !== 'ok')) return false;
      if (palabras.length) {
        const pajar = norm([p.nombre, p.marca, p.ingredienteActivo, ...p.presentaciones.map(s => s.sku)].join(' '));
        return palabras.every(w => pajar.includes(w));
      }
      return true;
    });
  });

  valor(e: Event): string { return (e.target as HTMLInputElement).value; }
  marcado(e: Event): boolean { return (e.target as HTMLInputElement).checked; }

  abrir(p: Producto | null): void { this.editor().abrir(p); }

  async ajustar(p: Producto, s: Presentacion, delta: number): Promise<void> {
    await this.cambiar(p, s, x => x + delta);
  }

  async fijar(p: Producto, s: Presentacion, valor: string): Promise<void> {
    const n = Math.max(0, parseInt(valor, 10) || 0);
    await this.cambiar(p, s, () => n);
  }

  private async cambiar(p: Producto, s: Presentacion, fn: (n: number) => number): Promise<void> {
    try { await this.fb.cambiarStock(p.id!, s.id, fn); }
    catch (err) {
      console.error(err);
      this.avisos.mostrar((err as Error).message || 'No se pudo actualizar la existencia.', 'mal');
    }
  }

  async eliminar(p: Producto): Promise<void> {
    const ok = confirm(`¿Eliminar "${p.nombre}" del inventario? Esta acción no se puede deshacer.\n\nSi solo desea ocultarlo del catálogo, edítelo y desmarque "Visible en el catálogo".`);
    if (!ok) return;
    try { await this.fb.eliminarProducto(p.id!); this.avisos.mostrar('Producto eliminado.'); }
    catch (err) { console.error(err); this.avisos.mostrar('No se pudo eliminar el producto.', 'mal'); }
  }

  async cargarEjemplos(): Promise<void> {
    try { await this.fb.cargarEjemplos(); this.avisos.mostrar('Productos de ejemplo cargados.'); }
    catch (err) { console.error(err); this.avisos.mostrar('No se pudieron cargar los ejemplos.', 'mal'); }
  }
}
