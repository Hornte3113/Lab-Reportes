#!/bin/bash
set -e

echo "=== VERIFICACIÓN RÁPIDA DEL PROYECTO ==="
echo ""

echo "1.  Verificando que las views existan..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c '\dv' | grep view_

echo ""
echo "2.  Probando view_ventas_por_categoria..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c 'SELECT categoria, ROUND(ingresos_totales::numeric, 2) as ingresos FROM view_ventas_por_categoria LIMIT 3;'

echo ""
echo "3.  Probando view_top_productos..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c 'SELECT producto, ranking_ventas FROM view_top_productos LIMIT 3;'

echo ""
echo "4.  Probando view_clasificacion_clientes..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c 'SELECT usuario, segmento_cliente FROM view_clasificacion_clientes LIMIT 3;'

echo ""
echo "5.  Probando view_estado_ordenes..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c 'SELECT status, cantidad_ordenes FROM view_estado_ordenes;'

echo ""
echo "6.  Probando view_inventario_rotacion..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c 'SELECT producto, nivel_stock, accion_recomendada FROM view_inventario_rotacion LIMIT 3;'

echo ""
echo "7.  Verificando permisos del rol app_client..."
docker exec -it lab_reportes_db psql -U postgres -d postgres -c "SELECT COUNT(*) as views_con_acceso FROM information_schema.role_table_grants WHERE grantee = 'app_client';"

echo ""
echo "   TODAS LAS VERIFICACIONES PASARON   "
