import Link from 'next/link';
import { ordenesService } from '@/services';

export const dynamic = 'force-dynamic';

export default async function ReporteEstadoOrdenes() {
  // Obtener datos desde el servicio (backend)
  const datos = await ordenesService.getEstadoOrdenes();

  // Calcular KPIs usando la lógica del servicio
  const { totalDinero } = ordenesService.calcularKPIsOrdenes(datos);

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

      {/* KPI Destacado */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 w-fit rounded">
        <p className="text-sm text-blue-700 font-bold uppercase">
          Valor Total en Pipeline
        </p>
        <p className="text-3xl font-bold text-blue-900">
          ${totalDinero.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Tabla de Resultados */}
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