import Link from 'next/link';
import { ventasService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function ReporteVentas() {
  
  const [datos, stats] = await Promise.all([
    ventasService.getVentasPorCategoria(),
    ventasService.getVentasStats()
  ]);


  const { totalIngresos, totalProductos, ticketPromedio } = stats;
 
  const categoriaLider = datos[0] || null;

  return (
    <div className="p-8 font-sans">
      {/* Navegación - RECUPERADA */}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado - RECUPERADO */}
      <h1 className="text-3xl font-bold mb-2">Ventas por Categoría</h1>
      <p className="text-gray-600 mb-8">
        Resumen financiero completo agrupado por tipo de producto.
      </p>

      {/* KPIs Destacados (Con fórmulas corregidas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-green-700 font-bold uppercase mb-1">
            Ingresos Totales
          </p>
          <p className="text-3xl font-bold text-green-900">
            ${totalIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* KPI 2: Productos Vendidos */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-blue-700 font-bold uppercase mb-1">
            Unidades Vendidas
          </p>
          <p className="text-3xl font-bold text-blue-900">
            {totalProductos.toLocaleString('en-US')}
          </p>
        </div>

        {/* KPI 3: Ticket Promedio REAL */}
        <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-purple-700 font-bold uppercase mb-1">
            Ticket Promedio Real
          </p>
          <p className="text-3xl font-bold text-purple-900">
            ${ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-purple-600 mt-1">Global (Ingresos / Órdenes)</p>
        </div>
      </div>

      {/* Insight adicional (Categoría Líder) */}
      {categoriaLider && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <p className="text-sm font-semibold text-amber-800 mb-1">
            Categoría Líder
          </p>
          <p className="text-gray-700">
            <span className="font-bold">{categoriaLider.categoria}</span> domina con{' '}
            <span className="font-bold">{categoriaLider.participacion_pct}%</span> del mercado
            (${Number(categoriaLider.ingresos_totales).toLocaleString('en-US', { minimumFractionDigits: 2 })}).
          </p>
        </div>
      )}

      {/* Tabla de Resultados */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Categoría</th>
              <th className="px-6 py-3 text-center">Órdenes</th>
              <th className="px-6 py-3 text-center">Productos Vendidos</th>
              <th className="px-6 py-3 text-right">Ingresos Totales</th>
              <th className="px-6 py-3 text-right">Ticket Promedio</th>
              <th className="px-6 py-3 text-center">Participación</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr 
                key={fila.categoria_id} 
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-bold text-gray-900">
                  {fila.categoria}
                </td>
                <td className="px-6 py-4 text-center">
                  {Number(fila.total_ordenes).toLocaleString('en-US')}
                </td>
                <td className="px-6 py-4 text-center">
                  {Number(fila.productos_vendidos).toLocaleString('en-US')}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  ${Number(fila.ingresos_totales).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 text-right font-mono">
                  ${Number(fila.ticket_promedio).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${fila.participacion_pct}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-700">
                      {fila.participacion_pct}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota técnica */}
      <div className="mt-6 text-xs text-gray-500 italic">
        Los datos excluyen órdenes canceladas. 
        Participación calculada sobre ingresos totales del período.
      </div>
    </div>
  );
}