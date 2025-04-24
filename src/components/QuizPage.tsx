import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionSets } from '../data/questionSets';
import QuestionCard from './QuestionCard';

const QuizPage = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizSet, setQuizSet] = useState(questionSets.find(set => set.id === quizId));
  
  useEffect(() => {
    // 如果找不到对应的题库，返回主页
    if (!quizSet) {
      navigate('/');
    }
  }, [quizSet, navigate]);

  if (!quizSet) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">找不到题库</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  const totalQuestions = quizSet.questions.length;

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // 所有问题都已回答完毕
      alert('恭喜你完成了所有问题！');
      // 返回主页
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <QuestionCard
          question={quizSet.questions[currentQuestionIndex]}
          onNext={handleNextQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
          quizTitle={quizSet.title}
        />
      </div>
    </div>
  );
};

export default QuizPage; 