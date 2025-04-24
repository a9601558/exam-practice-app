import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { MOCK_USERS } from '../data/mockUsers';
import { User, Purchase, RedeemCode } from '../types';

// 用户进度记录类型
export interface QuizProgress {
  quizId: string;
  quizTitle: string;
  completedDate: string; // ISO 日期字符串
  correctCount: number;
  totalCount: number;
  wrongAnswers?: { 
    questionId: number; 
    userAnswer: string | string[]; 
  }[];
}

// 兑换码类型数组
const MOCK_REDEEM_CODES: RedeemCode[] = [
  {
    code: 'EXAM-2023-ABC1',
    questionSetId: '1',
    validityDays: 30,
    createdAt: new Date().toISOString(),
  },
  {
    code: 'EXAM-2023-ABC2',
    questionSetId: '2',
    validityDays: 60,
    createdAt: new Date().toISOString(),
    usedBy: 'user1',
    usedAt: new Date().toISOString(),
  },
];

// 上下文类型定义
interface UserContextType {
  user: User | null;
  users: User[];
  setUser: (user: User | null) => void;
  login: (usernameOrEmail: string, password: string) => boolean;
  logout: () => void;
  register: (username: string, email: string, password: string) => boolean;
  updateUser: (userIdOrUpdates: string | Partial<User>, updates?: Partial<User>) => boolean;
  addProgress: (quizId: string, isCorrect: boolean) => void;
  addPurchase: (purchase: Purchase) => void;
  hasPurchased: (quizId: string) => boolean;
  getPurchaseExpiry: (quizId: string) => string | null;
  isAdmin: () => boolean;
  redeemCode: (code: string) => Promise<{ 
    success: boolean; 
    message: string; 
    quizId?: string;
    quizTitle?: string;
    expiryDate?: string;
    durationDays?: number;
  }>;
  getRedeemCodes: () => RedeemCode[];
  generateRedeemCode: (questionSetId: string, validityDays: number, quantity?: number) => RedeemCode[] | RedeemCode;
  isLoading: boolean;
  // 管理员功能
  getAllUsers: () => User[];
  deleteUser: (userId: string) => boolean;
  adminRegister: (username: string, email: string, password: string) => Promise<boolean>;
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined);

// 上下文提供者组件
export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(MOCK_REDEEM_CODES);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage
  useEffect(() => {
    setIsLoading(true);
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [user]);

  const login = (usernameOrEmail: string, password: string): boolean => {
    // 支持用户名或邮箱登录
    const foundUser = users.find(
      (u) => (u.username === usernameOrEmail || u.email === usernameOrEmail) && u.password === password
    );
    
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const register = (username: string, email: string, password: string): boolean => {
    // Check if username already exists
    if (users.some((u) => u.username === username || u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: `user${users.length + 1}`,
      username,
      password,
      email,
      isAdmin: false,
      progress: {},
      purchases: [],
      redeemCodes: []
    };

    setUsers([...users, newUser]);
    setUser(newUser);
    return true;
  };

  const updateUser = (userIdOrUpdates: string | Partial<User>, updates?: Partial<User>): boolean => {
    // 如果第一个参数是对象，那么是更新当前用户
    if (typeof userIdOrUpdates === 'object') {
      if (!user) return false;

      const updatedUser = { ...user, ...userIdOrUpdates };
      setUser(updatedUser);

      // 同时更新用户数组
      setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
      return true;
    } 
    // 如果第一个参数是字符串，那么是指定用户ID，以管理员身份更新任意用户
    else if (typeof userIdOrUpdates === 'string' && updates) {
      const userId = userIdOrUpdates;
      const userToUpdate = users.find(u => u.id === userId);
      
      if (!userToUpdate) return false;
      
      const updatedUser = { ...userToUpdate, ...updates };
      
      // 更新用户数组
      setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
      
      // 如果当前登录用户就是被修改的用户，也需要更新当前用户状态
      if (user && user.id === userId) {
        setUser(updatedUser);
      }
      
      return true;
    }
    
    return false;
  };

  const addProgress = (quizId: string, isCorrect: boolean) => {
    if (!user) return;

    const updatedProgress = { ...user.progress };
    if (!updatedProgress[quizId]) {
      updatedProgress[quizId] = {
        completedQuestions: 1,
        totalQuestions: 0, // Will be set properly from QuizPage
        correctAnswers: isCorrect ? 1 : 0,
        lastAccessed: new Date().toISOString(),
      };
    } else {
      updatedProgress[quizId] = {
        ...updatedProgress[quizId],
        completedQuestions: updatedProgress[quizId].completedQuestions + 1,
        correctAnswers: updatedProgress[quizId].correctAnswers + (isCorrect ? 1 : 0),
        lastAccessed: new Date().toISOString(),
      };
    }

    updateUser({ progress: updatedProgress });
  };

  const addPurchase = (purchase: Purchase) => {
    if (!user) return;

    const updatedPurchases = user.purchases ? [...user.purchases, purchase] : [purchase];
    updateUser({ purchases: updatedPurchases });
  };

  const hasPurchased = (quizId: string): boolean => {
    if (!user || !user.purchases || user.purchases.length === 0) {
      return false;
    }

    return user.purchases.some(p => 
      p.quizId === quizId && 
      new Date(p.expiryDate) > new Date()
    );
  };

  const getPurchaseExpiry = (quizId: string): string | null => {
    if (!user || !user.purchases || user.purchases.length === 0) {
      return null;
    }

    const purchase = user.purchases.find(p => p.quizId === quizId);
    return purchase ? purchase.expiryDate : null;
  };

  const isAdmin = (): boolean => {
    return user?.isAdmin === true;
  };

  // Generate redeem codes for a quiz
  const generateRedeemCode = (questionSetId: string, validityDays: number, quantity = 1): RedeemCode[] | RedeemCode => {
    // Generate array to hold the new codes
    const newCodes: RedeemCode[] = [];
    
    for (let i = 0; i < quantity; i++) {
      // Generate a random code (format: EXAM-YYYY-XXXX where XXXX is random alphanumeric)
      const randChars = Math.random().toString(36).substring(2, 6).toUpperCase();
      const year = new Date().getFullYear();
      const code = `EXAM-${year}-${randChars}`;
      
      const newCode: RedeemCode = {
        code,
        questionSetId,
        validityDays,
        createdAt: new Date().toISOString(),
      };
      
      newCodes.push(newCode);
    }
    
    // Update the state with new codes
    setRedeemCodes([...redeemCodes, ...newCodes]);
    
    // Return single code or array based on quantity
    return quantity === 1 ? newCodes[0] : newCodes;
  };
  
  // Redeem a code to get access to a quiz
  const redeemCode = async (code: string): Promise<{ 
    success: boolean; 
    message: string; 
    quizId?: string;
    quizTitle?: string;
    expiryDate?: string;
    durationDays?: number;
  }> => {
    // Find the code
    const foundCode = redeemCodes.find(rc => rc.code === code);
    
    if (!foundCode) {
      return { success: false, message: '兑换码无效' };
    }
    
    if (foundCode.usedAt) {
      return { success: false, message: '兑换码已被使用' };
    }
    
    if (!user) {
      return { success: false, message: '请先登录再兑换' };
    }
    
    // Mock quiz title from quiz ID
    const quizTitle = `题库 ${foundCode.questionSetId}`;
    
    // Mark the code as used
    const updatedRedeemCodes = redeemCodes.map(rc => 
      rc.code === code ? { 
        ...rc, 
        usedBy: user.id,
        usedAt: new Date().toISOString()
      } : rc
    );
    setRedeemCodes(updatedRedeemCodes);
    
    // Add purchase to user
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + foundCode.validityDays);
    
    const purchase: Purchase = {
      quizId: foundCode.questionSetId,
      expiryDate: expiryDate.toISOString(),
      purchaseDate: new Date().toISOString(),
      transactionId: `REDEEM-${code}`,
      amount: 0 // Redeemed codes have zero amount
    };
    
    addPurchase(purchase);
    
    // Return success with quiz details
    return { 
      success: true, 
      message: '兑换成功', 
      quizId: foundCode.questionSetId,
      quizTitle,
      expiryDate: purchase.expiryDate,
      durationDays: foundCode.validityDays
    };
  };
  
  const getRedeemCodes = (): RedeemCode[] => {
    return redeemCodes;
  };

  // 添加管理员功能
  const getAllUsers = (): User[] => {
    return users;
  };

  const deleteUser = (userId: string): boolean => {
    // 不允许删除当前登录用户
    if (user && user.id === userId) {
      return false;
    }
    
    // 从用户数组中删除用户
    const updatedUsers = users.filter(u => u.id !== userId);
    if (updatedUsers.length === users.length) {
      // 没有删除任何用户
      return false;
    }
    
    setUsers(updatedUsers);
    return true;
  };

  const adminRegister = async (username: string, email: string, password: string): Promise<boolean> => {
    // 检查用户名和邮箱是否已存在
    if (users.some((u) => u.username === username || u.email === email)) {
      return false;
    }

    const newUser: User = {
      id: `user${users.length + 1}`,
      username,
      password,
      email,
      isAdmin: false,
      progress: {},
      purchases: [],
      redeemCodes: []
    };

    setUsers([...users, newUser]);
    return true;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        users,
        setUser,
        login,
        logout,
        register,
        updateUser,
        addProgress,
        addPurchase,
        hasPurchased,
        getPurchaseExpiry,
        isAdmin,
        redeemCode,
        getRedeemCodes,
        generateRedeemCode,
        isLoading,
        getAllUsers,
        deleteUser,
        adminRegister
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// 自定义hook，方便在组件中使用上下文
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 