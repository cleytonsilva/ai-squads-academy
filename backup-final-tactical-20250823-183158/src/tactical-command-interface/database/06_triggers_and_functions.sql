-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_modules_updated_at BEFORE UPDATE ON course_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_simulados_updated_at BEFORE UPDATE ON simulados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_progress_updated_at BEFORE UPDATE ON daily_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_rankings_updated_at BEFORE UPDATE ON user_rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_reviews_updated_at BEFORE UPDATE ON course_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular XP necessário para próximo nível
CREATE OR REPLACE FUNCTION calculate_xp_for_level(level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN level * 1000 + (level - 1) * 500;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar estatísticas do usuário
CREATE OR REPLACE FUNCTION update_user_stats_on_xp_gain()
RETURNS TRIGGER AS $$
DECLARE
    current_stats RECORD;
    new_level INTEGER;
    xp_for_next_level INTEGER;
BEGIN
    -- Buscar estatísticas atuais
    SELECT * INTO current_stats FROM user_stats WHERE user_id = NEW.user_id;
    
    -- Atualizar XP total
    UPDATE user_stats 
    SET total_xp = total_xp + NEW.xp_amount,
        current_xp = current_xp + NEW.xp_amount
    WHERE user_id = NEW.user_id;
    
    -- Verificar se subiu de nível
    SELECT level, current_xp INTO current_stats FROM user_stats WHERE user_id = NEW.user_id;
    
    WHILE current_stats.current_xp >= calculate_xp_for_level(current_stats.level + 1) LOOP
        new_level := current_stats.level + 1;
        xp_for_next_level := calculate_xp_for_level(new_level + 1);
        
        UPDATE user_stats 
        SET level = new_level,
            current_xp = current_xp - calculate_xp_for_level(new_level),
            xp_to_next_level = xp_for_next_level
        WHERE user_id = NEW.user_id;
        
        -- Criar notificação de novo nível
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (NEW.user_id, 'Parabéns!', 'Você subiu para o nível ' || new_level || '!', 'achievement');
        
        SELECT level, current_xp INTO current_stats FROM user_stats WHERE user_id = NEW.user_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar stats quando XP é ganho
CREATE TRIGGER update_stats_on_xp_gain 
    AFTER INSERT ON user_xp_log 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_stats_on_xp_gain();

-- Função para atualizar progresso do curso
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
    total_lessons INTEGER;
    completed_lessons INTEGER;
    progress_percentage DECIMAL(5,2);
BEGIN
    -- Contar total de aulas no curso
    SELECT COUNT(*) INTO total_lessons
    FROM lessons l
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE cm.course_id = (
        SELECT cm2.course_id 
        FROM course_modules cm2 
        JOIN lessons l2 ON cm2.id = l2.module_id 
        WHERE l2.id = NEW.lesson_id
    );
    
    -- Contar aulas completadas pelo usuário
    SELECT COUNT(*) INTO completed_lessons
    FROM lesson_progress lp
    JOIN lessons l ON lp.lesson_id = l.id
    JOIN course_modules cm ON l.module_id = cm.id
    WHERE lp.user_id = NEW.user_id 
    AND lp.completed = true
    AND cm.course_id = (
        SELECT cm2.course_id 
        FROM course_modules cm2 
        JOIN lessons l2 ON cm2.id = l2.module_id 
        WHERE l2.id = NEW.lesson_id
    );
    
    -- Calcular porcentagem
    progress_percentage := (completed_lessons::DECIMAL / total_lessons::DECIMAL) * 100;
    
    -- Atualizar progresso na matrícula
    UPDATE course_enrollments 
    SET progress_percentage = progress_percentage,
        last_accessed = NOW(),
        completed_at = CASE WHEN progress_percentage = 100 THEN NOW() ELSE completed_at END,
        status = CASE WHEN progress_percentage = 100 THEN 'concluido' ELSE status END
    WHERE user_id = NEW.user_id 
    AND course_id = (
        SELECT cm2.course_id 
        FROM course_modules cm2 
        JOIN lessons l2 ON cm2.id = l2.module_id 
        WHERE l2.id = NEW.lesson_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar progresso do curso
CREATE TRIGGER update_course_progress_trigger
    AFTER UPDATE ON lesson_progress
    FOR EACH ROW
    WHEN (NEW.completed = true AND OLD.completed = false)
    EXECUTE FUNCTION update_course_progress();
