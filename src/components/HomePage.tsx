import React from 'react';
import { Link } from 'react-router-dom';
import { questionSets } from '../data/questionSets';

const HomePage = () => {
  // 获取所有的分类
  const categories = [...new Set(questionSets.map(set => set.category))];

  return (
    <div className="min-h-screen bg-gray-50 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-4xl sm:mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">ExamTopics 模拟练习</h1>
            <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5">
              选择以下任一题库开始练习，测试您的知识水平
            </p>
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
                    .map(set => (
                      <Link
                        to={`/quiz/${set.id}`}
                        key={set.id}
                        className="block p-4 bg-white border rounded-lg transition-transform transform hover:scale-105 hover:shadow-lg"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 text-3xl mr-3">{set.icon}</div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{set.title}</h3>
                            <p className="mt-1 text-sm text-gray-500">{set.description}</p>
                            <p className="mt-2 text-xs text-gray-400">{set.questions.length} 个问题</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 