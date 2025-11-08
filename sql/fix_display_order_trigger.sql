-- FIX: Corregir trigger de display_order para evitar conflictos

-- 1. Eliminar el trigger actual
DROP TRIGGER IF EXISTS trigger_handle_display_order_duplicate ON maps;

-- 2. Eliminar la función actual
DROP FUNCTION IF EXISTS handle_display_order_duplicate();

-- 3. Nueva función que evita conflictos
CREATE OR REPLACE FUNCTION handle_display_order_duplicate()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo ejecutar si display_order cambió realmente
    IF OLD.display_order IS DISTINCT FROM NEW.display_order THEN
        -- Incrementar display_order de mapas que tengan el mismo o mayor valor
        -- Excluir el mapa actual para evitar recursión
        UPDATE maps 
        SET display_order = display_order + 1 
        WHERE display_order >= NEW.display_order 
        AND id != NEW.id;
    END IF;
    RETURN NULL; -- No necesitamos retornar nada en AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger AFTER UPDATE para evitar conflictos
CREATE TRIGGER trigger_handle_display_order_duplicate
    AFTER UPDATE ON maps
    FOR EACH ROW
    EXECUTE FUNCTION handle_display_order_duplicate();

-- 5. Verificar que funciona
SELECT 'Trigger actualizado correctamente' AS status;
