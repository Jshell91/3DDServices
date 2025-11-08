-- Script SQL para insertar votos masivos en artwork_likes
-- Proyecto: 3DDServices
-- Fecha: 2025-10-30

-- ===============================================
-- INSERTAR VOTOS MASIVOS - ARTWORK LIKES
-- ===============================================

-- 1. Verificar estado actual
SELECT 
    artwork_id, 
    COUNT(*) as current_likes 
FROM artwork_likes 
GROUP BY artwork_id 
ORDER BY current_likes DESC;

-- 2. Insertar votos para obras específicas
-- Obra muy popular (100 votos)
INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_mega_popular', 'mega_fan_' || generate_series(1, 100)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

-- Obra moderadamente popular (50 votos)
INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_moderada', 'fan_' || generate_series(1, 50)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

-- Obra nueva con pocos votos (15 votos)
INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_nueva', 'early_fan_' || generate_series(1, 15)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

-- 3. Votos distribuidos realistas
-- Simular patrones de votación más naturales
INSERT INTO artwork_likes (artwork_id, user_id) VALUES
-- Obra A: 25 votos
('obra_realista_A', 'user_001'), ('obra_realista_A', 'user_002'), ('obra_realista_A', 'user_003'),
('obra_realista_A', 'user_004'), ('obra_realista_A', 'user_005'), ('obra_realista_A', 'user_006'),
('obra_realista_A', 'user_007'), ('obra_realista_A', 'user_008'), ('obra_realista_A', 'user_009'),
('obra_realista_A', 'user_010'), ('obra_realista_A', 'user_011'), ('obra_realista_A', 'user_012'),
('obra_realista_A', 'user_013'), ('obra_realista_A', 'user_014'), ('obra_realista_A', 'user_015'),
('obra_realista_A', 'user_016'), ('obra_realista_A', 'user_017'), ('obra_realista_A', 'user_018'),
('obra_realista_A', 'user_019'), ('obra_realista_A', 'user_020'), ('obra_realista_A', 'user_021'),
('obra_realista_A', 'user_022'), ('obra_realista_A', 'user_023'), ('obra_realista_A', 'user_024'),
('obra_realista_A', 'user_025'),

-- Obra B: 40 votos
('obra_realista_B', 'voter_001'), ('obra_realista_B', 'voter_002'), ('obra_realista_B', 'voter_003'),
('obra_realista_B', 'voter_004'), ('obra_realista_B', 'voter_005'), ('obra_realista_B', 'voter_006'),
('obra_realista_B', 'voter_007'), ('obra_realista_B', 'voter_008'), ('obra_realista_B', 'voter_009'),
('obra_realista_B', 'voter_010'), ('obra_realista_B', 'voter_011'), ('obra_realista_B', 'voter_012'),
('obra_realista_B', 'voter_013'), ('obra_realista_B', 'voter_014'), ('obra_realista_B', 'voter_015'),
('obra_realista_B', 'voter_016'), ('obra_realista_B', 'voter_017'), ('obra_realista_B', 'voter_018'),
('obra_realista_B', 'voter_019'), ('obra_realista_B', 'voter_020'), ('obra_realista_B', 'voter_021'),
('obra_realista_B', 'voter_022'), ('obra_realista_B', 'voter_023'), ('obra_realista_B', 'voter_024'),
('obra_realista_B', 'voter_025'), ('obra_realista_B', 'voter_026'), ('obra_realista_B', 'voter_027'),
('obra_realista_B', 'voter_028'), ('obra_realista_B', 'voter_029'), ('obra_realista_B', 'voter_030'),
('obra_realista_B', 'voter_031'), ('obra_realista_B', 'voter_032'), ('obra_realista_B', 'voter_033'),
('obra_realista_B', 'voter_034'), ('obra_realista_B', 'voter_035'), ('obra_realista_B', 'voter_036'),
('obra_realista_B', 'voter_037'), ('obra_realista_B', 'voter_038'), ('obra_realista_B', 'voter_039'),
('obra_realista_B', 'voter_040')

ON CONFLICT (artwork_id, user_id) DO NOTHING;

-- 4. Actualizar obras de test existentes
-- Añadir más votos a las obras de test
INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_test_1', 'extra_fan_' || generate_series(1, 30)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_test_2', 'boost_user_' || generate_series(1, 20)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

INSERT INTO artwork_likes (artwork_id, user_id)
SELECT 'obra_test_3', 'power_voter_' || generate_series(1, 45)
ON CONFLICT (artwork_id, user_id) DO NOTHING;

-- 5. Verificar resultados finales
SELECT 
    artwork_id, 
    COUNT(*) as total_likes,
    MIN(created_at) as first_like,
    MAX(created_at) as last_like
FROM artwork_likes 
GROUP BY artwork_id 
ORDER BY total_likes DESC;

-- 6. Top 10 obras más votadas
SELECT 
    artwork_id, 
    COUNT(*) as likes,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM artwork_likes), 2) as percentage
FROM artwork_likes 
GROUP BY artwork_id 
ORDER BY likes DESC 
LIMIT 10;

-- ===============================================
-- COMANDOS ÚTILES ADICIONALES
-- ===============================================

-- Eliminar todos los votos de una obra específica (si necesitas resetear)
-- DELETE FROM artwork_likes WHERE artwork_id = 'obra_a_resetear';

-- Cambiar nombre de obra (actualizar todos los votos)
-- UPDATE artwork_likes SET artwork_id = 'nuevo_nombre' WHERE artwork_id = 'nombre_antiguo';

-- Ver duplicados (no debería haber ninguno)
-- SELECT artwork_id, user_id, COUNT(*) FROM artwork_likes GROUP BY artwork_id, user_id HAVING COUNT(*) > 1;