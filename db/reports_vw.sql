-- View 1: Ventas por categoria con CTE
--que devuelve: el analisis de ventas por categoria de productos
--Grain: Una fila por categoria
--Metricas: 
--- total_ordenes: cantidad de órdenes que incluyen productos
-- prouctos_

CREATE OR REPLACE VIEW view_ventas_por_categorias analisis
WITH ventas_detalle AS (
    SELECT
    c.id as categoria_id,
    c.nombre as categoria,
    od.orden_id,
    od.cantidad,
    od.subtotal
    FROM categorias c
    INNER JOIN productos p ON c.id = p.categoria_id
    INNER JOIN orden_detalles od ON p.id = od.producto_id
    INNER JOIN ordenes o ON od.orden_id = o.id
    WHERE o.status !=  'cancelado'
),
totales AS (
    SELECT SUM(subtotal) as gran gran_total
    FROM ventas_detalle
)
SELECT 
vd.categoria_id,
vd.categoria,
COUNT(DISTINCT vd.orden_id) as total_ordenes,
SUM(vd.cantidad) as productos_vendidos ,
SUM(vd.subtotal) as ingresos_totales,
ROUND(AVG(vd.subtotal), 2) as ticket_promedio ,
ROUND(
    (SUM(vd.subtotal) / NULL IF(t.gran_total, 0) * 100) ,
    2
) as participacion_pct
FROM ventas_detalle vd
CROSS JOIN totales t 
GROUP BY vd.categoria_id, vd.categoria, t.gran_total
ORDER BY ingresos_totales DESC;


---view 2