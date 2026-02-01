-- ============================================
-- INDEXES para la  optimización de consultas
-- ============================================

-- 1. Índice para JOINs de Productos en Detalles
-- Justificación: Acelera las Views 1, 2 y 5 que cruzan productos con sus ventas
-- Sin este índice, la DB debe escanear toda la tabla de detalles para encontrar las ventas de un producto
CREATE INDEX IF NOT EXISTS idx_orden_detalles_producto_id ON orden_detalles(producto_id);

-- 2. Índice para Filtrado de Usuarios Activos
-- Justificación: Optimiza view_clasificacion_clientes que filtra "WHERE activo = TRUE"
-- Evita "Seq Scan" en la tabla usuarios cuando buscamos clientes válidos
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- 3. Índice para Fechas de Órdenes
-- Justificación: Optimiza cálculos de tiempo en view_estado_ordenes y la búsqueda
-- de "última compra" en view_clasificacion_clientes
CREATE INDEX IF NOT EXISTS idx_ordenes_created_at ON ordenes(created_at);