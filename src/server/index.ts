import express from 'express';
import { 
  InitResponse, 
  GetPuzzleResponse, 
  SubmitResultResponse,
  UserResult,
  UserState
} from '../shared/types/api';
import { reddit, createServer, context, getServerPort } from '@devvit/web/server';
import { createPost } from './core/post';
import { GameStorage } from './lib/storage';
import { ContentManager } from './lib/content';
import { getTodaySeed } from './lib/seed';
import { computeScore, updateStreak, calculateTotalTime } from './lib/scoring';
import { formatShare } from './lib/share';
import { RedditContentManager } from './lib/reddit-content';

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
// Middleware for URL-encoded body parsing
app.use(express.urlencoded({ extended: true }));
// Middleware for plain text body parsing
app.use(express.text());

const router = express.Router();

// Initialize the game for a user
router.get<{ postId: string }, InitResponse | { status: string; message: string }>(
  '/api/init',
  async (_req, res): Promise<void> => {
    const { postId } = context;

    if (!postId) {
      console.error('API Init Error: postId not found in devvit context');
      res.status(400).json({
        status: 'error',
        message: 'postId is required but missing from context',
      });
      return;
    }

    try {
      const username = await reddit.getCurrentUsername() ?? 'anonymous';
      const userState = await GameStorage.getUserState(username);
      
      // Initialize content if needed
      await ContentManager.initializeContent();

      res.json({
        type: 'init',
        postId: postId,
        username: username,
        userState: userState
      });
    } catch (error) {
      console.error(`API Init Error for post ${postId}:`, error);
      let errorMessage = 'Unknown error during initialization';
      if (error instanceof Error) {
        errorMessage = `Initialization failed: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Get today's puzzle
router.get<unknown, GetPuzzleResponse | { status: string; message: string }>(
  '/api/puzzle/today',
  async (_req, res): Promise<void> => {
    try {
      const today = new Date();
      const seed = getTodaySeed(today, 'de');
      const puzzle = await ContentManager.getDailyPuzzle(seed);
      
      res.json({
        type: 'puzzle',
        puzzle: puzzle
      });
    } catch (error) {
      console.error('Error getting today\'s puzzle:', error);
      let errorMessage = 'Failed to get today\'s puzzle';
      if (error instanceof Error) {
        errorMessage = `Puzzle error: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Get a specific puzzle by seed
router.get<{ seed: string }, GetPuzzleResponse | { status: string; message: string }>(
  '/api/puzzle/:seed',
  async (req, res): Promise<void> => {
    try {
      const { seed } = req.params;
      const puzzle = await ContentManager.getDailyPuzzle(seed);
      
      res.json({
        type: 'puzzle',
        puzzle: puzzle
      });
    } catch (error) {
      console.error('Error getting puzzle:', error);
      let errorMessage = 'Failed to get puzzle';
      if (error instanceof Error) {
        errorMessage = `Puzzle error: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Submit game results
router.post<unknown, SubmitResultResponse | { status: string; message: string }, UserResult>(
  '/api/submit-result',
  async (req, res): Promise<void> => {
    try {
      const result = req.body;
      const { userId, seed, answers } = result;
      
      // Calculate score
      const { score, perfect } = computeScore(answers);
      const timeMs = calculateTotalTime(answers);
      
      // Get user state and update streak
      const userState = await GameStorage.getUserState(userId);
      const { newStreak } = updateStreak(userState.streak, score, answers.length);
      
      // Update max streak if needed
      const maxStreak = Math.max(userState.maxStreak, newStreak);
      
      // Update user state
      const updatedState: UserState = {
        streak: newStreak,
        maxStreak: maxStreak,
        lastPlayed: seed
      };
      
      await GameStorage.updateUserState(userId, updatedState);
      
      // Save the result
      await GameStorage.saveUserResult({
        ...result,
        score,
        timeMs
      });
      
      // Generate share text
      const shareText = formatShare(score, answers.length, timeMs, perfect, answers);
      
      res.json({
        type: 'result',
        score,
        perfect,
        timeMs,
        newStreak,
        maxStreak,
        shareText,
        answers
      });
    } catch (error) {
      console.error('Error submitting result:', error);
      let errorMessage = 'Failed to submit result';
      if (error instanceof Error) {
        errorMessage = `Result error: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Get user state
router.get<{ userId: string }, { type: 'userState'; userState: UserState } | { status: string; message: string }>(
  '/api/user/:userId/state',
  async (req, res): Promise<void> => {
    try {
      const { userId } = req.params;
      const userState = await GameStorage.getUserState(userId);
      
      res.json({
        type: 'userState',
        userState
      });
    } catch (error) {
      console.error('Error getting user state:', error);
      let errorMessage = 'Failed to get user state';
      if (error instanceof Error) {
        errorMessage = `User state error: ${error.message}`;
      }
      res.status(400).json({ status: 'error', message: errorMessage });
    }
  }
);

// Reddit content endpoints
router.get('/api/reddit/refresh', async (req, res): Promise<void> => {
  try {
    // Get subreddit from query parameter or use default
    const subredditName = req.query.subreddit as string || undefined;
    
    // Refresh word bank with Reddit content
    const success = await RedditContentManager.refreshWordBank(subredditName);
    
    if (success) {
      res.json({
        status: 'success',
        message: 'Word bank refreshed with Reddit content'
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to refresh word bank with Reddit content'
      });
    }
  } catch (error) {
    console.error('Error refreshing Reddit content:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.get('/api/reddit/puzzle/create', async (_req, res): Promise<void> => {
  try {
    // Create a Reddit puzzle for today
    const date = new Date();
    const success = await RedditContentManager.createRedditPuzzle(date);
    
    if (success) {
      const seed = `${date.toISOString().slice(0, 10)}:de:reddit`;
      const puzzle = await GameStorage.getPuzzle(seed);
      
      res.json({
        status: 'success',
        message: 'Reddit puzzle created',
        puzzle
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Failed to create Reddit puzzle'
      });
    }
  } catch (error) {
    console.error('Error creating Reddit puzzle:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Get a Reddit puzzle
router.get('/api/puzzle/reddit', async (_req, res): Promise<void> => {
  try {
    const date = new Date();
    const seed = `${date.toISOString().slice(0, 10)}:de:reddit`;
    
    // Try to get existing Reddit puzzle
    let puzzle = await GameStorage.getPuzzle(seed);
    
    // If no puzzle exists, create one
    if (!puzzle) {
      const success = await RedditContentManager.createRedditPuzzle(date);
      if (success) {
        puzzle = await GameStorage.getPuzzle(seed);
      }
    }
    
    if (puzzle) {
      res.json({
        type: 'puzzle',
        puzzle
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Reddit puzzle not found and could not be created'
      });
    }
  } catch (error) {
    console.error('Error getting Reddit puzzle:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    // Initialize content on app install
    await ContentManager.initializeContent();
    
    // Also initialize Reddit content
    await RedditContentManager.refreshWordBank();
    
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

// Use router middleware
app.use(router);

// Get port from environment variable with fallback
const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
server.listen(port);
