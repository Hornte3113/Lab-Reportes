-- ============================================
-- INDEXES para la  optimización de consultas
-- ============================================

-- 1. Índice para JOINs de Productos en Detalles
-- Justificación: Acelera las Views 1, 2 y 5 que cruzan productos con sus ventas
-- Sin este índice, la DB debe escanear toda la tabla de detalles para encontrar las ventas de un producto
CREATE INDEX IF NOT EXISTS idx_orden_detalles_producto_id ON orden_detalles(producto_id);
