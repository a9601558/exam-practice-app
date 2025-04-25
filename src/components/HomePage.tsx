import { useState } from 'react';
import { Link } from 'react-router-dom';
import { questionSets } from '../data/questionSets';
import UserMenu from './UserMenu';
import { useUser } from '../contexts/UserContext';
import LoginModal from './LoginModal';

const HomePage = () => {
  const { user, isAdmin, getPurchaseExpiry } = useUser();
  // 获取所有的分类
  const categories = [...new Set(questionSets.map(set => set.category))];
  // 控制登录弹窗
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  // 显示用户信息
  const [showUserInfo, setShowUserInfo] = useState(false);

  // 格式化到期日期为用户友好的格式
  const formatExpiryDate = (dateInput: Date | string | null) => {
    if (!dateInput) return '';
    
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString();
  };

  // 计算剩余天数
  const calculateRemainingDays = (dateInput: Date | string | null) => {
    if (!dateInput) return 0;
    
    const expiryDate = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto">
        {/* 用户菜单 - 右上角 */}
        <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
          <UserMenu />
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">ExamTopics 模拟练习</h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5">
              选择以下任一题库开始练习，测试您的知识水平
            </p>
            
            {user && (
              <div className="mt-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-100 rounded-lg p-6 mx-auto max-w-2xl shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-green-800">欢迎回来，{user.username}！</h3>
                  <button
                    onClick={() => setShowUserInfo(!showUserInfo)}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {showUserInfo ? '隐藏详情' : '查看详情'}
                  </button>
                </div>
                
                {showUserInfo && (
                  <div className="mt-3 text-sm text-green-700">
                    <p><strong>用户ID:</strong> {user.id}</p>
                    <p><strong>邮箱:</strong> {user.email}</p>
                    <p><strong>管理员权限:</strong> {user.isAdmin ? '是' : '否'}</p>
                    <p><strong>已完成题目数:</strong> {Object.values(user.progress).reduce((acc, curr) => acc + curr.completedQuestions, 0)}</p>
                    <p><strong>已购买题库数:</strong> {user.purchases?.length || 0}</p>
                  </div>
                )}
              </div>
            )}
            
            {!user && (
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-6 mx-auto max-w-2xl shadow-sm">
                <h3 className="text-lg font-medium text-blue-800 mb-2">随时开始，无需登录</h3>
                <p className="text-sm text-blue-600 mb-4">
                  您可以直接开始答题，但登录后可以保存答题进度、查看错题记录，以及收藏喜欢的题库。
                </p>
                <button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  登录账号
                </button>
              </div>
            )}
            
            {/* 管理员入口 */}
            {user && isAdmin() && (
              <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4 mx-auto max-w-2xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-md font-medium text-purple-800">管理员控制面板</h3>
                    <p className="text-sm text-purple-600">
                      您可以管理用户、题库和网站内容
                    </p>
                  </div>
                  <Link 
                    to="/admin"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    进入管理后台
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 分类显示 */}
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category} className="bg-white overflow-hidden shadow-md rounded-lg">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">{category}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3">
                  {questionSets
                    .filter(set => set.category === category)
                    .map(set => {
                      // 检查用户是否购买了此题库，以及获取过期时间
                      const isPaid = set.isPaid;
                      const expiry = user && isPaid ? getPurchaseExpiry(set.id) : null;
                      const hasPaid = user && isPaid && expiry !== null;
                      const remainingDays = calculateRemainingDays(expiry);

                      return (
                        <Link
                          to={`/quiz/${set.id}`}
                          key={set.id}
                          className="block relative p-4 bg-white border rounded-lg transition-transform transform hover:scale-105 hover:shadow-lg"
                        >
                          {/* 付费标识 */}
                          {isPaid && (
                            <div className="absolute top-2 right-2">
                              {hasPaid ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                  已购买 · 剩余 {remainingDays} 天
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                  付费 · ¥{set.price}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center">
                            <div className="flex-shrink-0 text-3xl mr-3">{set.icon}</div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{set.title}</h3>
                              <p className="mt-1 text-sm text-gray-500">{set.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{set.questions.length} 个问题</span>
                                {isPaid && hasPaid && (
                                  <span className="text-xs text-blue-600">
                                    到期日期: {formatExpiryDate(expiry)}
                                  </span>
                                )}
                                {isPaid && set.trialQuestions && set.trialQuestions > 0 && !hasPaid && (
                                  <span className="text-xs text-blue-600">
                                    免费试用 {set.trialQuestions} 题
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 登录弹窗 */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
};

export default HomePage; 