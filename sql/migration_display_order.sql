-- MIGRACIÓN: Añadir columna display_order a tabla maps
-- Ejecutar estas sentencias en orden en PostgreSQL

-- 1. Añadir la columna
ALTER TABLE maps ADD COLUMN display_order INTEGER;

-- 2. Inicializar con valores del ID
UPDATE maps SET display_order = id;

-- 3. Hacer la columna NOT NULL
ALTER TABLE maps ALTER COLUMN display_order SET NOT NULL;

-- 4. Añadir constraint para valores positivos
ALTER TABLE maps ADD CONSTRAINT check_display_order_positive CHECK (display_order > 0);

-- 5. Crear índice para rendimiento
CREATE INDEX idx_maps_display_order ON maps(display_order);

-- 6. Función para auto-incremento en duplicados
CREATE OR REPLACE FUNCTION handle_display_order_duplicate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_order IS DISTINCT FROM OLD.display_order THEN
        UPDATE maps 
        SET display_order = display_order + 1 
        WHERE display_order >= NEW.display_order 
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger
CREATE TRIGGER trigger_handle_display_order_duplicate
    BEFORE UPDATE ON maps
    FOR EACH ROW
    EXECUTE FUNCTION handle_display_order_duplicate();

-- 8. Verificar
SELECT id, name, display_order FROM maps ORDER BY display_order ASC LIMIT 10;
