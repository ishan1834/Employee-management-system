



import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  primary_exam: string | null;
  secondary_exams: string[] | null;
  target_year: number | null;
  current_class: string | null;
  daily_goal_hours: number | null;
  weak_subjects: string[] | null;
  onboarding_complete: boolean;
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (uid: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (mounted) setProfile((data as Profile) ?? null);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => loadProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  return { user, profile, loading, refreshProfile };
}
