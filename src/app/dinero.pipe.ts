import { Pipe, PipeTransform } from '@angular/core';
import { NEGOCIO } from './firebase.config';

const formato = new Intl.NumberFormat(NEGOCIO.locale, { style: 'currency', currency: NEGOCIO.moneda });

export const dinero = (n: number | null | undefined): string => formato.format(n ?? 0);

@Pipe({ name: 'dinero' })
export class DineroPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return dinero(valor);
  }
}
