import Link from 'next/link';
import { productosService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function TopProductosPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Validar parámetros con Zod (SEGURIDAD)
  const filtros = productosService.FiltroProductosSchema.parse(searchParams);
  const { minVentas, page, limit } = filtros;

  // Obtener datos desde el servicio (backend)
  const { productos, totalProductos, totalPages } =
    await productosService.getTopProductos(filtros);

  // Calcular KPIs usando la lógica del servicio
  const { totalVendido, totalIngresos, top3 } =
    productosService.calcularKPIsProductos(productos);

  return (
    <div className="p-8 font-sans">
      {/* Navegación */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado */}
      <h1 className="text-3xl font-bold mb-2">Top Productos por Ventas</h1>
      <p className="text-gray-600 mb-8">
        Ranking de productos más exitosos con métricas de rendimiento.
      </p>

      {/* Formulario de Filtros con Zod */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8">
        <form method="GET" action="/reports/top-productos" className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mínimo Unidades Vendidas
            </label>
            <input
              name="minVentas"
              type="number"
              min="0"
              defaultValue={minVentas}
              className="border border-gray-300 rounded px-3 py-2 w-40"
              placeholder="0"
            />
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


          <input type="hidden" name="page" value="1" />

          <button
            type="submit"
            className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-700 font-medium"
          >
            Aplicar Filtros
          </button>
          
          <Link
            href="/reports/top-productos"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
          >
            Limpiar
          </Link>
        </form>
      </div>

      {/* KPIs Destacados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded shadow">
          <p className="text-sm text-indigo-700 font-bold uppercase mb-1">
            Total Unidades (Página Actual)
          </p>
          <p className="text-3xl font-bold text-indigo-900">
            {totalVendido.toLocaleString('en-US')}
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-green-700 font-bold uppercase mb-1">
            Ingresos Generados (Página Actual)
          </p>
          <p className="text-3xl font-bold text-green-900">
            ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Top 3 Highlight */}
      {top3.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            Top 3 Productos en esta vista:
          </p>
          <div className="flex gap-4 flex-wrap">
            {top3.map((p, idx) => (
              <div key={p.producto_id} className="flex items-center gap-2">
                <span className="text-2xl">{['1', '2', '3'][idx]}</span>
                <div>
                  <p className="font-bold text-gray-800">{p.producto}</p>
                  <p className="text-xs text-gray-600">
                    {Number(p.unidades_vendidas).toLocaleString()} unidades
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de paginación */}
      <div className="mb-4 text-sm text-gray-600">
        Mostrando {productos.length} de {totalProductos} productos 
        {minVentas > 0 && ` (filtrados por mínimo ${minVentas} unidades)`}
      </div>

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto shadow-md rounded-lg mb-6">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-center">Ranking</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-center">Unidades</th>
              <th className="px-4 py-3 text-right">Ingresos</th>
              <th className="px-4 py-3 text-center">Órdenes</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">% Acum.</th>
            </tr>
          </thead>
          <tbody>
            {productos.length > 0 ? (
              productos.map((producto) => (
                <tr 
                  key={producto.producto_id} 
                  className="bg-white border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold
                      ${producto.ranking_ventas <= 3 ? 'bg-yellow-500' : 
                        producto.ranking_ventas <= 10 ? 'bg-blue-500' : 'bg-gray-400'}
                    `}>
                      {producto.ranking_ventas}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{producto.producto}</p>
                      <p className="text-xs text-gray-500">{producto.codigo}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">
                    {Number(producto.unidades_vendidas).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    ${Number(producto.ingresos_generados).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {Number(producto.ordenes_incluido).toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-4 text-right font-mono">
                    ${Number(producto.precio_actual).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-semibold
                      ${producto.stock_actual === 0 ? 'bg-red-100 text-red-800' :
                        producto.stock_actual < 10 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}
                    `}>
                      {Number(producto.stock_actual).toLocaleString('en-US')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center font-mono text-xs">
                    {Number(producto.pct_acumulado).toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron productos con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
          <span className="text-sm text-gray-700">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <div className="space-x-2">
            {page > 1 && (
              <Link 
                href={`/reports/top-productos?page=${page - 1}&minVentas=${minVentas}&limit=${limit}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
              >
                ← Anterior
              </Link>
            )}
            {page < totalPages && (
              <Link 
                href={`/reports/top-productos?page=${page + 1}&minVentas=${minVentas}&limit=${limit}`}
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
        Ranking basado en unidades vendidas. % Acumulado muestra la contribución acumulada al total de ingresos (Análisis de Pareto).
      </div>
    </div>
  );
}