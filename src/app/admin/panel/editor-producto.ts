import { Component, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvisoService } from '../../aviso.service';
import { FirebaseService } from '../../firebase.service';
import { CATEGORIAS, Presentacion, Producto } from '../../models';

interface FilaPres {
  id: string; etiqueta: string; sku: string;
  precio: number | null; stock: number | null; stockMinimo: number | null;
}

interface Modelo {
  id?: string; nombre: string; categoria: string; marca: string; ingredienteActivo: string;
  descripcion: string; imagenUrl: string; activo: boolean; pres: FilaPres[];
}

let contador = 0;
const nuevoId = () => `p${Date.now().toString(36)}${(contador++).toString(36)}`;
const filaVacia = (): FilaPres => ({ id: nuevoId(), etiqueta: '', sku: '', precio: null, stock: 0, stockMinimo: 5 });

@Component({
  selector: 'app-editor-producto',
  imports: [FormsModule],
  templateUrl: './editor-producto.html',
  styleUrl: './editor-producto.css'
})
export class EditorProducto {
  private readonly fb = inject(FirebaseService);
  private readonly avisos = inject(AvisoService);

  readonly sugerencias = input<string[]>([]);
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');

  readonly categorias = Object.entries(CATEGORIAS).map(([id, c]) => ({ id, nombre: c.nombre }));
  readonly modelo = signal<Modelo>(this.vacio());
  readonly error = signal('');
  readonly guardando = signal(false);
  esNuevo = true;

  private vacio(): Modelo {
    return {
      nombre: '', categoria: 'fertilizantes', marca: '', ingredienteActivo: '',
      descripcion: '', imagenUrl: '', activo: true, pres: [filaVacia()]
    };
  }

  abrir(p: Producto | null): void {
    this.error.set('');
    this.esNuevo = !p;
    this.modelo.set(p ? {
      id: p.id, nombre: p.nombre, categoria: p.categoria, marca: p.marca,
      ingredienteActivo: p.ingredienteActivo, descripcion: p.descripcion, imagenUrl: p.imagenUrl,
      activo: p.activo, pres: p.presentaciones.map(s => ({ ...s }))
    } : this.vacio());
    this.dlg().nativeElement.showModal();
  }

  cerrar(): void { this.dlg().nativeElement.close(); }

  agregarFila(): void {
    this.modelo.update(m => ({ ...m, pres: [...m.pres, filaVacia()] }));
  }

  quitarFila(f: FilaPres): void {
    this.modelo.update(m => ({ ...m, pres: m.pres.filter(x => x !== f) }));
  }

  async guardar(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    const m = this.modelo();
    const nombre = m.nombre.trim();
    if (nombre.length < 2) return this.error.set('Escriba el nombre del producto.');
    if (!m.pres.length) return this.error.set('Agregue al menos una presentación.');

    const presentaciones: Presentacion[] = [];
    for (const [i, f] of m.pres.entries()) {
      const etiqueta = f.etiqueta.trim();
      const precio = Number(f.precio), stock = Number(f.stock), min = Number(f.stockMinimo);
      if (!etiqueta) return this.error.set(`La presentación ${i + 1} necesita un nombre.`);
      if (f.precio === null || !(precio >= 0)) return this.error.set(`La presentación "${etiqueta}" necesita un precio válido.`);
      if (f.stock === null || f.stockMinimo === null || !(stock >= 0) || !(min >= 0))
        return this.error.set(`La presentación "${etiqueta}" necesita existencia y mínimo válidos (0 o más).`);
      presentaciones.push({
        id: f.id, etiqueta, sku: f.sku.trim(),
        precio: Math.round(precio * 100) / 100, stock: Math.round(stock), stockMinimo: Math.round(min)
      });
    }

    this.guardando.set(true);
    try {
      await this.fb.guardarProducto({
        id: m.id, nombre, categoria: m.categoria, marca: m.marca.trim(),
        ingredienteActivo: m.ingredienteActivo.trim(), descripcion: m.descripcion.trim(),
        imagenUrl: m.imagenUrl.trim(), activo: m.activo, presentaciones
      });
      this.cerrar();
      this.avisos.mostrar(this.esNuevo ? 'Producto creado.' : 'Producto actualizado.');
    } catch (ex) {
      console.error(ex);
      this.error.set('No se pudo guardar. Revise su conexión y los permisos de Firestore.');
    } finally {
      this.guardando.set(false);
    }
  }
}
