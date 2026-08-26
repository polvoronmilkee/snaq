// Supabase Configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://elikjyaiidkflbojkznv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsaWtqeWFpaWRrZmxib2prem52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NjczMDcsImV4cCI6MjEwMzM0MzMwN30.d2JgEmU5zILFtRq8D_f8LfDnSYGrRC0pCO1pddn3WEE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Leaderboard Manager Class
class LeaderboardManager {
  constructor() {
    this.supabase = supabase;
    this.tableName = 'leaderboard';
  }

  // Submit score to leaderboard (upserts — keeps only the best score per user per category)
  async submitScore(username, totalPoints, category = 'overall') {
    try {
      const points = parseInt(totalPoints);
      const now = new Date().toISOString();

      // Upsert on (username, category) — insert if new, update only if score is higher
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(
          {
            username: username.trim(),
            total_points: points,
            category: category,
            created_at: now,
            last_updated: now
          },
          { onConflict: 'username,category', ignoreDuplicates: false }
        );

      // If the upsert succeeded but we need to ensure we only keep the higher score,
      // do a conditional update: only set total_points if the new value is greater
      if (!error) {
        await this.supabase
          .from(this.tableName)
          .update({ total_points: points, last_updated: now })
          .eq('username', username.trim())
          .eq('category', category)
          .lt('total_points', points);
      }

      if (error) throw error;

      console.log(`Score submitted successfully to ${category} category`);
      return { success: true, message: 'Score submitted successfully' };
    } catch (error) {
      console.error('Error submitting score:', error);
      return { success: false, message: 'Failed to submit score: ' + error.message };
    }
  }

  // Get player's best score
  async getPlayerScore(username, category = 'overall') {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('username', username.trim())
        .eq('category', category)
        .order('total_points', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found

      if (data) {
        return {
          id: data.id,
          username: data.username,
          totalPoints: data.total_points,
          category: data.category,
          timestamp: data.created_at
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting player score:', error);
      return null;
    }
  }

  // Get top leaderboard entries (unique usernames only)
  async getLeaderboard(category = 'overall', limitCount = 10) {
    try {
      if (category === 'overall') {
        // For overall leaderboard, sum best scores from all categories
        return await this.getOverallLeaderboard(limitCount);
      } else {
        // For specific categories, get best score per user in that category
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .eq('category', category)
          .order('total_points', { ascending: false });

        if (error) throw error;

        const userBestScores = new Map();

        // Process all rows to find each user's best score in this category
        (data || []).forEach((row) => {
          const username = row.username.trim();

          if (!userBestScores.has(username) ||
              userBestScores.get(username).totalPoints < row.total_points) {
            userBestScores.set(username, {
              username: username,
              totalPoints: row.total_points,
              timestamp: row.created_at,
              id: row.id
            });
          }
        });

        // Convert to array and sort by totalPoints descending
        const leaderboard = Array.from(userBestScores.values())
          .sort((a, b) => b.totalPoints - a.totalPoints)
          .slice(0, limitCount)
          .map((entry, index) => ({
            rank: index + 1,
            username: entry.username,
            totalPoints: entry.totalPoints,
            timestamp: entry.timestamp,
            id: entry.id
          }));

        return leaderboard;
      }
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Get overall leaderboard by summing best scores across all categories
  async getOverallLeaderboard(limitCount = 10) {
    try {
      const categories = ['math', 'english', 'science', 'generalknow'];
      const userTotalScores = new Map();

      // Fetch all scores from all categories in one query
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .in('category', categories)
        .order('total_points', { ascending: false });

      if (error) throw error;

      (data || []).forEach((row) => {
        const username = row.username.trim();
        const cat = row.category;

        if (!userTotalScores.has(username)) {
          userTotalScores.set(username, {
            username: username,
            totalPoints: 0,
            categories: new Map(),
            timestamp: row.created_at
          });
        }

        const userData = userTotalScores.get(username);

        // Keep track of best score per category
        if (!userData.categories.has(cat) ||
            userData.categories.get(cat) < row.total_points) {
          const previousScore = userData.categories.get(cat) || 0;
          userData.categories.set(cat, row.total_points);

          // Update total points (subtract old score, add new score)
          userData.totalPoints = userData.totalPoints - previousScore + row.total_points;

          // Update timestamp to most recent
          if (row.created_at > userData.timestamp) {
            userData.timestamp = row.created_at;
          }
        }
      });

      // Convert to array and sort by total points
      const leaderboard = Array.from(userTotalScores.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limitCount)
        .map((entry, index) => ({
          rank: index + 1,
          username: entry.username,
          totalPoints: entry.totalPoints,
          timestamp: entry.timestamp,
          id: `overall_${entry.username}` // synthetic ID for overall
        }));

      return leaderboard;
    } catch (error) {
      console.error('Error getting overall leaderboard:', error);
      return [];
    }
  }

  // Get player's rank (based on best score only)
  async getPlayerRank(username, category = 'overall') {
    try {
      const leaderboard = await this.getLeaderboard(category, 1000);
      const playerEntry = leaderboard.find(entry => entry.username === username.trim());
      return playerEntry ? playerEntry.rank : null;
    } catch (error) {
      console.error('Error getting player rank:', error);
      return null;
    }
  }
}

// Export the leaderboard manager
window.LeaderboardManager = LeaderboardManager;
export { LeaderboardManager };
