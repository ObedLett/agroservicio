import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CarritoService, LineaCarrito } from '../carrito.service';
import { FirebaseService } from '../firebase.service';
import { NEGOCIO } from '../firebase.config';
import { DineroPipe } from '../dinero.pipe';
import { ItemPedido } from '../models';

const VACIO = { nombre: '', telefono: '', email: '', municipio: '', notas: '' };

@Component({
  selector: 'app-carrito',
  imports: [FormsModule, DineroPipe],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
  host: { '(document:keydown.escape)': 'alEscape()' }
})
export class Carrito {
  readonly carrito = inject(CarritoService);
  private readonly fb = inject(FirebaseService);

  readonly negocio = NEGOCIO;

  datos = { ...VACIO };
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly codigo = signal<string | null>(null);

  readonly clave = (l: LineaCarrito) => l.productoId + '|' + l.presentacionId;

  cerrar(): void { this.carrito.abierto.set(false); }
  alEscape(): void { if (this.carrito.abierto()) this.cerrar(); }

  seguir(): void { this.codigo.set(null); this.cerrar(); }

  enlaceWhatsapp(): string {
    const msg = `Hola, envié la cotización ${this.codigo()} desde el catálogo de ${NEGOCIO.nombre}.`;
    return `https://wa.me/${NEGOCIO.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  async enviar(e: Event): Promise<void> {
    e.preventDefault();
    this.error.set('');
    const d = this.datos;
    const nombre = d.nombre.trim(), telefono = d.telefono.trim(), email = d.email.trim();
    if (nombre.length < 3) return this.error.set('Escriba su nombre completo.');
    if (telefono.replace(/\D/g, '').length < 8) return this.error.set('Escriba un teléfono válido de al menos 8 dígitos.');
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return this.error.set('El correo no parece válido. Corríjalo o déjelo en blanco.');

    const lineas = this.carrito.lineas();
    if (!lineas.length) return this.error.set('Su carrito está vacío.');

    const items: ItemPedido[] = lineas.map(l => {
      const precio = Number(l.presentacion.precio) || 0;
      return {
        productoId: l.productoId, nombre: l.producto.nombre,
        presentacionId: l.presentacionId, presentacion: l.presentacion.etiqueta,
        cantidad: l.cantidad, precioUnitario: precio,
        subtotal: Math.round(precio * l.cantidad * 100) / 100
      };
    });

    this.enviando.set(true);
    try {
      const id = await this.fb.crearPedido({
        cliente: { nombre, telefono, email, municipio: d.municipio.trim() },
        items,
        total: Math.round(items.reduce((a, i) => a + i.subtotal, 0) * 100) / 100,
        notas: d.notas.trim()
      });
      this.codigo.set(id.slice(0, 6).toUpperCase());
      this.carrito.vaciar();
      this.datos = { ...VACIO };
    } catch (err) {
      console.error(err);
      this.error.set('No se pudo enviar la cotización. Revise su conexión e inténtelo de nuevo.');
    } finally {
      this.enviando.set(false);
    }
  }
}
