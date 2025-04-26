import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AddQuestionSet from './AddQuestionSet';
import ManageQuestionSets from './ManageQuestionSets';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add-set' | 'manage-sets'>('add-set');
  const navigate = useNavigate();

  // 将原始的表单提交方法保存起来
  useEffect(() => {
    console.log('AdminPanel 启动 - 添加全局拦截器');
    
    // 保存原始的 submit 方法
    const originalSubmit = HTMLFormElement.prototype.submit;
    
    // 覆盖全局的表单提交方法，防止任何表单提交
    HTMLFormElement.prototype.submit = function() {
      console.log('拦截到表单提交尝试，已阻止');
      // 不执行任何操作
      return false;
    };

    // 拦截所有 GET 请求到 /admin
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async: boolean = true, username?: string | null, password?: string | null) {
      // 如果是对 /admin 的 GET 请求，阻止它
      if (typeof url === 'string' && method.toLowerCase() === 'get' && 
          (url.includes('/admin?') || url.includes('/admin%3F'))) {
        console.log('拦截到对 admin 的 GET 请求:', url);
        // 清除 URL 查询参数
        const baseUrl = url.split('?')[0];
        url = baseUrl;
      }
      
      // 调用原始方法
      return originalOpen.call(this, method, url, async, username, password);
    };

    // 清理函数
    return () => {
      // 恢复原始方法
      HTMLFormElement.prototype.submit = originalSubmit;
      XMLHttpRequest.prototype.open = originalOpen;
    };
  }, []);

  // 手动清除 URL 查询参数
  useEffect(() => {
    if (window.location.search) {
      console.log('检测到 URL 查询参数，清理:', window.location.search);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">管理员控制面板</h1>
        <button 
          onClick={() => navigate('/')} 
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回首页
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'add-set'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('add-set');
            }}
          >
            添加题库
          </button>
          <button
            className={`ml-8 py-2 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'manage-sets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('manage-sets');
            }}
          >
            管理题库
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {activeTab === 'add-set' ? (
          <AddQuestionSet />
        ) : (
          <ManageQuestionSets />
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 