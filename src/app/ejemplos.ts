import type { Presentacion, Producto } from './models';

const P = (id: string, etiqueta: string, sku: string, precio: number, stock: number, stockMinimo: number): Presentacion =>
  ({ id, etiqueta, sku, precio, stock, stockMinimo });

const E = (nombre: string, categoria: string, marca: string, ingredienteActivo: string, descripcion: string,
  presentaciones: Presentacion[]): Omit<Producto, 'id'> =>
  ({ nombre, categoria, marca, ingredienteActivo, descripcion, imagenUrl: '', activo: true, presentaciones });

export const EJEMPLOS: Omit<Producto, 'id'>[] = [
  E('Urea 46%', 'fertilizantes', 'AgroNutri', 'Nitrógeno (N) 46%', 'Fertilizante nitrogenado granulado para maíz, caña, hortalizas y pastos.',
    [P('p1', 'Saco 46 kg', 'UREA-46K', 34.5, 40, 8), P('p2', 'Bolsa 5 kg', 'UREA-5K', 4.25, 3, 10)]),
  E('Fórmula 15-15-15', 'fertilizantes', 'AgroNutri', 'Nitrógeno-Fósforo-Potasio 15-15-15', 'Fertilizante completo para fertilización de fondo.',
    [P('p1', 'Saco 46 kg', 'NPK-15K', 39, 25, 8)]),
  E('Glifosato 480 SL', 'herbicidas', 'CampoVerde', 'Glifosato', 'Herbicida sistémico no selectivo para el control de malezas.',
    [P('p1', 'Litro', 'GLI-1L', 7.8, 30, 10), P('p2', 'Galón', 'GLI-GAL', 26, 0, 4)]),
  E('Cipermetrina 25 EC', 'insecticidas', 'CampoVerde', 'Cipermetrina', 'Insecticida piretroide de contacto e ingestión.',
    [P('p1', '250 ml', 'CIP-250', 5.5, 18, 6), P('p2', 'Litro', 'CIP-1L', 16.9, 9, 4)]),
  E('Mancozeb 80 WP', 'fungicidas', 'CampoVerde', 'Mancozeb', 'Fungicida protectante de amplio espectro.',
    [P('p1', 'Bolsa 1 kg', 'MAN-1K', 9.75, 14, 5)]),
  E('Machete 24 pulgadas', 'herramientas', 'Tramontina', '', 'Machete de acero al carbono con mango de polipropileno.',
    [P('p1', 'Unidad', 'MACH-24', 8.9, 12, 4)]),
  E('Bomba de mochila 20 L', 'herramientas', 'Jacto', '', 'Bomba aspersora manual de palanca, tanque de 20 litros.',
    [P('p1', 'Unidad', 'BOM-20L', 52, 2, 3)])
];
