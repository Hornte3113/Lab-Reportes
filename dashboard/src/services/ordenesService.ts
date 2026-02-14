
import { query } from '@/lib/db';
import { EstadoOrden } from '@/lib/definitions';


export async function getEstadoOrdenes(): Promise<EstadoOrden[]> {
  try {
    const result = await query(
      'SELECT * FROM view_estado_ordenes ORDER BY prioridad ASC'
    );
    return result.rows as EstadoOrden[];
  } catch (error) {
    console.error('Error en getEstadoOrdenes:', error);
    throw new Error('No se pudo obtener el estado de las órdenes');
  }
}

export function calcularKPIsOrdenes(datos: EstadoOrden[]) {
  const totalDinero = datos.reduce(
    (acc, row) => acc + Number(row.valor_total),
    0
  );

  const totalOrdenes = datos.reduce(
    (acc, row) => acc + Number(row.cantidad_ordenes),
    0
  );

  const ordenesActivas = datos
    .filter((row) => row.status !== 'entregado' && row.status !== 'cancelado')
    .reduce((acc, row) => acc + Number(row.cantidad_ordenes), 0);

  return {
    totalDinero,
    totalOrdenes,
    ordenesActivas,
  };
}
