-- ==============================================================================
-- BYD Database Refactoring & Privacy Migration
-- Tasks: Consolidate tables, ensure UUIDs, add RLS, updated_at triggers
-- ==============================================================================

-- 1. Consolidate detox_settings and user_preferences
-- Move existing detox_settings data to user_preferences
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'detox_settings') THEN
    EXECUTE '
      INSERT INTO public.user_preferences (
        user_id, daily_focus_goal_minutes, daily_calorie_goal, daily_step_goal,
        daily_sleep_goal, daily_hydration_goal, daily_screen_time_goal, updated_at
      )
      SELECT user_id, daily_focus_goal_minutes, daily_calorie_goal, daily_step_goal,
             daily_sleep_goal, daily_hydration_goal, daily_screen_time_goal, updated_at
      FROM public.detox_settings
      ON CONFLICT (user_id) DO UPDATE SET
        daily_focus_goal_minutes = EXCLUDED.daily_focus_goal_minutes,
        daily_calorie_goal = EXCLUDED.daily_calorie_goal,
        daily_step_goal = EXCLUDED.daily_step_goal,
        daily_sleep_goal = EXCLUDED.daily_sleep_goal,
        daily_hydration_goal = EXCLUDED.daily_hydration_goal,
        daily_screen_time_goal = EXCLUDED.daily_screen_time_goal,
        updated_at = EXCLUDED.updated_at
    ';

    -- Drop the redundant detox_settings table
    EXECUTE 'DROP TABLE public.detox_settings';
  END IF;
END $$;


-- 2. Add updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply updated_at triggers to all core tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trigger_set_updated_at ON %I', t);
        
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'updated_at') THEN
            EXECUTE format('CREATE TRIGGER trigger_set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t);
        END IF;
    END LOOP;
END;
$$;


-- 4. Enable Row Level Security (RLS) & Define Privacy Policies
-- Ensure users can only access their own data.
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
        
        -- Drop existing policy if it exists to replace it safely
        EXECUTE format('DROP POLICY IF EXISTS "Users can access their own data" ON %I;', t);
        
        -- Special case: profiles table joins on 'id' instead of 'user_id'
        IF t = 'profiles' THEN
             EXECUTE format('
                CREATE POLICY "Users can access their own data" ON %I 
                FOR ALL USING (auth.uid() = id) 
                WITH CHECK (auth.uid() = id);
             ', t);
        ELSE
             -- Check if user_id exists on the table to apply standard policy
             IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id') THEN
                 EXECUTE format('
                    CREATE POLICY "Users can access their own data" ON %I 
                    FOR ALL USING (auth.uid() = user_id) 
                    WITH CHECK (auth.uid() = user_id);
                 ', t);
             END IF;
        END IF;
    END LOOP;
END;
$$;

-- Note: user_settings and user_preferences act as the system configs per requirements
