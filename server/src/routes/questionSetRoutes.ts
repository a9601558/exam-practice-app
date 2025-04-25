import express from 'express';
import {
  getQuestionSets,
  getQuestionSetById,
  createQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  saveProgress
} from '../controllers/questionSetController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getQuestionSets);
router.get('/:id', getQuestionSetById);

// Protected routes
router.post('/:id/progress', protect, saveProgress);

// Admin routes
router.post('/', protect, admin, createQuestionSet);
router.put('/:id', protect, admin, updateQuestionSet);
router.delete('/:id', protect, admin, deleteQuestionSet);

export default router; 