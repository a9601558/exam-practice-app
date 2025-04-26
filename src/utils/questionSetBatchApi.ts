import axios from 'axios';
import { logger } from './logger';
import { QuestionSet, Question } from '../types';

// 批量处理API基础URL
const API_BASE_URL = '/api';

/**
 * 响应接口
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * 批量上传进度回调
 */
export interface UploadProgressCallback {
  onProgress: (progress: number) => void;
  onValidationStart: () => void;
  onValidationComplete: (valid: boolean, errors?: any) => void;
  onUploadStart: () => void;
  onUploadComplete: (success: boolean, data?: any) => void;
  onError: (error: Error) => void;
}

/**
 * 创建请求头 (包含认证信息)
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * 题库批处理API
 */
export const questionSetBatchApi = {
  /**
   * 批量上传题库 (支持进度回调)
   */
  batchUpload: async (
    questionSets: Partial<QuestionSet>[],
    callbacks?: Partial<UploadProgressCallback>
  ): Promise<ApiResponse<QuestionSet[]>> => {
    try {
      // 客户端验证
      callbacks?.onValidationStart?.();
      
      // 基本验证
      const validationErrors: Record<string, string[]> = {};
      
      questionSets.forEach((set, index) => {
        const setErrors: string[] = [];
        
        if (!set.id) setErrors.push('题库ID不能为空');
        if (!set.title) setErrors.push('题库标题不能为空');
        if (!set.category) setErrors.push('题库分类不能为空');
        
        // 验证题目
        if (set.questions && set.questions.length > 0) {
          set.questions.forEach((question: any, qIndex) => {
            if (!question.question) {
              setErrors.push(`题目 #${qIndex + 1} 缺少问题内容`);
            }
            if (!question.options || question.options.length < 2) {
              setErrors.push(`题目 #${qIndex + 1} 至少需要2个选项`);
            }
            if (!question.correctAnswer) {
              setErrors.push(`题目 #${qIndex + 1} 缺少正确答案`);
            }
          });
        } else {
          setErrors.push('题库至少需要包含一个题目');
        }
        
        if (setErrors.length > 0) {
          validationErrors[`set_${index}`] = setErrors;
        }
      });
      
      const isValid = Object.keys(validationErrors).length === 0;
      callbacks?.onValidationComplete?.(isValid, validationErrors);
      
      if (!isValid) {
        return {
          success: false,
          errors: validationErrors,
          message: '题库数据验证失败'
        };
      }
      
      // 开始上传
      callbacks?.onUploadStart?.();
      
      // 分批上传以避免请求过大
      const batchSize = 5;
      const results: QuestionSet[] = [];
      
      for (let i = 0; i < questionSets.length; i += batchSize) {
        const batch = questionSets.slice(i, i + batchSize);
        
        const response = await axios.post(
          `${API_BASE_URL}/question-sets/bulk-upload`,
          { questionSets: batch },
          {
            headers: getAuthHeaders(),
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              const overallProgress = Math.round(
                ((i / questionSets.length) * 100) + (percentCompleted / questionSets.length) * batch.length
              );
              callbacks?.onProgress?.(Math.min(overallProgress, 99)); // 最大99%，留1%给服务器处理时间
            }
          }
        );
        
        if (response.data.success && response.data.data) {
          results.push(...response.data.data);
        } else {
          throw new Error(response.data.message || '部分题库上传失败');
        }
        
        // 更新进度 (每批次完成)
        const progress = Math.min(Math.round(((i + batch.length) / questionSets.length) * 100), 99);
        callbacks?.onProgress?.(progress);
      }
      
      // 完成上传
      callbacks?.onProgress?.(100);
      callbacks?.onUploadComplete?.(true, results);
      
      return {
        success: true,
        data: results,
        message: `成功批量上传 ${results.length} 个题库`
      };
      
    } catch (error: any) {
      logger.error('批量上传题库失败:', error);
      
      callbacks?.onError?.(error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || '批量上传题库失败'
      };
    }
  },
  
  /**
   * 从Excel文件解析题库数据
   */
  parseExcelFile: async (file: File): Promise<ApiResponse<Partial<QuestionSet>[]>> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_BASE_URL}/question-sets/parse-excel`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      logger.error('解析Excel文件失败:', error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || '解析Excel文件失败'
      };
    }
  },
  
  /**
   * 执行批量操作 (更新、删除)
   */
  batchOperation: async (
    operation: 'update' | 'delete',
    ids: string[],
    data?: Record<string, Partial<QuestionSet>>
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/question-sets/batch-operation`,
        {
          operation,
          ids,
          data
        },
        {
          headers: getAuthHeaders()
        }
      );
      
      return response.data;
    } catch (error: any) {
      logger.error(`批量${operation === 'update' ? '更新' : '删除'}题库失败:`, error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || `批量${operation === 'update' ? '更新' : '删除'}题库失败`
      };
    }
  }
};

/**
 * 题目格式验证
 */
export const validateQuestion = (question: Partial<Question>): string[] => {
  const errors: string[] = [];
  
  if (!question.question?.trim()) {
    errors.push('题目内容不能为空');
  }
  
  if (!question.options || question.options.length < 2) {
    errors.push('题目至少需要两个选项');
  }
  
  // 验证正确答案
  if (question.questionType === 'single') {
    if (!question.correctAnswer) {
      errors.push('请选择正确答案');
    }
  } else if (question.questionType === 'multiple') {
    if (!Array.isArray(question.correctAnswer) || question.correctAnswer.length === 0) {
      errors.push('多选题至少需要选择一个正确答案');
    }
  }
  
  return errors;
};

/**
 * 题库格式验证
 */
export const validateQuestionSet = (questionSet: Partial<QuestionSet>): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};
  
  // 基本信息验证
  const basicErrors: string[] = [];
  
  if (!questionSet.id) basicErrors.push('题库ID不能为空');
  if (!questionSet.title?.trim()) basicErrors.push('题库标题不能为空');
  if (!questionSet.category?.trim()) basicErrors.push('题库分类不能为空');
  
  if (questionSet.isPaid && (!questionSet.price || questionSet.price <= 0)) {
    basicErrors.push('付费题库需要设置有效的价格');
  }
  
  if (basicErrors.length > 0) {
    errors['basic'] = basicErrors;
  }
  
  // 题目验证
  if (!questionSet.questions || questionSet.questions.length === 0) {
    errors['questions'] = ['题库至少需要包含一个题目'];
  } else {
    questionSet.questions.forEach((question, index) => {
      const questionErrors = validateQuestion(question);
      if (questionErrors.length > 0) {
        errors[`question_${index}`] = questionErrors;
      }
    });
  }
  
  return errors;
}; 