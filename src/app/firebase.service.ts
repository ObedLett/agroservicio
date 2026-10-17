import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, orderBy, query,
  runTransaction, serverTimestamp, updateDoc, where, writeBatch,
  type QueryDocumentSnapshot, type Unsubscribe
} from 'firebase/firestore';
import { firebaseConfig } from './firebase.config';
import { EJEMPLOS } from './ejemplos';
import type { EstadoPedido, NuevoPedido, Pedido, Presentacion, Producto } from './models';

/** Único punto de contacto con Firebase: ningún componente importa el SDK directamente. */
@Injectable({ providedIn: 'root' })
export class FirebaseService {
  private readonly app = initializeApp(firebaseConfig);
  private readonly db = getFirestore(this.app);
  private readonly auth = getAuth(this.app);

  readonly usuario = signal<User | null>(null);
  /** Se resuelve cuando Firebase ya sabe si hay una sesión iniciada (lo usa el guard). */
  readonly sesionLista: Promise<void> = new Promise(resolve => {
    onAuthStateChanged(this.auth, u => { this.usuario.set(u); resolve(); });
  });

  // ---------- Conversión de documentos ----------
  private aProducto(d: QueryDocumentSnapshot): Producto {
    const x = d.data();
    return {
      id: d.id,
      nombre: x['nombre'] ?? '',
      categoria: x['categoria'] ?? '',
      marca: x['marca'] ?? '',
      ingredienteActivo: x['ingredienteActivo'] ?? '',
      descripcion: x['descripcion'] ?? '',
      imagenUrl: x['imagenUrl'] ?? '',
      activo: x['activo'] !== false,
      presentaciones: Array.isArray(x['presentaciones']) ? x['presentaciones'] : []
    };
  }

  private aPedido(d: QueryDocumentSnapshot): Pedido {
    const x = d.data();
    return {
      id: d.id,
      cliente: x['cliente'] ?? { nombre: '', telefono: '', email: '', municipio: '' },
      items: x['items'] ?? [],
      total: x['total'] ?? 0,
      notas: x['notas'] ?? '',
      estado: x['estado'] ?? 'nuevo',
      notaInterna: x['notaInterna'] ?? '',
      creadoEn: x['creadoEn'] ?? null
    };
  }

  // ---------- Lecturas en tiempo real ----------
  escucharCatalogo(ok: (p: Producto[]) => void, error: (e: unknown) => void): Unsubscribe {
    const q = query(collection(this.db, 'productos'), where('activo', '==', true));
    return onSnapshot(q, snap => {
      ok(snap.docs.map(d => this.aProducto(d)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
    }, error);
  }

  escucharInventario(ok: (p: Producto[]) => void, error: (e: unknown) => void): Unsubscribe {
    const q = query(collection(this.db, 'productos'), orderBy('nombre'));
    return onSnapshot(q, snap => ok(snap.docs.map(d => this.aProducto(d))), error);
  }

  escucharPedidos(
    ok: (p: Pedido[]) => void,
    nuevo: (p: Pedido) => void,
    error: (e: unknown) => void
  ): Unsubscribe {
    let primero = true;
    const q = query(collection(this.db, 'pedidos'), orderBy('creadoEn', 'desc'));
    return onSnapshot(q, snap => {
      if (!primero) {
        snap.docChanges().forEach(c => {
          if (c.type === 'added' && !c.doc.metadata.hasPendingWrites) nuevo(this.aPedido(c.doc));
        });
      }
      primero = false;
      ok(snap.docs.map(d => this.aPedido(d)));
    }, error);
  }

  // ---------- Escrituras ----------
  async crearPedido(p: NuevoPedido): Promise<string> {
    const ref = await addDoc(collection(this.db, 'pedidos'), {
      ...p,
      estado: 'nuevo',
      notaInterna: '',
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp()
    });
    return ref.id;
  }

  async guardarProducto(p: Producto): Promise<void> {
    const { id, ...datos } = p;
    if (id) {
      await updateDoc(doc(this.db, 'productos', id), { ...datos, actualizadoEn: serverTimestamp() });
    } else {
      await addDoc(collection(this.db, 'productos'), {
        ...datos, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp()
      });
    }
  }

  eliminarProducto(id: string): Promise<void> {
    return deleteDoc(doc(this.db, 'productos', id));
  }

  /** Cambia el stock dentro de una transacción para que dos empleados no se pisen. */
  async cambiarStock(productoId: string, presId: string, fn: (actual: number) => number): Promise<void> {
    const ref = doc(this.db, 'productos', productoId);
    await runTransaction(this.db, async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('El producto ya no existe.');
      const pres: Presentacion[] = snap.data()['presentaciones'] ?? [];
      tx.update(ref, {
        presentaciones: pres.map(x => x.id === presId
          ? { ...x, stock: Math.max(0, Math.round(fn(Number(x.stock) || 0))) }
          : x),
        actualizadoEn: serverTimestamp()
      });
    });
  }

  actualizarPedido(id: string, cambios: { estado?: EstadoPedido; notaInterna?: string }): Promise<void> {
    return updateDoc(doc(this.db, 'pedidos', id), { ...cambios, actualizadoEn: serverTimestamp() });
  }

  async cargarEjemplos(): Promise<void> {
    const lote = writeBatch(this.db);
    EJEMPLOS.forEach(e => lote.set(doc(collection(this.db, 'productos')), {
      ...e, creadoEn: serverTimestamp(), actualizadoEn: serverTimestamp()
    }));
    await lote.commit();
  }

  // ---------- Sesión ----------
  async login(email: string, clave: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, clave);
  }

  logout(): Promise<void> {
    return signOut(this.auth);
  }
}
