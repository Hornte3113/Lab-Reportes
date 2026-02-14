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
  
  const pipelineActivo = datos
    .filter(d => ['pendiente', 'pagado', 'enviado'].includes(d.status))
    .reduce((acc, row) => acc + Number(row.valor_total), 0);

  const ventasCerradas = datos
    .find(d => d.status === 'entregado')?.valor_total || 0;

  const dineroCancelado = datos
    .find(d => d.status === 'cancelado')?.valor_total || 0;

  return {
    pipelineActivo,
    ventasCerradas: Number(ventasCerradas),
    dineroCancelado: Number(dineroCancelado)
  };
}