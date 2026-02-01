import { query } from '@/lib/db';

export default async function VentasPage() {
  const data = await query(`SELECT * FROM view_ventas_por_categoria`);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Ventas por Categoría</h1>
      <p className="text-gray-600 mb-6">Resumen financiero detallado por tipo de producto.</p>
      {/* Tabla con: categoria, total_ventas, total_ingresos, etc. */}
    </div>
  );
}