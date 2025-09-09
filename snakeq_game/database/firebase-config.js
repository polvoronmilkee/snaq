// Firebase Configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCSrz0YM1UaMCj8hbCwJNBM4-TeId00pdU",
  authDomain: "snaq-d6a71.firebaseapp.com",
  projectId: "snaq-d6a71",
  storageBucket: "snaq-d6a71.firebasestorage.app",
  messagingSenderId: "426243348324",
  appId: "1:426243348324:web:bf87789448fe5cdcd5cc71",
  measurementId: "G-G1D5WM23WP"
};
// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Leaderboard Manager Class
class LeaderboardManager {
  constructor() {
    this.db = db;
    this.leaderboardCollection = 'leaderboard';
  }

  // Submit score to leaderboard
  async submitScore(username, totalPoints, category = 'overall') {
    try {
      const playerData = {
        username: username.trim(),
        totalPoints: parseInt(totalPoints),
        category: category,
        timestamp: new Date(),
        lastUpdated: new Date()
      };

      // Only submit to the specific category (no automatic overall submission)
      await addDoc(collection(this.db, this.leaderboardCollection), playerData);
      
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
      const q = query(
        collection(this.db, this.leaderboardCollection),
        where('username', '==', username.trim()),
        where('category', '==', category),
        orderBy('totalPoints', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
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
        // For overall leaderboard, sum scores from all categories
        return await this.getOverallLeaderboard(limitCount);
      } else {
        // For specific categories, get the best score per user in that category
        const q = query(
          collection(this.db, this.leaderboardCollection),
          where('category', '==', category),
          orderBy('totalPoints', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const userBestScores = new Map();
        
        // Process all documents to find each user's best score in this category
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const username = data.username.trim();
          
          if (!userBestScores.has(username) || 
              userBestScores.get(username).totalPoints < data.totalPoints) {
            userBestScores.set(username, {
              username: username,
              totalPoints: data.totalPoints,
              timestamp: data.timestamp,
              id: doc.id
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

  // Get overall leaderboard by summing ALL scores from all categories
  async getOverallLeaderboard(limitCount = 10) {
    try {
      const categories = ['math', 'english', 'science', 'generalknow'];
      const userTotalScores = new Map();
      
      // Get all scores from all categories
      for (const cat of categories) {
        const q = query(
          collection(this.db, this.leaderboardCollection),
          where('category', '==', cat),
          orderBy('totalPoints', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const username = data.username.trim();
          
          if (!userTotalScores.has(username)) {
            userTotalScores.set(username, {
              username: username,
              totalPoints: 0,
              timestamp: data.timestamp
            });
          }
          
          const userData = userTotalScores.get(username);
          
          // Add ALL points from this game session (accumulate everything)
          userData.totalPoints += data.totalPoints;
          
          // Update timestamp to most recent
          if (data.timestamp > userData.timestamp) {
            userData.timestamp = data.timestamp;
          }
        });
      }
      
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
      const leaderboard = await this.getLeaderboard(category, 1000); // Get more entries to ensure accurate rank
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
