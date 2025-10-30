import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Profile {
  id: string;
  display_name: string;
  age: number;
  interests: string[];
  avatar_url?: string;
}

export const useMatching = (userId?: string) => {
  const [isMatching, setIsMatching] = useState(false);
  const { toast } = useToast();

  const getMatchScore = (userInterests: string[], profileInterests: string[]) => {
    const commonInterests = userInterests.filter(interest =>
      profileInterests.includes(interest)
    );
    return commonInterests.length;
  };

  const findMatches = async () => {
    if (!userId) return [];

    setIsMatching(true);

    try {
      // Get current user profile
      const { data: currentUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get all other profiles that are online
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          online_users!inner(status)
        `)
        .neq('id', userId)
        .eq('online_users.status', 'online');

      if (profilesError) throw profilesError;

      // Calculate match scores and sort by score
      const matchedProfiles = profiles
        .map((profile: any) => ({
          ...profile,
          matchScore: getMatchScore(currentUser.interests, profile.interests),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      return matchedProfiles;
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to find matches',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsMatching(false);
    }
  };

  const createMatch = async (targetUserId: string) => {
    if (!userId) return null;

    try {
      // Create a consistent room ID by sorting user IDs
      const roomId = [userId, targetUserId].sort().join('-');

      const { error } = await supabase
        .from('matches')
        .insert({
          user1_id: userId,
          user2_id: targetUserId,
          status: 'accepted',
        });

      if (error) throw error;

      toast({
        title: 'Match created!',
        description: 'You can now start a video chat',
      });

      return roomId;
    } catch (error) {
      console.error('Error creating match:', error);
      toast({
        title: 'Error',
        description: 'Failed to create match',
        variant: 'destructive',
      });
      return null;
    }
  };

  const skipProfile = async (targetUserId: string) => {
    if (!userId) return;

    try {
      await supabase.from('matches').insert({
        user1_id: userId,
        user2_id: targetUserId,
        status: 'rejected',
      });
    } catch (error) {
      console.error('Error skipping profile:', error);
    }
  };

  return {
    isMatching,
    findMatches,
    createMatch,
    skipProfile,
  };
};