import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { QuestionSet, Question } from '../../types';
import { questionSetApi } from '../../utils/api';
import { questionSetBatchApi, validateQuestionSet } from '../../utils/questionSetBatchApi';
import QuestionSetBatchUploadModal from './QuestionSetBatchUploadModal';
import TemplateGenerator from './TemplateGenerator';

// 定义客户端模型类型
interface ClientQuestion {
  id: number;
  question: string;
  questionType: 'single' | 'multiple';
  options: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation: string;
}

interface ClientQuestionSet {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  isPaid: boolean;
  price: number;
  trialQuestions: number;
  questions: ClientQuestion[];
}

// API类型
interface ApiQuestionSet extends Omit<QuestionSet, 'questions'> {
  questions: Question[];
}

// 客户端题目集合映射到API格式的函数 
const mapClientToApiQuestionSet = (clientSet: ClientQuestionSet): Partial<ApiQuestionSet> => {
  return {
    id: clientSet.id,
    title: clientSet.title,
    description: clientSet.description,
    category: clientSet.category,
    icon: clientSet.icon,
    isPaid: clientSet.isPaid,
    price: clientSet.price,
    trialQuestions: clientSet.trialQuestions,
    questions: clientSet.questions.map(q => ({
      id: q.id,
      question: q.question,
      questionType: q.questionType,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }))
  };
};

// API题目集合映射到客户端格式的函数
const mapApiToClientQuestionSet = (apiSet: ApiQuestionSet): ClientQuestionSet => {
  return {
    id: apiSet.id,
    title: apiSet.title,
    description: apiSet.description || '',
    category: apiSet.category,
    icon: apiSet.icon || '📝',
    isPaid: apiSet.isPaid || false,
    price: apiSet.price || 29.9,
    trialQuestions: apiSet.trialQuestions || 0,
    questions: apiSet.questions.map(q => ({
      id: q.id || Math.floor(Math.random() * 10000),
      question: q.question,
      questionType: q.questionType || 'single',
      options: q.options || [],
      correctAnswer: (q as any).correctAnswer || '',
      explanation: q.explanation || ''
    }))
  };
};

const NewAdminQuestionSets: React.FC = () => {
  // 组件状态
  const [localQuestionSets, setLocalQuestionSets] = useState<ClientQuestionSet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: string; message: string }>({ type: '', message: '' });
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(true);
  
  // 批量操作相关
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);
  
  // 编辑相关状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentQuestionSet, setCurrentQuestionSet] = useState<ClientQuestionSet | null>(null);
  
  // 问题编辑相关状态
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ClientQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  
  // 表单状态
  const [formData, setFormData] = useState<ClientQuestionSet>({
    id: '',
    title: '',
    description: '',
    category: '',
    icon: '📝',
    isPaid: false,
    price: 29.9,
    trialQuestions: 0,
    questions: []
  });
  
  // 问题表单状态
  const [questionFormData, setQuestionFormData] = useState<ClientQuestion>({
    id: 0,
    question: '',
    questionType: 'single',
    options: [],
    correctAnswer: '',
    explanation: ''
  });
  
  // 选项输入状态
  const [optionInput, setOptionInput] = useState<{ id: string; text: string }>({ id: '', text: '' });
  
  // 文件上传相关
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 获取路由位置
  const location = useLocation();
  
  // 显示状态消息
  const showStatusMessage = (type: string, message: string) => {
    setStatusMessage({ type, message });
    // 3秒后自动清除消息
    setTimeout(() => {
      setStatusMessage({ type: '', message: '' });
    }, 3000);
  };
  
  // 加载题库列表
  const loadQuestionSets = useCallback(async () => {
    setLoadingQuestionSets(true);
    
    try {
      const response = await questionSetApi.getAllQuestionSets();
      
      if (response.success && response.data) {
        const clientQuestionSets = response.data.map(mapApiToClientQuestionSet as any);
        setLocalQuestionSets(clientQuestionSets);
      } else {
        showStatusMessage('error', '获取题库列表失败');
      }
    } catch (error) {
      console.error('加载题库失败:', error);
      showStatusMessage('error', '加载题库时出现错误');
    } finally {
      setLoadingQuestionSets(false);
    }
  }, []);
  
  // 初始化时加载数据
  useEffect(() => {
    loadQuestionSets();
  }, [loadQuestionSets]);
  
  // 处理URL查询参数
  useEffect(() => {
    // 获取URL参数
    const queryParams = new URLSearchParams(location.search);
    
    // 如果URL包含任何查询参数，直接清除它们并更新URL
    if (queryParams.toString()) {
      console.log('检测到URL查询参数，清理URL');
      // 使用window.history API直接更新URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);
  
  // 处理表单变更
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // 处理复选框
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
      return;
    }
    
    // 处理数字输入
    if (type === 'number') {
      const numberValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numberValue) ? 0 : numberValue
      }));
      return;
    }
    
    // 处理普通文本输入
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 创建新题库
  const handleCreateSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // 验证表单
    const errors = validateQuestionSet(formData);
    if (Object.keys(errors).length > 0) {
      let errorMessage = "表单验证失败:\n";
      Object.values(errors).forEach(msgs => {
        errorMessage += msgs.join('\n') + '\n';
      });
      showStatusMessage('error', errorMessage);
      return;
    }

    // 检查ID是否已存在
    if (localQuestionSets.some(set => set.id === formData.id)) {
      showStatusMessage('error', 'ID已存在，请使用另一个ID');
      return;
    }

    // 准备API格式的数据
    const questionSetData = mapClientToApiQuestionSet(formData);

    setLoading(true);
    setLoadingAction('create');
    
    try {
      const response = await questionSetApi.createQuestionSet(questionSetData);
      
      if (response.success && response.data) {
        // 转换为客户端格式并更新本地列表
        const clientQuestionSet = mapApiToClientQuestionSet(response.data as any);
        setLocalQuestionSets(prev => [...prev, clientQuestionSet]);
        
        // 显示成功消息
        showStatusMessage('success', '题库创建成功！');
        
        // 重置表单并关闭
        setFormData({
          id: '',
          title: '',
          description: '',
          category: '',
          icon: '📝',
          isPaid: false,
          price: 29.9,
          trialQuestions: 0,
          questions: []
        });
        setShowCreateForm(false);
      } else {
        // 显示错误消息
        showStatusMessage('error', `创建题库失败: ${response.error || response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('创建题库时出错:', error);
      showStatusMessage('error', '创建题库时出现错误');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };
  
  // 打开编辑表单
  const handleEditClick = (questionSet: ClientQuestionSet) => {
    setCurrentQuestionSet(questionSet);
    setFormData({
      id: questionSet.id,
      title: questionSet.title,
      description: questionSet.description,
      category: questionSet.category,
      icon: questionSet.icon,
      isPaid: questionSet.isPaid || false,
      price: questionSet.price || 29.9,
      trialQuestions: questionSet.trialQuestions || 0,
      questions: questionSet.questions
    });
    setShowEditForm(true);
  };
  
  // 更新题库
  const handleEditSubmit = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!currentQuestionSet) return;
    
    // 验证表单
    const errors = validateQuestionSet(formData);
    if (Object.keys(errors).length > 0) {
      let errorMessage = "表单验证失败:\n";
      Object.values(errors).forEach(msgs => {
        errorMessage += msgs.join('\n') + '\n';
      });
      showStatusMessage('error', errorMessage);
      return;
    }

    // 转换为API格式
    const questionSetData = mapClientToApiQuestionSet(formData);

    setLoading(true);
    setLoadingAction('edit');
    
    try {
      const response = await questionSetApi.updateQuestionSet(formData.id, questionSetData);
      
      if (response.success && response.data) {
        // 转换为客户端格式并更新本地列表
        const clientQuestionSet = mapApiToClientQuestionSet(response.data as any);
        setLocalQuestionSets(prev => 
          prev.map(set => set.id === formData.id ? clientQuestionSet : set)
        );
        
        // 显示成功消息
        showStatusMessage('success', '题库更新成功！');
        
        // 重置表单并关闭
        setCurrentQuestionSet(null);
        setShowEditForm(false);
      } else {
        // 显示错误消息
        showStatusMessage('error', `更新题库失败: ${response.error || response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('更新题库时出错:', error);
      showStatusMessage('error', '更新题库时出现错误');
    } finally {
      setLoading(false);
      setLoadingAction('');
    }
  };
  
  // 删除题库
  const handleDeleteQuestionSet = async (id: string) => {
    if (window.confirm('确定要删除此题库吗？此操作不可逆。')) {
      setLoading(true);
      setLoadingAction('delete');
      
      try {
        const response = await questionSetApi.deleteQuestionSet(id);
        
        if (response.success) {
          // 从列表中移除题库
          setLocalQuestionSets(prev => prev.filter(set => set.id !== id));
          
          // 显示成功消息
          showStatusMessage('success', '题库删除成功！');
        } else {
          // 显示错误消息
          showStatusMessage('error', `删除题库失败: ${response.error || response.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('删除题库时出错:', error);
        showStatusMessage('error', '删除题库时出现错误');
      } finally {
        setLoading(false);
        setLoadingAction('');
      }
    }
  };
  
  // 批量删除题库
  const handleBatchDelete = async () => {
    if (selectedSets.length === 0) {
      showStatusMessage('error', '请先选择要删除的题库');
      return;
    }
    
    if (window.confirm(`确定要删除选中的 ${selectedSets.length} 个题库吗？此操作不可逆。`)) {
      setLoading(true);
      setLoadingAction('batchDelete');
      
      try {
        const response = await questionSetBatchApi.batchOperation('delete', selectedSets);
        
        if (response.success) {
          // 从列表中移除题库
          setLocalQuestionSets(prev => prev.filter(set => !selectedSets.includes(set.id)));
          
          // 清空选择
          setSelectedSets([]);
          
          // 显示成功消息
          showStatusMessage('success', `成功删除 ${selectedSets.length} 个题库`);
        } else {
          // 显示错误消息
          showStatusMessage('error', `批量删除失败: ${response.error || response.message || '未知错误'}`);
        }
      } catch (error) {
        console.error('批量删除题库时出错:', error);
        showStatusMessage('error', '批量删除题库时出现错误');
      } finally {
        setLoading(false);
        setLoadingAction('');
      }
    }
  };
  
  // 处理批量上传后的回调
  const handleBatchUploadSuccess = (questionSets: QuestionSet[]) => {
    // 转换为客户端格式并更新本地列表
    const clientQuestionSets = questionSets.map(set => mapApiToClientQuestionSet(set as any));
    
    // 更新本地数据
    setLocalQuestionSets(prev => {
      // 合并新的题库数据，如果ID已存在则更新
      const newSets = [...prev];
      clientQuestionSets.forEach(newSet => {
        const index = newSets.findIndex(set => set.id === newSet.id);
        if (index >= 0) {
          newSets[index] = newSet;
        } else {
          newSets.push(newSet);
        }
      });
      return newSets;
    });
    
    // 关闭模态框
    setShowBatchUploadModal(false);
    
    // 显示成功消息
    showStatusMessage('success', `成功上传 ${questionSets.length} 个题库`);
  };
  
  // 处理全选/取消全选
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSets(localQuestionSets.map(set => set.id));
    } else {
      setSelectedSets([]);
    }
  };
  
  // 处理单个选择
  const handleSelectSet = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSets(prev => [...prev, id]);
    } else {
      setSelectedSets(prev => prev.filter(setId => setId !== id));
    }
  };
  
  // 筛选题库列表
  const filteredQuestionSets = localQuestionSets.filter(set => 
    set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 可用的图标选项
  const iconOptions = ['📝', '📚', '🧠', '🔍', '💻', '🌐', '🔐', '📊', '⚙️', '🗄️', '📡', '🧮'];
  
  // 可用的分类选项
  const categoryOptions = ['网络协议', '编程语言', '计算机基础', '数据库', '操作系统', '安全技术', '云计算', '人工智能'];
  
  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-lg leading-6 font-medium text-gray-900">题库管理</h2>
        
        {/* 工具栏 */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="搜索题库..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={loading}
              className={`whitespace-nowrap inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建新题库
            </button>
          </div>
        </div>
      </div>
      
      {/* 批量操作工具栏 */}
      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={() => setShowBatchUploadModal(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          批量上传题库
        </button>
        
        <button
          onClick={() => setShowTemplateGenerator(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          下载模板
        </button>
        
        {selectedSets.length > 0 && (
          <button
            onClick={handleBatchDelete}
            disabled={loading && loadingAction === 'batchDelete'}
            className={`inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white ${
              loading && loadingAction === 'batchDelete'
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除选中({selectedSets.length})
          </button>
        )}
      </div>
      
      {statusMessage.message && (
        <div 
          className={`mb-4 p-4 rounded-md ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.message}
        </div>
      )}
      
      {/* 加载指示器 */}
      {loadingQuestionSets && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-700">加载题库中...</span>
        </div>
      )}
      
      {/* 题库列表 */}
      {!loadingQuestionSets && (
        <div className="mt-4">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedSets.length === localQuestionSets.length && localQuestionSets.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">标题</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">分类</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">付费状态</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">题目数量</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">描述</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4">
                    <span className="sr-only">操作</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredQuestionSets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-sm text-gray-500">
                      没有找到匹配的题库
                    </td>
                  </tr>
                ) : (
                  filteredQuestionSets.map(set => (
                    <tr key={set.id} className={selectedSets.includes(set.id) ? 'bg-blue-50' : undefined}>
                      <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                        <input
                          type="checkbox"
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedSets.includes(set.id)}
                          onChange={(e) => handleSelectSet(set.id, e.target.checked)}
                        />
                      </td>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2 text-xl">{set.icon}</span>
                          {set.title}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          {set.category}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        {set.isPaid ? (
                          <div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                              付费 ¥{set.price}
                            </span>
                            {set.trialQuestions && set.trialQuestions > 0 && (
                              <p className="text-xs text-gray-500 mt-1">
                                可试用{set.trialQuestions}题
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                            免费
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {set.questions.length}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-md truncate">
                        {set.description}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                        <button
                          className="text-blue-600 hover:text-blue-900 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleEditClick(set)}
                          disabled={loading}
                        >
                          编辑
                        </button>
                        <button
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDeleteQuestionSet(set.id)}
                          disabled={loading}
                        >
                          {loading && loadingAction === 'delete' ? '删除中...' : '删除'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 批量上传模态框 */}
      {showBatchUploadModal && (
        <QuestionSetBatchUploadModal
          isOpen={showBatchUploadModal}
          onClose={() => setShowBatchUploadModal(false)}
          onUploadSuccess={handleBatchUploadSuccess}
        />
      )}
      
      {/* 模板生成器模态框 */}
      {showTemplateGenerator && (
        <TemplateGenerator
          onClose={() => setShowTemplateGenerator(false)}
        />
      )}
    </div>
  );
};

export default NewAdminQuestionSets; 