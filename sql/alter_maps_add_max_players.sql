-- Añadir columna max_players a la tabla maps
ALTER TABLE maps
ADD COLUMN max_players integer NOT NULL DEFAULT 50;
