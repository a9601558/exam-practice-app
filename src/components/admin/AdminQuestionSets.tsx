import React, { useState, useEffect, useCallback } from 'react';
import { questionSets } from '../../data/questionSets';
import { Question } from '../../data/questions';
import { QuestionSet } from '../../data/questionSets';
import { RedeemCode } from '../../types';
import { useUser } from '../../contexts/UserContext';

const AdminQuestionSets: React.FC = () => {
  const { generateRedeemCode, getRedeemCodes } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [localQuestionSets, setLocalQuestionSets] = useState([...questionSets]);
  const [currentQuestionSet, setCurrentQuestionSet] = useState<QuestionSet | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    category: '',
    icon: '📝',
    isPaid: false,
    price: 29.9,
    trialQuestions: 0,
    questions: [] as Question[]
  });

  // 新增状态 - 兑换码相关
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [showRedeemCodeModal, setShowRedeemCodeModal] = useState(false);
  const [selectedQuizForCode, setSelectedQuizForCode] = useState<QuestionSet | null>(null);
  const [codeDurationDays, setCodeDurationDays] = useState(30);
  const [generatedCode, setGeneratedCode] = useState<RedeemCode | null>(null);
  const [codeFilterStatus, setCodeFilterStatus] = useState('all');
  const [codeFilterQuizId, setCodeFilterQuizId] = useState<string | null>(null);

  // 加载所有兑换码
  useEffect(() => {
    setRedeemCodes(getRedeemCodes());
  }, [getRedeemCodes]);

  // 搜索过滤题库
  const filteredQuestionSets = localQuestionSets.filter(set => 
    set.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    set.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 显示状态消息
  const showStatusMessage = (type: string, message: string) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
  };

  // 处理表单字段变化
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

  // 处理创建题库提交
  const handleCreateSubmit = () => {
    // 验证表单
    if (!formData.id || !formData.title || !formData.category) {
      showStatusMessage('error', '请填写所有必填字段');
      return;
    }

    // 检查ID是否已存在
    if (localQuestionSets.some(set => set.id === formData.id)) {
      showStatusMessage('error', 'ID已存在，请使用另一个ID');
      return;
    }

    // 验证付费题库的价格
    if (formData.isPaid && (formData.price <= 0 || isNaN(formData.price))) {
      showStatusMessage('error', '付费题库需要设置有效的价格');
      return;
    }

    // 创建新题库
    const newQuestionSet: QuestionSet = {
      ...formData,
      questions: []
    };

    // 更新本地题库列表
    setLocalQuestionSets([...localQuestionSets, newQuestionSet]);
    
    // 显示成功消息
    showStatusMessage('success', '题库创建成功！在实际应用中，这将被保存到数据库。');
    
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
  };

  // 打开编辑表单
  const handleEditClick = (questionSet: QuestionSet) => {
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

  // 处理编辑题库提交
  const handleEditSubmit = () => {
    // 验证表单
    if (!formData.title || !formData.category) {
      showStatusMessage('error', '请填写所有必填字段');
      return;
    }

    // 验证付费题库的价格
    if (formData.isPaid && (formData.price <= 0 || isNaN(formData.price))) {
      showStatusMessage('error', '付费题库需要设置有效的价格');
      return;
    }

    // 更新题库
    const updatedQuestionSets = localQuestionSets.map(set => 
      set.id === formData.id 
        ? { 
            ...set, 
            title: formData.title,
            description: formData.description,
            category: formData.category,
            icon: formData.icon,
            isPaid: formData.isPaid,
            price: formData.isPaid ? formData.price : undefined,
            trialQuestions: formData.isPaid ? formData.trialQuestions : undefined
          } 
        : set
    );

    // 更新本地题库列表
    setLocalQuestionSets(updatedQuestionSets);
    
    // 显示成功消息
    showStatusMessage('success', '题库更新成功！在实际应用中，这将被保存到数据库。');
    
    // 重置表单并关闭
    setCurrentQuestionSet(null);
    setShowEditForm(false);
  };

  // 处理删除题库
  const handleDeleteQuestionSet = (id: string) => {
    if (window.confirm('确定要删除此题库吗？此操作不可逆。')) {
      // 从列表中移除题库
      const updatedQuestionSets = localQuestionSets.filter(set => set.id !== id);
      setLocalQuestionSets(updatedQuestionSets);
      
      // 显示成功消息
      showStatusMessage('success', '题库删除成功！在实际应用中，这将从数据库中删除。');
    }
  };

  // 可用的图标选项
  const iconOptions = ['📝', '📚', '🧠', '🔍', '💻', '🌐', '🔐', '📊', '⚙️', '🗄️', '📡', '🧮'];
  
  // 可用的分类选项
  const categoryOptions = ['网络协议', '编程语言', '计算机基础', '数据库', '操作系统', '安全技术', '云计算', '人工智能'];

  // 显示生成兑换码弹窗
  const handleShowGenerateCodeModal = (questionSet: QuestionSet) => {
    setSelectedQuizForCode(questionSet);
    setCodeDurationDays(30); // 默认30天
    setGeneratedCode(null);
    setShowRedeemCodeModal(true);
  };
  
  // 生成兑换码
  const handleGenerateCode = () => {
    if (!selectedQuizForCode) return;
    
    try {
      const newCode = generateRedeemCode(selectedQuizForCode.id, codeDurationDays);
      if (Array.isArray(newCode)) {
        // 处理返回数组的情况
        setRedeemCodes([...redeemCodes, ...newCode]);
        setGeneratedCode(newCode[0]); // 显示第一个生成的码
      } else {
        // 处理返回单个对象的情况
        setRedeemCodes([...redeemCodes, newCode]);
        setGeneratedCode(newCode);
      }
      showStatusMessage("success", `已成功生成兑换码: ${Array.isArray(newCode) ? newCode[0].code : newCode.code}`);
    } catch (error) {
      if (error instanceof Error) {
        showStatusMessage("error", error.message);
      } else {
        showStatusMessage("error", "生成兑换码失败");
      }
    }
  };

  // 过滤兑换码
  const filterRedeemCodes = useCallback(() => {
    return redeemCodes.filter(code => {
      // 按状态过滤
      if (codeFilterStatus === 'used' && !code.usedAt) {
        return false;
      }
      if (codeFilterStatus === 'unused' && code.usedAt) {
        return false;
      }
      
      // 按题目集过滤
      if (codeFilterQuizId && code.questionSetId !== codeFilterQuizId) {
        return false;
      }
      
      return true;
    });
  }, [redeemCodes, codeFilterStatus, codeFilterQuizId]);
  
  // 计算过滤后的兑换码
  const filteredCodes = filterRedeemCodes();

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">题库管理</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索题库..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            onClick={() => setShowCreateForm(true)}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            新建题库
          </button>
        </div>
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
      
      {/* 创建题库表单 */}
      {showCreateForm && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">创建新题库</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="id" className="block text-sm font-medium text-gray-700">
                ID <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="id"
                  id="id"
                  value={formData.id}
                  onChange={handleFormChange}
                  placeholder="唯一标识符，如 'network'"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                标题 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="如 '网络协议'"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                分类 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">选择分类...</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700">
                图标
              </label>
              <div className="mt-1">
                <select
                  id="icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-center">
                <input
                  id="isPaid"
                  name="isPaid"
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
                  设为付费题库
                </label>
              </div>
            </div>

            {formData.isPaid && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    价格（元） <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.1"
                      value={formData.price}
                      onChange={handleFormChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">用户需支付此金额才能使用完整题库，有效期为6个月</p>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="trialQuestions" className="block text-sm font-medium text-gray-700">
                    免费试用题目数量
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="trialQuestions"
                      id="trialQuestions"
                      min="0"
                      step="1"
                      value={formData.trialQuestions}
                      onChange={handleFormChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">设置为0表示不提供试用题目</p>
                </div>
              </>
            )}

            <div className="sm:col-span-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                描述
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="题库的简短描述"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCreateSubmit}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              创建
            </button>
          </div>
        </div>
      )}
      
      {/* 编辑题库表单 */}
      {showEditForm && currentQuestionSet && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">编辑题库</h3>
            <button
              onClick={() => setShowEditForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">
                标题 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="edit-title"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
                分类 <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <select
                  id="edit-category"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                >
                  <option value="">选择分类...</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="edit-icon" className="block text-sm font-medium text-gray-700">
                图标
              </label>
              <div className="mt-1">
                <select
                  id="edit-icon"
                  name="icon"
                  value={formData.icon}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-6">
              <div className="flex items-center">
                <input
                  id="edit-isPaid"
                  name="isPaid"
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="edit-isPaid" className="ml-2 block text-sm text-gray-700">
                  设为付费题库
                </label>
              </div>
            </div>

            {formData.isPaid && (
              <>
                <div className="sm:col-span-3">
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">
                    价格（元） <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="price"
                      id="edit-price"
                      min="0"
                      step="0.1"
                      value={formData.price}
                      onChange={handleFormChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">用户需支付此金额才能使用完整题库，有效期为6个月</p>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="edit-trialQuestions" className="block text-sm font-medium text-gray-700">
                    免费试用题目数量
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="trialQuestions"
                      id="edit-trialQuestions"
                      min="0"
                      step="1"
                      value={formData.trialQuestions}
                      onChange={handleFormChange}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">设置为0表示不提供试用题目</p>
                </div>
              </>
            )}

            <div className="sm:col-span-6">
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                描述
              </label>
              <div className="mt-1">
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleFormChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 mb-2">
            <p className="text-sm text-gray-600">题目数量：{currentQuestionSet.questions.length}</p>
            <button
              type="button"
              onClick={() => showStatusMessage('info', '题目管理功能正在开发中...')}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              管理题目 »
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="mr-3 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleEditSubmit}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              保存更改
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
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
                  <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                    没有找到匹配的题库
                  </td>
                </tr>
              ) : (
                filteredQuestionSets.map(set => (
                  <tr key={set.id}>
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
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        onClick={() => handleEditClick(set)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteQuestionSet(set.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          共 {filteredQuestionSets.length} 个题库
        </div>
      </div>

      {/* 生成兑换码弹窗 */}
      {showRedeemCodeModal && selectedQuizForCode && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    为 <span className="text-blue-600">{selectedQuizForCode.title}</span> 生成兑换码
                  </h3>
                  <div className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        有效期 (天)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        id="duration"
                        min="1"
                        max="365"
                        value={codeDurationDays}
                        onChange={(e) => setCodeDurationDays(Math.max(1, parseInt(e.target.value) || 30))}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    {generatedCode && (
                      <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                        <div className="flex justify-between items-center">
                          <span className="text-green-800 font-medium">生成的兑换码:</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(generatedCode.code)}
                            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 px-2 rounded-md"
                          >
                            复制
                          </button>
                        </div>
                        <div className="mt-2 text-xl font-mono text-center text-green-700 select-all py-2 px-4 bg-white rounded border border-green-200">
                          {generatedCode.code}
                        </div>
                        <p className="mt-2 text-sm text-green-700">
                          此兑换码可兑换 {selectedQuizForCode.title} 题库 {codeDurationDays} 天的使用权限
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              {!generatedCode ? (
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  生成兑换码
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedCode(null);
                    setCodeDurationDays(30);
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  生成新兑换码
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRedeemCodeModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 兑换码列表 */}
      <div className="mt-6 border p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">兑换码列表</h2>
        
        {/* 筛选控制 */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">状态</label>
            <select
              className="border rounded p-2 w-full"
              value={codeFilterStatus}
              onChange={(e) => setCodeFilterStatus(e.target.value)}
            >
              <option value="all">全部</option>
              <option value="used">已使用</option>
              <option value="unused">未使用</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">题目集</label>
            <select
              className="border rounded p-2 w-full"
              value={codeFilterQuizId || ''}
              onChange={(e) => setCodeFilterQuizId(e.target.value || null)}
            >
              <option value="">全部题目集</option>
              {localQuestionSets.map((set) => (
                <option key={set.id} value={set.id}>
                  {set.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {filteredCodes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">没有符合条件的兑换码</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">兑换码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">题目集</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期(天)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">使用者</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCodes.map((code) => (
                  <tr key={code.code}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{code.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {localQuestionSets.find(q => q.id === code.questionSetId)?.title || '未找到题目集'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{code.validityDays}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(code.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.usedAt ? '已使用' : '未使用'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {code.usedBy ? code.usedBy : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminQuestionSets; 