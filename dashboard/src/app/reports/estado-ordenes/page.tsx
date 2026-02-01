import { query } from '@/lib/db';
import { EstadoOrden } from '@/lib/definitions';
import Link from 'next/link';

// 1. Función para obtener datos (Data Fetching)
async function getEstadoOrdenes() {
  // Consultamos la vista directamente. Ordenamos por prioridad como definiste en SQL.
  const result = await query(
    'SELECT * FROM view_estado_ordenes ORDER BY prioridad ASC'
  );
  return result.rows as EstadoOrden[];
}

export default async function ReporteEstadoOrdenes() {
  // 2. Ejecutar la consulta al cargar la página
  const datos = await getEstadoOrdenes();

  // 3. Calcular un KPI simple para mostrar destacado (Total de dinero en juego)
  // Sumamos el valor_total de todas las filas
  const kpiTotalDinero = datos.reduce(
    (acc, row) => acc + Number(row.valor_total), 
    0
  );

  return (
    <div className="p-8 font-sans">
      {/* Navegación*/}
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Volver al Dashboard
        </Link>
      </div>

      {/* Encabezado */}
      <h1 className="text-3xl font-bold mb-2">Reporte de Estado de Órdenes</h1>
      <p className="text-gray-600 mb-8">
        Visión general operativa del flujo de pedidos.
      </p>

      {/* KPI Destacado (Requisito de UI) */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 w-fit rounded">
        <p className="text-sm text-blue-700 font-bold uppercase">
          Valor Total en Pipeline
        </p>
        <p className="text-3xl font-bold text-blue-900">
          ${kpiTotalDinero.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tabla de Resultados (Requisito de UI) */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-white uppercase bg-slate-800">
            <tr>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3 text-center">Cant. Órdenes</th>
              <th className="px-6 py-3 text-right">Valor Total</th>
              <th className="px-6 py-3 text-right">Prom. Días</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr 
                key={fila.status} 
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-medium text-gray-900 capitalize">
                  {/* Badge de color según estado */}
                  <span className={`px-2 py-1 rounded text-xs text-white
                    ${fila.status === 'cancelado' ? 'bg-red-500' : 
                      fila.status === 'entregado' ? 'bg-green-500' : 'bg-yellow-500'}
                  `}>
                    {fila.status}
                  </span>
                </td>
                <td className="px-6 py-4">{fila.descripcion_estado}</td>
                <td className="px-6 py-4 text-center font-bold">
                  {fila.cantidad_ordenes}
                </td>
                <td className="px-6 py-4 text-right">
                  ${Number(fila.valor_total).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  {fila.dias_promedio} días
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}