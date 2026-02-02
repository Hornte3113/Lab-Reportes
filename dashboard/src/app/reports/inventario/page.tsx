import { query } from '@/lib/db';
import { z } from 'zod';
import Link from 'next/link';

// Forzar renderizado dinámico (no pre-renderizar en build)
export const dynamic = 'force-dynamic';

// Schema de validación con filtros donde usamos Zod + parametrizado)
const FilterSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(5).max(50).default(10),
  nivelStock: z.enum(['todos', 'Sin Stock', 'Crítico', 'Bajo', 'Normal', 'Alto']).default('todos'),
});

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  //  parámetros con Zod
  const { page, limit, nivelStock } = FilterSchema.parse(searchParams);
  const offset = (page - 1) * limit;

 
  const whereClause = nivelStock !== 'todos' 
    ? 'WHERE nivel_stock = $1' 
    : '';
  
  const params = nivelStock !== 'todos' 
    ? [nivelStock, limit, offset]
    : [limit, offset];

  const limitOffsetParams = nivelStock !== 'todos'
    ? '$2 OFFSET $3'
    : '$1 OFFSET $2';

  // 3. Ejecutar consultas en paralelo
  const [inventarioRes, totalRes] = await Promise.all([
    query(
      `SELECT * FROM view_inventario_rotacion 
       ${whereClause}
       ORDER BY tasa_rotacion DESC 
       LIMIT ${limitOffsetParams}`,
      params
    ),
    query(
      `SELECT COUNT(*) as total FROM view_inventario_rotacion ${whereClause}`,
      nivelStock !== 'todos' ? [nivelStock] : []
    )
  ]);

  const productos = inventarioRes.rows;
  const totalPages = Math.ceil(Number(totalRes.rows[0].total) / limit);
  const totalProductos = Number(totalRes.rows[0].total);

  // 4. Calcular KPIs
  const kpiValorTotal = productos.reduce(
    (acc: number, p: any) => acc + Number(p.valor_inventario), 
    0
  );

  const kpiStockTotal = productos.reduce(
    (acc: number, p: any) => acc + Number(p.stock_actual), 
    0
  );

  return (
    <div className="p-8 font-sans">
      {/* Navegación */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado */}
      <h1 className="text-3xl font-bold mb-2">Análisis de Rotación de Inventario</h1>
      <p className="text-gray-600 mb-8">
        Muestra el stock actual, unidades vendidas y el estado de rotación por producto.
      </p>

      {/* Formulario de Filtros */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <form method="GET" action="/reports/inventario" className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nivel de Stock
            </label>
            <select
              name="nivelStock"
              defaultValue={nivelStock}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="todos">Todos</option>
              <option value="Sin Stock">Sin Stock</option>
              <option value="Crítico">Crítico (&lt;10)</option>
              <option value="Bajo">Bajo (&lt;50)</option>
              <option value="Normal">Normal (50-100)</option>
              <option value="Alto">Alto (&gt;100)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resultados por página
            </label>
            <select
              name="limit"
              defaultValue={limit}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>

          {/*pa resetear página a 1 cuando se cambian filtros */}
          <input type="hidden" name="page" value="1" />

          <button
            type="submit"
            className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 font-medium"
          >
            Aplicar Filtros
          </button>

          <Link
            href="/reports/inventario"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
          >
            Limpiar
          </Link>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded shadow">
          <p className="text-sm text-emerald-700 font-bold uppercase mb-1">
            Valor Total en Inventario
          </p>
          <p className="text-3xl font-bold text-emerald-900">
            ${kpiValorTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-blue-700 font-bold uppercase mb-1">
            Total Unidades en Stock
          </p>
          <p className="text-3xl font-bold text-blue-900">
            {kpiStockTotal.toLocaleString('en-US')}
          </p>
        </div>
      </div>

      {/* Info de filtros */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {productos.length} de {totalProductos} productos
        {nivelStock !== 'todos' && ` (filtrados por nivel: ${nivelStock})`}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto shadow-md rounded-lg mb-6">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-center">Stock Actual</th>
              <th className="px-4 py-3 text-center">Unidades Vendidas</th>
              <th className="px-4 py-3 text-center">Tasa Rotación</th>
              <th className="px-4 py-3 text-right">Valor Inventario</th>
              <th className="px-4 py-3 text-center">Nivel Stock</th>
              <th className="px-4 py-3 text-center">Acción Recomendada</th>
            </tr>
          </thead>
          <tbody>
            {productos.length > 0 ? (
              productos.map((row: any) => (
                <tr key={row.producto_id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{row.producto}</p>
                      <p className="text-xs text-gray-500">{row.codigo} - {row.categoria}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">
                    {Number(row.stock_actual).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {Number(row.unidades_vendidas).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold
                      ${Number(row.tasa_rotacion) >= 1 ? 'bg-green-100 text-green-800' :
                        Number(row.tasa_rotacion) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}
                    `}>
                      {Number(row.tasa_rotacion).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    ${Number(row.valor_inventario).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${row.nivel_stock === 'Sin Stock' ? 'bg-red-100 text-red-800' :
                        row.nivel_stock === 'Crítico' ? 'bg-orange-100 text-orange-800' :
                        row.nivel_stock === 'Bajo' ? 'bg-yellow-100 text-yellow-800' :
                        row.nivel_stock === 'Normal' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {row.nivel_stock}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${row.accion_recomendada.includes('Urgente') ? 'bg-red-100 text-red-800' :
                        row.accion_recomendada === 'Reabastecer' ? 'bg-orange-100 text-orange-800' :
                        row.accion_recomendada === 'Promocionar' ? 'bg-purple-100 text-purple-800' :
                        row.accion_recomendada === 'Revisar Demanda' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}
                    `}>
                      {row.accion_recomendada}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron productos con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
          <span className="text-sm text-gray-700">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <div className="space-x-2">
            {page > 1 && (
              <Link 
                href={`/reports/inventario?page=${page - 1}&nivelStock=${nivelStock}&limit=${limit}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`/reports/inventario?page=${page + 1}&nivelStock=${nivelStock}&limit=${limit}`}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
              >
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Nota técnica */}
      <div className="mt-6 text-xs text-gray-500 italic">
        * Tasa de rotación = Unidades Vendidas / Stock Actual. 
        Valores &gt;1 indican alta rotación (producto popular).
      </div>
    </div>
  );
}