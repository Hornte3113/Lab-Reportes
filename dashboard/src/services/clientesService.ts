import { z } from 'zod';
import { query } from '@/lib/db';
import { ClasificacionCliente } from '@/lib/definitions';


export const PaginacionClientesSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10), 
});

export type PaginacionClientes = z.infer<typeof PaginacionClientesSchema>;

export interface ClientesPaginados {
  clientes: ClasificacionCliente[];
  totalClientes: number;
  totalPages: number;
  currentPage: number;
}


export async function getClasificacionClientes(
  paginacion: PaginacionClientes
): Promise<ClientesPaginados> {
  try {
    const { page, limit } = paginacion;
    const offset = (page - 1) * limit;

    const [clientesRes, totalRes] = await Promise.all([
      query(
        `SELECT * FROM view_clasificacion_clientes
         ORDER BY gasto_total DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) as total FROM view_clasificacion_clientes'),
    ]);

    const clientes = clientesRes.rows as ClasificacionCliente[];
    const totalClientes = Number(totalRes.rows[0].total);
    const totalPages = Math.ceil(totalClientes / limit);

    return {
      clientes,
      totalClientes,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error en getClasificacionClientes:', error);
    throw new Error('No se pudieron obtener los clientes');
  }
}

export async function getClientesStats() {
  try {
    const res = await query(`
      SELECT 
        COALESCE(SUM(gasto_total), 0) as total_ingresos,
        -- Contamos VIPs usando CASE condicional dentro del COUNT
        COUNT(CASE WHEN segmento_cliente = 'VIP' THEN 1 END) as vip_count
      FROM view_clasificacion_clientes
    `);

    return {
      totalIngresos: Number(res.rows[0].total_ingresos),
      clientesVIP: Number(res.rows[0].vip_count),
    };
  } catch (error) {
    console.error('Error obteniendo stats de clientes:', error);
    return { totalIngresos: 0, clientesVIP: 0 };
  }
}