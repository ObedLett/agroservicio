import { Component, computed, inject, input, signal } from '@angular/core';
import { AvisoService } from '../../aviso.service';
import { FirebaseService } from '../../firebase.service';
import { NEGOCIO } from '../../firebase.config';
import { DineroPipe } from '../../dinero.pipe';
import { ESTADOS, EstadoPedido, Pedido, formatearFecha } from '../../models';

@Component({
  selector: 'app-pedidos',
  imports: [DineroPipe],
  templateUrl: './pedidos.html',
  styleUrl: './pedidos.css'
})
export class Pedidos {
  private readonly fb = inject(FirebaseService);
  private readonly avisos = inject(AvisoService);

  readonly pedidos = input.required<Pedido[]>();
  readonly estados = (Object.keys(ESTADOS) as EstadoPedido[]).map(id => ({ id, ...ESTADOS[id] }));
  readonly filtro = signal<string>('');

  readonly chips = computed(() => [
    { id: '', nombre: 'Todos', n: this.pedidos().length },
    ...this.estados.map(e => ({ id: e.id as string, nombre: e.nombre, n: this.pedidos().filter(p => p.estado === e.id).length }))
  ]);

  readonly visibles = computed(() => this.pedidos().filter(p => !this.filtro() || p.estado === this.filtro()));

  codigo(p: Pedido): string { return p.id.slice(0, 6).toUpperCase(); }
  fecha(p: Pedido): string { return formatearFecha(p.creadoEn, NEGOCIO.locale); }
  color(p: Pedido): string { return ESTADOS[p.estado]?.color ?? '#7B817A'; }
  telLimpio(p: Pedido): string { return p.cliente.telefono.replace(/[^\d+]/g, ''); }
  valor(e: Event): string { return (e.target as HTMLInputElement).value; }

  whatsapp(p: Pedido): string {
    let dig = p.cliente.telefono.replace(/\D/g, '');
    if (!dig) return '';
    if (dig.length === 8) dig = '503' + dig;
    const msg = `Hola ${p.cliente.nombre}, le escribimos de ${NEGOCIO.nombre} sobre su cotización ${this.codigo(p)}.`;
    return `https://wa.me/${dig}?text=${encodeURIComponent(msg)}`;
  }

  async cambiarEstado(p: Pedido, estado: string, select: HTMLSelectElement): Promise<void> {
    try {
      await this.fb.actualizarPedido(p.id, { estado: estado as EstadoPedido });
      this.avisos.mostrar(`Pedido marcado como ${ESTADOS[estado as EstadoPedido].nombre.toLowerCase()}.`);
    } catch (err) {
      console.error(err);
      this.avisos.mostrar('No se pudo cambiar el estado.', 'mal');
      select.value = p.estado;
    }
  }

  async guardarNota(p: Pedido, nota: string): Promise<void> {
    try { await this.fb.actualizarPedido(p.id, { notaInterna: nota.trim() }); this.avisos.mostrar('Nota guardada.'); }
    catch (err) { console.error(err); this.avisos.mostrar('No se pudo guardar la nota.', 'mal'); }
  }
}
