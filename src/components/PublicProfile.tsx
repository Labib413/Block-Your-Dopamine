import React, { useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { GlassCard } from "./GlassCard";
import { Award, Trophy } from "lucide-react";
import { BADGES } from "../constants";
import { useSupabaseFetch } from "../hooks/useSupabaseFetch";

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  const fetchProfile = useCallback(async () => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('badges, level, xp')
      .eq('username', username)
      .single();
    if (error) throw error;
    return profile;
  }, [username]);

  const { data, isLoading } = useSupabaseFetch(`public_profile_${username}`, fetchProfile);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 selection:bg-neon-green/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-green/5 blur-[120px] rounded-full" />
      </div>

      <GlassCard className="w-full max-w-2xl p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-sans font-bold text-white tracking-tighter">
              {username}'s Profile
            </h1>
            <p className="text-white/40 text-sm font-medium tracking-[0.3em] uppercase mt-2">
              Public Badges & Stats
            </p>
          </div>
          <Trophy className="w-12 h-12 text-neon-green/50" />
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-neon-green border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center">
                 <span className="text-4xl font-mono font-bold text-neon-green mb-2">{data?.level || 1}</span>
                 <span className="text-xs uppercase font-bold tracking-widest text-white/40">Current Level</span>
               </div>
               <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center text-center">
                 <span className="text-4xl font-mono font-bold text-neon-blue mb-2">{data?.xp || 0}</span>
                 <span className="text-xs uppercase font-bold tracking-widest text-white/40">Total XP</span>
               </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Award className="text-neon-green w-5 h-5" /> Earned Badges
              </h3>
              <div className="text-white/40 text-sm">
                {data?.badges && data.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.badges.map((badgeId, i) => (
                      <span key={i} className="px-3 py-1 rounded bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-widest">
                        {badgeId.split('_').join(' ')}
                      </span>
                    ))}
                  </div>
                ) : (
                  "No badges to display yet or RLS restrictions in place."
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pt-8 flex justify-center">
          <Link to="/" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-colors border border-white/10 hover:border-white/20">
            Go to Your Dashboard
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
