import React from 'react';
import { Option } from '../data/questions';

interface QuestionOptionProps {
  option: Option;
  isSelected: boolean;
  isCorrect: string | null;
  isSubmitted: boolean;
  onClick: () => void;
}

const QuestionOption: React.FC<QuestionOptionProps> = ({
  option,
  isSelected,
  isCorrect,
  isSubmitted,
  onClick
}) => {
  // 根据当前状态确定背景颜色
  const getBgColor = () => {
    if (!isSubmitted) {
      return isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white hover:bg-gray-50';
    }
    
    if (isSelected) {
      return isCorrect === option.id
        ? 'bg-green-100 border-green-500' 
        : 'bg-red-100 border-red-500';
    }
    
    if (option.id === isCorrect) {
      return 'bg-green-100 border-green-500';
    }
    
    return 'bg-white';
  };

  return (
    <div
      className={`flex items-start p-4 mb-3 border rounded-lg cursor-pointer transition-all ${getBgColor()}`}
      onClick={!isSubmitted ? onClick : undefined}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full mr-3 flex items-center justify-center 
        ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}
        ${isSubmitted && isSelected && isCorrect === option.id ? 'bg-green-500 text-white' : ''}
        ${isSubmitted && isSelected && isCorrect !== option.id ? 'bg-red-500 text-white' : ''}
        ${isSubmitted && option.id === isCorrect && !isSelected ? 'bg-green-500 text-white' : ''}
      `}>
        {option.id}
      </div>
      <div className="flex-1">
        <p className="text-gray-800">{option.text}</p>
      </div>
    </div>
  );
};

export default QuestionOption; 