import { Injectable, computed, effect, signal } from '@angular/core';
import type { Presentacion, Producto } from './models';

interface Guardada { productoId: string; presentacionId: string; cantidad: number; }

export interface LineaCarrito extends Guardada { producto: Producto; presentacion: Presentacion; }

const CLAVE = 'agro_carrito';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  readonly abierto = signal(false);
  /** Catálogo vivo: la página del catálogo lo actualiza para que precios y stock estén al día. */
  readonly catalogo = signal<Producto[]>([]);
  /** Se incrementa cada vez que se agrega algo; el contador de la cabecera lo usa para animarse. */
  readonly ultimoAgregado = signal(0);

  private readonly guardadas = signal<Guardada[]>(this.leer());

  readonly lineas = computed<LineaCarrito[]>(() => {
    const cat = this.catalogo();
    return this.guardadas().flatMap(g => {
      const producto = cat.find(x => x.id === g.productoId);
      const presentacion = producto?.presentaciones.find(x => x.id === g.presentacionId);
      return producto && presentacion ? [{ ...g, producto, presentacion }] : [];
    });
  });

  readonly cantidadTotal = computed(() => this.lineas().reduce((a, l) => a + l.cantidad, 0));
  readonly total = computed(() => this.lineas().reduce((a, l) => a + (Number(l.presentacion.precio) || 0) * l.cantidad, 0));

  constructor() {
    effect(() => {
      const datos = JSON.stringify(this.guardadas());
      try { localStorage.setItem(CLAVE, datos); } catch { /* almacenamiento no disponible */ }
    });
  }

  private leer(): Guardada[] {
    try { return JSON.parse(localStorage.getItem(CLAVE) ?? '[]'); } catch { return []; }
  }

  agregar(p: Producto, s: Presentacion, cantidad: number): void {
    const max = Number(s.stock) || 0;
    this.guardadas.update(ls => {
      const ex = ls.find(l => l.productoId === p.id && l.presentacionId === s.id);
      if (ex) return ls.map(l => l === ex ? { ...l, cantidad: Math.min(max, l.cantidad + cantidad) } : l);
      return [...ls, { productoId: p.id ?? '', presentacionId: s.id, cantidad: Math.min(max, cantidad) }];
    });
    this.ultimoAgregado.update(n => n + 1);
  }

  cambiar(l: LineaCarrito, delta: number): void {
    this.guardadas.update(ls => ls.map(x =>
      x.productoId === l.productoId && x.presentacionId === l.presentacionId
        ? { ...x, cantidad: Math.min(l.presentacion.stock, Math.max(1, x.cantidad + delta)) }
        : x));
  }

  quitar(l: LineaCarrito): void {
    this.guardadas.update(ls => ls.filter(x => !(x.productoId === l.productoId && x.presentacionId === l.presentacionId)));
  }

  vaciar(): void {
    this.guardadas.set([]);
  }

  /** Quita lo que ya no existe o está agotado y limita cada cantidad al stock actual. */
  ajustar(): void {
    this.guardadas.set(this.lineas()
      .filter(l => l.presentacion.stock > 0)
      .map(l => ({
        productoId: l.productoId,
        presentacionId: l.presentacionId,
        cantidad: Math.min(l.cantidad, l.presentacion.stock)
      })));
  }
}
