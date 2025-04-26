import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface TemplateGeneratorProps {
  onClose: () => void;
}

const TemplateGenerator: React.FC<TemplateGeneratorProps> = ({ onClose }) => {
  const [templateType, setTemplateType] = useState<'basic' | 'advanced'>('basic');
  const [questionCount, setQuestionCount] = useState(10);
  const [optionCount, setOptionCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateTemplate = () => {
    setIsGenerating(true);
    
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 创建元数据工作表
      const metadataWs = XLSX.utils.aoa_to_sheet([
        ['题库ID', '题库标题', '描述', '分类', '图标', '是否付费', '价格', '可试用题目数'],
        ['quiz_001', '示例题库', '这是一个示例题库，用于展示模板格式', '示例分类', '📝', 'FALSE', '0', '0'],
        ['', '', '', '', '', '', '', ''],
        ['说明:'],
        ['1. 请在此表填写题库基本信息'],
        ['2. 题库ID必须唯一，不能重复'],
        ['3. 是否付费填写TRUE或FALSE'],
        ['4. 如果是付费题库，请填写价格和可试用题目数'],
        ['5. 图标支持emoji表情，例如📝 📚 🧠等'],
      ]);
      
      // 调整列宽
      const metadataCols = [
        { wch: 15 }, // ID
        { wch: 20 }, // 标题
        { wch: 40 }, // 描述
        { wch: 15 }, // 分类
        { wch: 10 }, // 图标
        { wch: 10 }, // 是否付费
        { wch: 10 }, // 价格
        { wch: 15 }, // 可试用题目数
      ];
      metadataWs['!cols'] = metadataCols;
      
      // 添加元数据工作表
      XLSX.utils.book_append_sheet(workbook, metadataWs, '题库信息');
      
      // 创建题目工作表
      let questionsData = [];
      
      // 添加表头
      questionsData.push([
        '题目ID', '题目内容', '题目类型', '解释说明',
        ...Array(optionCount).fill(0).map((_, i) => `选项${String.fromCharCode(65 + i)}`),
        '正确答案'
      ]);
      
      // 生成示例题目
      for (let i = 0; i < questionCount; i++) {
        const questionType = i % 3 === 0 ? '多选' : '单选';
        const correctAnswer = questionType === '单选' 
          ? 'A' 
          : ['A', 'B'].join(',');
          
        const row = [
          `q${i + 1}`,
          `示例题目 ${i + 1}`,
          questionType,
          `解释说明 ${i + 1}`,
        ];
        
        // 添加选项
        for (let j = 0; j < optionCount; j++) {
          row.push(`选项${String.fromCharCode(65 + j)}的内容`);
        }
        
        // 添加正确答案
        row.push(correctAnswer);
        
        questionsData.push(row);
      }
      
      // 如果是高级模板，添加更多的示例和格式
      if (templateType === 'advanced') {
        questionsData.push([], [
          '', '多行\n题目示例', '单选', '这是一个多行内容示例',
          '选项A内容', '选项B\n多行内容', '选项C内容', '选项D内容',
          'B'
        ]);
        
        questionsData.push([
          '', '图片链接题目示例', '多选', '可以使用图片URL',
          '选项A https://example.com/imageA.jpg', '选项B内容', '选项C内容', '选项D内容',
          'A,C'
        ]);
      }
      
      // 添加说明行
      questionsData.push(
        [],
        ['说明:'],
        ['1. 题目ID在单个题库内必须唯一'],
        ['2. 题目类型填写"单选"或"多选"'],
        ['3. 多选题的正确答案用逗号分隔，如"A,B,C"'],
        ['4. 选项数量可以根据需要增减，但至少需要两个选项'],
        ['5. 解释说明是可选的，可以为空']
      );
      
      const questionsWs = XLSX.utils.aoa_to_sheet(questionsData);
      
      // 调整列宽
      const questionsCols = [
        { wch: 10 }, // 题目ID
        { wch: 40 }, // 题目内容
        { wch: 10 }, // 题目类型
        { wch: 30 }, // 解释说明
      ];
      
      // 为每个选项添加列宽
      for (let i = 0; i < optionCount; i++) {
        questionsCols.push({ wch: 20 });
      }
      
      // 正确答案列宽
      questionsCols.push({ wch: 15 });
      
      questionsWs['!cols'] = questionsCols;
      
      // 添加题目工作表
      XLSX.utils.book_append_sheet(workbook, questionsWs, '题目');
      
      // 如果是高级模板，添加导入说明工作表
      if (templateType === 'advanced') {
        const instructionsWs = XLSX.utils.aoa_to_sheet([
          ['题库导入模板使用说明'],
          [''],
          ['1. 基本结构'],
          ['   - 此模板包含两个工作表: "题库信息" 和 "题目"'],
          ['   - "题库信息" 工作表用于填写题库的基本信息'],
          ['   - "题目" 工作表用于填写题目内容和选项'],
          [''],
          ['2. 填写要求'],
          ['   - 所有带 * 的字段为必填项'],
          ['   - 题库ID和题目ID必须唯一'],
          ['   - 选项至少需要两个'],
          ['   - 题目类型只能是"单选"或"多选"'],
          [''],
          ['3. 格式说明'],
          ['   - 可以在单元格中使用换行符(\\n)来创建多行内容'],
          ['   - 可以在内容中插入图片URL链接'],
          ['   - 多选题的正确答案用逗号分隔选项字母，如"A,B,C"'],
          [''],
          ['4. 批量导入'],
          ['   - 可以创建多个工作簿，每个工作簿对应一个题库'],
          ['   - 也可以在此模板基础上复制工作表，每个工作表对应一个题库'],
          [''],
          ['5. 数据验证'],
          ['   - 上传前系统会自动验证数据格式'],
          ['   - 验证通过后才会导入数据'],
          ['   - 如有错误，系统会提示具体的错误信息'],
        ]);
        
        // 设置列宽
        instructionsWs['!cols'] = [{ wch: 80 }];
        
        // 添加说明工作表
        XLSX.utils.book_append_sheet(workbook, instructionsWs, '使用说明');
      }
      
      // 下载文件
      XLSX.writeFile(workbook, `题库导入模板_${templateType === 'basic' ? '基础版' : '高级版'}.xlsx`);
      
    } catch (error) {
      console.error('生成模板失败:', error);
      alert('生成模板失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">生成题库导入模板</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              模板类型
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="templateType"
                  value="basic"
                  checked={templateType === 'basic'}
                  onChange={() => setTemplateType('basic')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">基础模板</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="templateType"
                  value="advanced"
                  checked={templateType === 'advanced'}
                  onChange={() => setTemplateType('advanced')}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">高级模板（含详细说明）</span>
              </label>
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-1">
              示例题目数量
            </label>
            <input
              id="questionCount"
              type="number"
              min="1"
              max="50"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="optionCount" className="block text-sm font-medium text-gray-700 mb-1">
              每题选项数量
            </label>
            <input
              id="optionCount"
              type="number"
              min="2"
              max="6"
              value={optionCount}
              onChange={(e) => setOptionCount(parseInt(e.target.value) || 4)}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-700 mb-4">
            <p>生成的模板将包含：</p>
            <ul className="list-disc pl-5 mt-1">
              <li>题库基本信息表单</li>
              <li>{questionCount}个示例题目</li>
              <li>每题{optionCount}个选项</li>
              {templateType === 'advanced' && <li>详细的使用说明和格式指南</li>}
            </ul>
          </div>
        </div>
        
        <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={generateTemplate}
            disabled={isGenerating}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              isGenerating
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? '生成中...' : '生成并下载'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateGenerator; 