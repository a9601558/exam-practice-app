import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// 首页内容接口
interface HomeContent {
  welcomeTitle: string;
  welcomeDescription: string;
  featuredCategories: string[];
  announcements: string;
  footerText: string;
  bannerImage?: string;
  theme?: 'light' | 'dark' | 'auto';
}

// 默认首页内容
const defaultHomeContent: HomeContent = {
  welcomeTitle: "ExamTopics 模拟练习",
  welcomeDescription: "选择以下任一题库开始练习，测试您的知识水平",
  featuredCategories: ["网络协议", "编程语言", "计算机基础"],
  announcements: "欢迎使用在线题库系统，新增题库将定期更新，请持续关注！",
  footerText: "© 2023 ExamTopics 在线题库系统 保留所有权利",
  bannerImage: "/images/banner.jpg",
  theme: 'light'
};

// 模拟从本地存储获取保存的首页内容
const getStoredHomeContent = (): HomeContent => {
  const stored = localStorage.getItem('homeContent');
  return stored ? JSON.parse(stored) : defaultHomeContent;
};

const AdminHomeContent: React.FC = () => {
  const [content, setContent] = useState<HomeContent>(getStoredHomeContent());
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // 所有可用的分类
  const allCategories = [
    '网络协议', '编程语言', '计算机基础', '数据库', 
    '操作系统', '安全技术', '云计算', '人工智能'
  ];

  // 加载保存的内容
  useEffect(() => {
    const savedContent = getStoredHomeContent();
    setContent(savedContent);
  }, []);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContent(prev => ({
      ...prev,
      [name]: value
    }));
    // 重置应用状态
    setIsApplied(false);
  };

  // 处理多选类别的变化
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // 添加类别
      setContent(prev => ({
        ...prev,
        featuredCategories: [...prev.featuredCategories, value]
      }));
    } else {
      // 移除类别
      setContent(prev => ({
        ...prev,
        featuredCategories: prev.featuredCategories.filter(cat => cat !== value)
      }));
    }
    // 重置应用状态
    setIsApplied(false);
  };

  // 保存内容到本地存储
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      // 保存到本地存储
      localStorage.setItem('homeContent', JSON.stringify(content));
      
      // 显示成功消息
      setStatusMessage({ 
        type: 'success', 
        message: '首页内容已保存！在实际应用中，这些更改将被保存到数据库。' 
      });
    } catch (error) {
      // 显示错误消息
      setStatusMessage({ 
        type: 'error', 
        message: '保存失败，请重试。' 
      });
    }
    
    setIsSaving(false);
    
    // 3秒后清除消息
    setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
  };

  // 应用更改到首页
  const handleApply = () => {
    setIsSaving(true);
    
    try {
      // 保存到本地存储
      localStorage.setItem('homeContent', JSON.stringify(content));
      localStorage.setItem('homeContentApplied', 'true');
      
      // 标记为已应用
      setIsApplied(true);
      
      // 显示成功消息
      setStatusMessage({ 
        type: 'success', 
        message: '首页内容已更新并生效！浏览首页可查看效果。' 
      });
    } catch (error) {
      // 显示错误消息
      setStatusMessage({ 
        type: 'error', 
        message: '应用失败，请重试。' 
      });
    }
    
    setIsSaving(false);
    
    // 3秒后清除消息
    setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
  };

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">首页内容管理</h2>
        <div>
          <button 
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800 mr-4"
          >
            {showPreview ? '隐藏预览' : '显示预览'}
          </button>
          <Link 
            to="/" 
            target="_blank" 
            className="text-sm text-green-600 hover:text-green-800"
          >
            查看首页
          </Link>
        </div>
      </div>
      
      {statusMessage.message && (
        <div 
          className={`mb-6 p-4 rounded-md ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.message}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form className="space-y-6">
          <div>
            <label htmlFor="welcomeTitle" className="block text-sm font-medium text-gray-700">
              欢迎标题
            </label>
            <input
              type="text"
              name="welcomeTitle"
              id="welcomeTitle"
              value={content.welcomeTitle}
              onChange={handleInputChange}
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="welcomeDescription" className="block text-sm font-medium text-gray-700">
              欢迎描述
            </label>
            <textarea
              name="welcomeDescription"
              id="welcomeDescription"
              rows={3}
              value={content.welcomeDescription}
              onChange={handleInputChange}
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="bannerImage" className="block text-sm font-medium text-gray-700">
              首页横幅图片地址 (可选)
            </label>
            <input
              type="text"
              name="bannerImage"
              id="bannerImage"
              value={content.bannerImage || ''}
              onChange={handleInputChange}
              placeholder="如 /images/banner.jpg"
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            />
            <p className="mt-1 text-xs text-gray-500">
              请输入图片的URL地址，留空则不显示横幅
            </p>
          </div>
          
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
              页面主题
            </label>
            <select
              name="theme"
              id="theme"
              value={content.theme || 'light'}
              onChange={handleInputChange}
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            >
              <option value="light">浅色主题</option>
              <option value="dark">深色主题</option>
              <option value="auto">自动（跟随系统）</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              精选分类
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
              {allCategories.map(category => (
                <div key={category} className="flex items-center">
                  <input
                    id={`category-${category}`}
                    name="featuredCategories"
                    type="checkbox"
                    value={category}
                    checked={content.featuredCategories.includes(category)}
                    onChange={handleCategoryChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`category-${category}`} className="ml-3 text-sm text-gray-700">
                    {category}
                  </label>
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              选择在首页突出显示的分类，推荐选择3-5个
            </p>
          </div>
          
          <div>
            <label htmlFor="announcements" className="block text-sm font-medium text-gray-700">
              公告信息
            </label>
            <textarea
              name="announcements"
              id="announcements"
              rows={2}
              value={content.announcements}
              onChange={handleInputChange}
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="footerText" className="block text-sm font-medium text-gray-700">
              页脚文本
            </label>
            <input
              type="text"
              name="footerText"
              id="footerText"
              value={content.footerText}
              onChange={handleInputChange}
              className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
            />
          </div>
          
          <div className="pt-5">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('确定要重置所有内容到默认值吗？此操作不可撤销。')) {
                    setContent(defaultHomeContent);
                    setIsApplied(false);
                  }
                }}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                重置为默认
              </button>
              <div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? '保存中...' : '仅保存'}
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={isSaving || isApplied}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isApplied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? '应用中...' : isApplied ? '已应用到首页' : '保存并应用到首页'}
                </button>
              </div>
            </div>
          </div>
        </form>
        
        {showPreview && (
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-4">预览效果</h3>
            <div className={`bg-gray-50 p-6 rounded-lg border ${content.theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'}`}>
              {content.bannerImage && (
                <div className="w-full h-32 rounded-lg bg-gray-200 mb-4 overflow-hidden">
                  <img 
                    src={content.bannerImage} 
                    alt="首页横幅" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/800x200?text=Banner+Image+Placeholder';
                    }}
                  />
                </div>
              )}
              
              <h1 className="text-xl font-bold text-center">{content.welcomeTitle}</h1>
              <p className={`mt-2 text-center ${content.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {content.welcomeDescription}
              </p>
              
              <div className="mt-4">
                <div className={`text-sm font-medium ${content.theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  精选分类:
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {content.featuredCategories.map(category => (
                    <span key={category} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              
              {content.announcements && (
                <div className={`mt-4 p-3 rounded border ${content.theme === 'dark' ? 'bg-yellow-900 border-yellow-800 text-yellow-100' : 'bg-yellow-50 border-yellow-100'}`}>
                  <div className={`text-sm font-medium ${content.theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>公告:</div>
                  <p className={content.theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}>
                    {content.announcements}
                  </p>
                </div>
              )}
              
              <div className={`mt-6 pt-4 border-t ${content.theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'} text-xs text-center`}>
                {content.footerText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHomeContent; 