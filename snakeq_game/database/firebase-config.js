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

      // Always submit the score (remove the improvement check)
      await addDoc(collection(this.db, this.leaderboardCollection), playerData);
      
      // Also submit to overall category if not already overall
      if (category !== 'overall') {
        const overallData = {
          username: username.trim(),
          totalPoints: parseInt(totalPoints),
          category: 'overall',
          timestamp: new Date(),
          lastUpdated: new Date()
        };
        await addDoc(collection(this.db, this.leaderboardCollection), overallData);
      }
      
      console.log('Score submitted successfully');
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

  // Get top leaderboard entries
  async getLeaderboard(category = 'overall', limitCount = 10) {
    try {
      const q = query(
        collection(this.db, this.leaderboardCollection),
        where('category', '==', category),
        orderBy('totalPoints', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const leaderboard = [];
      
      querySnapshot.forEach((doc, index) => {
        const data = doc.data();
        leaderboard.push({
          rank: index + 1,
          username: data.username,
          totalPoints: data.totalPoints,
          timestamp: data.timestamp,
          id: doc.id
        });
      });
      
      return leaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  // Get player's rank
  async getPlayerRank(username, category = 'overall') {
    try {
      const leaderboard = await this.getLeaderboard(category, 100); // Get top 100
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
