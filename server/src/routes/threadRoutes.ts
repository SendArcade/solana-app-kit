import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllPosts,
  createRootPost,
  createReply,
  deletePost,
} from '../controllers/threadController';

const threadRouter = Router();

// Utility wrapper to catch errors in async route handlers
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// GET all posts
threadRouter.get('/posts', asyncHandler(getAllPosts));

// Create a root post
threadRouter.post('/posts', asyncHandler(createRootPost));

// Create a reply
threadRouter.post('/posts/reply', asyncHandler(createReply));

// Delete a post
threadRouter.delete('/posts/:postId', asyncHandler(deletePost));

export { threadRouter };
