import Link from 'next/link';
import { clientesService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function ReporteClientes(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;

  const paginacion = clientesService.PaginacionClientesSchema.parse(searchParams);
  const { page, limit } = paginacion;

  const [datosPaginados, statsGlobales] = await Promise.all([
    clientesService.getClasificacionClientes(paginacion),
    clientesService.getClientesStats()
  ]);

  const { clientes, totalPages } = datosPaginados;
  const { totalIngresos, clientesVIP } = statsGlobales;

  return (
    <div className="p-8 font-sans">
      {/* Navegación */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado y Filtros en la misma línea */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 className="text-3xl font-bold">Clasificación de Clientes (RFM)</h1>
            <p className="text-gray-600">
                Segmentación basada en valor monetario y actividad.
            </p>
        </div>

        {/* FORMULARIO CORREGIDO: Sin onChange, con botón */}
        <form className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Mostrar:</label>
          <select
            name="limit"
            defaultValue={limit}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="2">2</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
          {/* Mantenemos la página actual oculta para no perderla al cambiar límite */}
          <input type="hidden" name="page" value="1" />
          
          <button 
            type="submit"
            className="bg-slate-800 text-white text-xs px-3 py-1.5 rounded hover:bg-slate-700 font-medium"
          >
            Actualizar
          </button>
        </form>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-purple-700 font-bold uppercase mb-1">
            Total Gastado (Histórico)
          </p>
          <p className="text-3xl font-bold text-purple-900">
            ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-amber-700 font-bold uppercase mb-1">
            Total Clientes VIP
          </p>
          <p className="text-3xl font-bold text-amber-900">
            {clientesVIP}
          </p>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="overflow-x-auto shadow-md rounded-lg mb-6">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3 text-center">Segmento</th>
              <th className="px-6 py-3 text-center">Actividad</th>
              <th className="px-6 py-3 text-right">Gasto Total</th>
              <th className="px-6 py-3 text-right">Gasto Promedio</th>
              <th className="px-6 py-3 text-center">Órdenes</th>
              <th className="px-6 py-3 text-right">Última Compra</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length > 0 ? (
                clientes.map((cliente) => (
              <tr key={cliente.usuario_id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-gray-900">{cliente.usuario}</p>
                    <p className="text-xs text-gray-500">{cliente.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                    ${cliente.segmento_cliente === 'VIP' ? 'bg-purple-600' : 
                      cliente.segmento_cliente === 'Premium' ? 'bg-blue-600' :
                      cliente.segmento_cliente === 'Regular' ? 'bg-green-600' : 
                      'bg-gray-400'}
                  `}>
                    {cliente.segmento_cliente}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold
                    ${cliente.estado_actividad === 'Muy Activo' ? 'bg-green-100 text-green-800' :
                      cliente.estado_actividad === 'Activo' ? 'bg-blue-100 text-blue-800' :
                      cliente.estado_actividad === 'Ocasional' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}
                  `}>
                    {cliente.estado_actividad}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold text-gray-900">
                  ${Number(cliente.gasto_total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-600">
                  ${Number(cliente.gasto_promedio).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold">
                    {cliente.total_ordenes}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {cliente.ultima_compra ? new Date(cliente.ultima_compra).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : <span className="text-gray-400 italic">Sin fecha</span>}
                </td>
              </tr>
            ))
            ) : (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No hay clientes para mostrar.
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
                href={`/reports/clientes?page=${page - 1}&limit=${limit}`}
                className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                >
                ← Anterior
                </Link>
            )}
            {page < totalPages && (
                <Link
                href={`/reports/clientes?page=${page + 1}&limit=${limit}`}
                className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm"
                >
                Siguiente →
                </Link>
            )}
            </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-700 mb-2">Criterios de Segmentación:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
          <div><span className="font-bold text-purple-700">VIP:</span> &gt;$1,000</div>
          <div><span className="font-bold text-blue-700">Premium:</span> $500-$999</div>
          <div><span className="font-bold text-green-700">Regular:</span> $100-$499</div>
          <div><span className="font-bold text-gray-700">Nuevo:</span> &lt;$100</div>
        </div>
      </div>
    </div>
  );
}