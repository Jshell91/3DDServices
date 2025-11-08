-- Añadir columna display_order a la tabla maps
-- Fecha: 2025-08-17
-- Descripción: Añade funcionalidad de ordenamiento personalizado para maps

-- 1. Añadir la columna display_order (si no existe)
ALTER TABLE maps 
ADD COLUMN IF NOT EXISTS display_order INTEGER;

-- 2. Inicializar display_order con el valor del ID para todos los registros existentes
UPDATE maps 
SET display_order = id 
WHERE display_order IS NULL;

-- 3. Añadir constraint NOT NULL y CHECK para valores positivos
ALTER TABLE maps 
ALTER COLUMN display_order SET NOT NULL;

ALTER TABLE maps 
ADD CONSTRAINT IF NOT EXISTS check_display_order_positive 
CHECK (display_order > 0);

-- 4. Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_maps_display_order ON maps(display_order);

-- 5. Crear función para auto-incremento en caso de duplicados
CREATE OR REPLACE FUNCTION handle_display_order_duplicate()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está actualizando display_order y ya existe ese valor
    IF NEW.display_order IS DISTINCT FROM OLD.display_order THEN
        -- Incrementar en +1 todos los maps que tengan display_order >= al nuevo valor
        -- (excluyendo el registro actual)
        UPDATE maps 
        SET display_order = display_order + 1 
        WHERE display_order >= NEW.display_order 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear trigger que ejecute la función antes de UPDATE
DROP TRIGGER IF EXISTS trigger_handle_display_order_duplicate ON maps;
CREATE TRIGGER trigger_handle_display_order_duplicate
    BEFORE UPDATE ON maps
    FOR EACH ROW
    EXECUTE FUNCTION handle_display_order_duplicate();

-- 7. Verificación: Mostrar algunos registros para confirmar
SELECT id, name, display_order 
FROM maps 
ORDER BY display_order ASC 
LIMIT 10;
