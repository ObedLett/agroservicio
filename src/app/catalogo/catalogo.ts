import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { CarritoService } from '../carrito.service';
import { NEGOCIO } from '../firebase.config';
import { DineroPipe } from '../dinero.pipe';
import {
  Producto, colorCategoria, nombreCategoria, norm, precioDesde, stockTotal
} from '../models';
import { DetalleProducto } from './detalle-producto';
import { Carrito } from './carrito';

@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, DineroPipe, DetalleProducto, Carrito],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo {
  private readonly fb = inject(FirebaseService);
  readonly carrito = inject(CarritoService);

  readonly negocio = NEGOCIO;
  readonly telefonoLimpio = NEGOCIO.telefono.replace(/[^\d+]/g, '');
  readonly stockTotal = stockTotal;
  readonly precioDesde = precioDesde;
  readonly nombreCategoria = nombreCategoria;
  readonly colorCategoria = colorCategoria;

  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);

  // Filtros
  readonly texto = signal('');
  readonly categoria = signal('');
  readonly ingrediente = signal('');
  readonly soloDisponibles = signal(false);

  readonly seleccionado = signal<Producto | null>(null);

  readonly categoriasLista = computed(() => {
    const conteo: Record<string, number> = {};
    this.productos().forEach(p => { conteo[p.categoria] = (conteo[p.categoria] ?? 0) + 1; });
    return [
      { id: '', nombre: 'Todas', n: this.productos().length },
      ...Object.keys(conteo).sort().map(id => ({ id, nombre: nombreCategoria(id), n: conteo[id] }))
    ];
  });

  readonly ingredientes = computed(() =>
    [...new Set(this.productos().map(p => p.ingredienteActivo.trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es')));

  readonly filtrados = computed(() => {
    const palabras = norm(this.texto()).trim().split(/\s+/).filter(Boolean);
    const cat = this.categoria();
    const ing = norm(this.ingrediente());
    const soloDisp = this.soloDisponibles();
    return this.productos().filter(p => {
      if (cat && p.categoria !== cat) return false;
      if (ing && norm(p.ingredienteActivo) !== ing) return false;
      if (soloDisp && stockTotal(p) <= 0) return false;
      if (palabras.length) {
        const pajar = norm([p.nombre, p.marca, p.ingredienteActivo, p.descripcion, nombreCategoria(p.categoria)].join(' '));
        return palabras.every(w => pajar.includes(w));
      }
      return true;
    });
  });

  constructor() {
    const desuscribir = this.fb.escucharCatalogo(
      lista => {
        this.productos.set(lista);
        this.carrito.catalogo.set(lista);
        this.carrito.ajustar();
        this.cargando.set(false);
        this.error.set(false);
      },
      e => { console.error(e); this.cargando.set(false); this.error.set(true); }
    );
    inject(DestroyRef).onDestroy(desuscribir);
  }

  valor(e: Event): string { return (e.target as HTMLInputElement).value; }
  marcado(e: Event): boolean { return (e.target as HTMLInputElement).checked; }

  limpiar(): void {
    this.texto.set(''); this.categoria.set(''); this.ingrediente.set(''); this.soloDisponibles.set(false);
  }

  inicial(p: Producto): string { return (p.nombre || '?').trim().charAt(0).toUpperCase(); }

  /** Texto y estilo de la etiqueta que aparece sobre la ficha de cada producto. */
  estadoTarjeta(p: Producto): { texto: string; clase: '' | 'agotado' | 'pocas' } {
    const total = stockTotal(p);
    if (total <= 0) return { texto: 'Agotado', clase: 'agotado' };
    const enStock = p.presentaciones.filter(x => x.stock > 0);
    const pocas = enStock.every(x => x.stock <= (Number(x.stockMinimo) || 0));
    return pocas ? { texto: 'Pocas unidades', clase: 'pocas' } : { texto: 'Disponible', clase: '' };
  }

}
