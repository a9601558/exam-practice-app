import express from 'express';
import {
  getAllQuestionSets,
  getQuestionSetById,
  createQuestionSet,
  updateQuestionSet,
  deleteQuestionSet,
  saveProgress,
  uploadQuestionSets
} from '../controllers/questionSetController';
import { upload, uploadQuestionSetFile } from '../controllers/questionsUploadController';
import { protect, admin } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.get('/', getAllQuestionSets);

// Admin routes
router.post('/upload', protect, admin, uploadQuestionSets);

// File upload route
router.post('/upload/file', protect, admin, (req, res, next) => {
  console.log('进入文件上传路由');
  next();
}, upload.single('file'), (req, res, next) => {
  console.log('Multer处理完成，文件状态:', req.file ? '成功' : '失败');
  next();
}, uploadQuestionSetFile);

// Protected routes that use ID parameters
router.post('/:id/progress', protect, saveProgress);

// Admin routes with ID parameters
router.put('/:id', protect, admin, updateQuestionSet);
router.delete('/:id', protect, admin, deleteQuestionSet);

// Base routes
router.post('/', protect, admin, createQuestionSet);
router.get('/:id', getQuestionSetById);

export default router; 