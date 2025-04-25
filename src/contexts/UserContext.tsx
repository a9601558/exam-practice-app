import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, Purchase, RedeemCode, UserProgress } from '../types';
import { userApi, redeemCodeApi } from '../utils/api';

// 定义进度数据的结构
export interface QuizProgress {
  questionSetId: string;
  answeredQuestions: {
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }[];
  score?: number;
  lastAttemptDate?: Date;
}

// 定义上下文的类型
interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>) => Promise<boolean>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  addProgress: (progress: QuizProgress) => Promise<void>;
  addPurchase: (purchase: Purchase) => Promise<void>;
  hasPurchased: (questionSetId: string) => boolean;
  getPurchaseExpiry: (questionSetId: string) => Date | null;
  isQuizCompleted: (questionSetId: string) => boolean;
  getQuizScore: (questionSetId: string) => number | null;
  getUserProgress: (questionSetId: string) => QuizProgress | undefined;
  getAnsweredQuestions: (questionSetId: string) => string[];
  isAdmin: () => boolean;
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;
  generateRedeemCode: (questionSetId: string, validityDays: number, quantity: number) => Promise<{ success: boolean; codes?: RedeemCode[]; message: string }>;
  getRedeemCodes: () => Promise<RedeemCode[]>;
  getAllUsers: () => Promise<User[]>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  adminRegister: (userData: Partial<User>) => Promise<{ success: boolean; message: string }>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider组件
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 初始化时尝试从本地存储加载用户
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  // 获取当前用户
  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const response = await userApi.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data || null);
      } else {
        localStorage.removeItem('token');
        setError(response.message || 'Failed to fetch user data');
      }
    } catch (error) {
      localStorage.removeItem('token');
      setError('An error occurred while fetching user data');
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.login(username, password);
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return true;
      } else {
        setError(response.message || 'Invalid username or password');
        return false;
      }
    } catch (error) {
      setError('An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // 注册
  const register = async (userData: Partial<User>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.register(userData);
      if (response.success && response.data) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        return true;
      } else {
        setError(response.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      setError('An error occurred during registration');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 更新用户
  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.updateUser(user.id, userData);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setError(response.message || 'Failed to update user');
      }
    } catch (error) {
      setError('An error occurred while updating user');
    } finally {
      setLoading(false);
    }
  };

  // 添加进度
  const addProgress = async (progress: QuizProgress) => {
    if (!user) return;
    
    try {
      // 将QuizProgress转换为UserProgress格式，以匹配API期望的类型
      const userProgress: UserProgress = {
        completedQuestions: progress.answeredQuestions.length,
        totalQuestions: progress.answeredQuestions.length, // 这里应该从问题集获取，暂时设为已回答数量
        correctAnswers: progress.answeredQuestions.filter(a => a.isCorrect).length,
        lastAccessed: progress.lastAttemptDate ? progress.lastAttemptDate.toISOString() : new Date().toISOString()
      };
      
      // 创建progress对象的副本
      const updatedProgress = { ...(user.progress || {}) };
      // 更新特定题集的进度
      updatedProgress[progress.questionSetId] = userProgress;
      
      // 更新用户
      await updateUser({ progress: updatedProgress });
    } catch (error) {
      console.error('Failed to add progress:', error);
    }
  };

  // 添加购买记录
  const addPurchase = async (purchase: Purchase) => {
    if (!user) return;
    
    try {
      // 获取当前购买列表
      const updatedPurchases = [...(user.purchases || [])];
      updatedPurchases.push(purchase);
      
      // 更新用户
      await updateUser({ purchases: updatedPurchases });
    } catch (error) {
      console.error('Failed to add purchase:', error);
    }
  };

  // 检查是否已购买
  const hasPurchased = (questionSetId: string): boolean => {
    if (!user || !user.purchases) return false;
    return user.purchases.some(
      purchase => purchase.quizId === questionSetId && 
      (new Date(purchase.expiryDate) > new Date() || !purchase.expiryDate)
    );
  };

  // 获取购买的过期时间
  const getPurchaseExpiry = (questionSetId: string): Date | null => {
    if (!user || !user.purchases) return null;
    const purchase = user.purchases.find(
      p => p.quizId === questionSetId && new Date(p.expiryDate) > new Date()
    );
    return purchase ? new Date(purchase.expiryDate) : null;
  };

  // 检查问题集是否已完成
  const isQuizCompleted = (questionSetId: string): boolean => {
    if (!user || !user.progress) return false;
    const progress = user.progress[questionSetId];
    return !!progress && progress.completedQuestions > 0 && progress.completedQuestions === progress.totalQuestions;
  };

  // 获取问题集得分
  const getQuizScore = (questionSetId: string): number | null => {
    if (!user || !user.progress) return null;
    const progress = user.progress[questionSetId];
    if (!progress) return null;
    
    // 计算百分比得分
    return progress.correctAnswers > 0 
      ? Math.round((progress.correctAnswers / progress.totalQuestions) * 100) 
      : 0;
  };

  // 获取用户在特定问题集上的进度
  const getUserProgress = (questionSetId: string): QuizProgress | undefined => {
    if (!user || !user.progress) return undefined;
    const progress = user.progress[questionSetId];
    if (!progress) return undefined;
    
    // 由于UserProgress和QuizProgress结构不同，这里需要转换
    // 实际应用中，可能需要从API获取完整的答题记录
    return {
      questionSetId,
      answeredQuestions: [], // 此处应从API获取详细的答题记录
      score: Math.round((progress.correctAnswers / progress.totalQuestions) * 100),
      lastAttemptDate: progress.lastAccessed ? new Date(progress.lastAccessed) : undefined
    };
  };

  // 获取已回答的问题IDs
  const getAnsweredQuestions = (questionSetId: string): string[] => {
    if (!user || !user.progress) return [];
    const progress = user.progress[questionSetId];
    if (!progress) return [];
    
    // 在实际API实现中，这里应该从后端获取详细的已答题目ID列表
    // 由于UserProgress中没有存储具体的题目ID，这里只能返回空数组
    return []; // 需要API支持获取详细的答题记录
  };

  // 检查用户是否为管理员
  const isAdmin = (): boolean => {
    return !!user?.isAdmin;
  };

  // 兑换代码
  const redeemCode = async (code: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: '请先登录' };
    
    try {
      const response = await redeemCodeApi.redeemCode(code);
      if (response.success) {
        // 刷新用户信息以获取更新的购买记录
        await fetchCurrentUser();
        return { success: true, message: '兑换码使用成功！' };
      } else {
        return { success: false, message: response.message || '兑换码使用失败' };
      }
    } catch (error) {
      return { success: false, message: '兑换过程中发生错误' };
    }
  };

  // 生成兑换码
  const generateRedeemCode = async (
    questionSetId: string,
    validityDays: number,
    quantity: number
  ): Promise<{ success: boolean; codes?: RedeemCode[]; message: string }> => {
    if (!isAdmin()) return { success: false, message: '无权限执行此操作' };
    
    try {
      const response = await redeemCodeApi.generateRedeemCodes(questionSetId, validityDays, quantity);
      if (response.success && response.data) {
        return { 
          success: true, 
          codes: response.data, 
          message: `成功生成 ${response.data.length} 个兑换码` 
        };
      } else {
        return { success: false, message: response.message || '生成兑换码失败' };
      }
    } catch (error) {
      return { success: false, message: '生成兑换码过程中发生错误' };
    }
  };

  // 获取所有兑换码
  const getRedeemCodes = async (): Promise<RedeemCode[]> => {
    if (!isAdmin()) return [];
    
    try {
      const response = await redeemCodeApi.getAllRedeemCodes();
      if (response.success && response.data) {
        return response.data || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  // 获取所有用户（管理员功能）
  const getAllUsers = async (): Promise<User[]> => {
    if (!isAdmin()) return [];
    
    try {
      const response = await userApi.getAllUsers();
      if (response.success && response.data) {
        return response.data || [];
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  // 删除用户（管理员功能）
  const deleteUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin()) return { success: false, message: '无权限执行此操作' };
    
    try {
      const response = await userApi.deleteUser(userId);
      if (response.success) {
        return { success: true, message: '用户删除成功' };
      } else {
        return { success: false, message: response.message || '删除用户失败' };
      }
    } catch (error) {
      return { success: false, message: '删除用户过程中发生错误' };
    }
  };

  // 管理员注册用户
  const adminRegister = async (userData: Partial<User>): Promise<{ success: boolean; message: string }> => {
    if (!isAdmin()) return { success: false, message: '无权限执行此操作' };
    
    try {
      const response = await userApi.register(userData);
      if (response.success) {
        return { success: true, message: '用户创建成功' };
      } else {
        return { success: false, message: response.message || '用户创建失败' };
      }
    } catch (error) {
      return { success: false, message: '创建用户过程中发生错误' };
    }
  };

  // 提供上下文值
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    updateUser,
    addProgress,
    addPurchase,
    hasPurchased,
    getPurchaseExpiry,
    isQuizCompleted,
    getQuizScore,
    getUserProgress,
    getAnsweredQuestions,
    isAdmin,
    redeemCode,
    generateRedeemCode,
    getRedeemCodes,
    getAllUsers,
    deleteUser,
    adminRegister,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// 创建一个自定义hook以便使用上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 