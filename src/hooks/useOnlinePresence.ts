import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface OnlineUser {
  user_id: string;
  status: 'online' | 'in_call' | 'offline';
  profile?: {
    display_name: string;
    age: number;
    interests: string[];
    avatar_url?: string;
  };
}

export const useOnlinePresence = (userId?: string) => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    // Set user as online
    const setOnline = async () => {
      const { error } = await supabase
        .from('online_users')
        .upsert({ user_id: userId, status: 'online' });

      if (error) {
        console.error('Error setting online status:', error);
      }
    };

    setOnline();

    // Subscribe to online users changes
    const channel = supabase
      .channel('online-users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'online_users',
        },
        async () => {
          // Fetch updated online users with profiles
          const { data, error } = await supabase
            .from('online_users')
            .select(`
              user_id,
              status,
              profiles:user_id (
                display_name,
                age,
                interests,
                avatar_url
              )
            `)
            .eq('status', 'online')
            .neq('user_id', userId);

          if (error) {
            console.error('Error fetching online users:', error);
          } else {
            setOnlineUsers(data.map(user => ({
              user_id: user.user_id,
              status: user.status as 'online' | 'in_call' | 'offline',
              profile: user.profiles as any
            })));
          }
        }
      )
      .subscribe();

    // Initial fetch
    const fetchOnlineUsers = async () => {
      const { data, error } = await supabase
        .from('online_users')
        .select(`
          user_id,
          status,
          profiles:user_id (
            display_name,
            age,
            interests,
            avatar_url
          )
        `)
        .eq('status', 'online')
        .neq('user_id', userId);

      if (error) {
        console.error('Error fetching online users:', error);
      } else {
        setOnlineUsers(data.map(user => ({
          user_id: user.user_id,
          status: user.status as 'online' | 'in_call' | 'offline',
          profile: user.profiles as any
        })));
      }
    };

    fetchOnlineUsers();

    // Update online status periodically
    const interval = setInterval(async () => {
      await supabase
        .from('online_users')
        .upsert({ user_id: userId, status: 'online' });
    }, 30000); // Every 30 seconds

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
      supabase
        .from('online_users')
        .update({ status: 'offline' })
        .eq('user_id', userId)
        .then();
    };
  }, [userId]);

  const updateStatus = async (status: 'online' | 'in_call' | 'offline') => {
    if (!userId) return;

    const { error } = await supabase
      .from('online_users')
      .upsert({ user_id: userId, status });

    if (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  return { onlineUsers, updateStatus };
};