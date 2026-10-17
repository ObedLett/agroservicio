import type { Timestamp } from 'firebase/firestore';

export interface Presentacion {
  id: string;
  etiqueta: string;
  sku: string;
  precio: number;
  stock: number;
  stockMinimo: number;
}

export interface Producto {
  id?: string;
  nombre: string;
  categoria: string;
  marca: string;
  ingredienteActivo: string;
  descripcion: string;
  imagenUrl: string;
  activo: boolean;
  presentaciones: Presentacion[];
}

export type EstadoPedido = 'nuevo' | 'en_revision' | 'cotizado' | 'completado' | 'cancelado';

export interface Cliente { nombre: string; telefono: string; email: string; municipio: string; }

export interface ItemPedido {
  productoId: string;
  nombre: string;
  presentacionId: string;
  presentacion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Pedido {
  id: string;
  cliente: Cliente;
  items: ItemPedido[];
  total: number;
  notas: string;
  estado: EstadoPedido;
  notaInterna: string;
  creadoEn: Timestamp | null;
}

export interface NuevoPedido { cliente: Cliente; items: ItemPedido[]; total: number; notas: string; }

export const CATEGORIAS: Record<string, { nombre: string; color: string }> = {
  fertilizantes: { nombre: 'Fertilizantes', color: '#35703F' },
  herbicidas: { nombre: 'Herbicidas', color: '#8A6D1F' },
  insecticidas: { nombre: 'Insecticidas', color: '#9A4A2F' },
  fungicidas: { nombre: 'Fungicidas', color: '#4F5F8A' },
  semillas: { nombre: 'Semillas', color: '#6B7F2A' },
  herramientas: { nombre: 'Herramientas', color: '#4A4F55' }
};

export const ESTADOS: Record<EstadoPedido, { nombre: string; color: string }> = {
  nuevo: { nombre: 'Nuevo', color: '#B3261E' },
  en_revision: { nombre: 'En revisión', color: '#C28A00' },
  cotizado: { nombre: 'Cotizado', color: '#3A63A8' },
  completado: { nombre: 'Completado', color: '#2D6A3E' },
  cancelado: { nombre: 'Cancelado', color: '#7B817A' }
};

export type EstadoStock = 'ok' | 'bajo' | 'agotado';
export const TXT_STOCK: Record<EstadoStock, string> = { ok: 'Correcto', bajo: 'Stock bajo', agotado: 'Agotado' };

export interface AlertaStock { producto: Producto; presentacion: Presentacion; estado: EstadoStock; }

export const nombreCategoria = (id: string) => CATEGORIAS[id]?.nombre ?? (id || 'Otros');
export const colorCategoria = (id: string) => CATEGORIAS[id]?.color ?? '#4A4F55';

export const norm = (s: unknown): string =>
  String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const stockTotal = (p: Producto): number =>
  p.presentaciones.reduce((a, x) => a + (Number(x.stock) || 0), 0);

export const precioDesde = (p: Producto): number =>
  Math.min(...p.presentaciones.map(x => Number(x.precio) || 0));

export const estadoStock = (s: Presentacion): EstadoStock => {
  const st = Number(s.stock) || 0;
  return st <= 0 ? 'agotado' : st <= (Number(s.stockMinimo) || 0) ? 'bajo' : 'ok';
};

export const alertasStock = (productos: Producto[]): AlertaStock[] =>
  productos
    .filter(p => p.activo)
    .flatMap(p => p.presentaciones
      .map(s => ({ producto: p, presentacion: s, estado: estadoStock(s) }))
      .filter(a => a.estado !== 'ok'));

export const formatearFecha = (ts: Timestamp | null, locale: string): string =>
  ts?.toDate ? ts.toDate().toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : 'Enviando…';
