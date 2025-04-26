import React, { useState, useRef } from 'react';
import { questionSetBatchApi, UploadProgressCallback } from '../../utils/questionSetBatchApi';
import { QuestionSet } from '../../types';

interface QuestionSetBatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (questionSets: QuestionSet[]) => void;
}

const QuestionSetBatchUploadModal: React.FC<QuestionSetBatchUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'validating' | 'uploading' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFileTypes = '.json,.csv,.xlsx,.xls';
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors(null);
      setStatusMessage('');
      setUploadState('idle');
    }
  };
  
  const resetUpload = () => {
    setFile(null);
    setProgress(0);
    setErrors(null);
    setStatusMessage('');
    setUploadState('idle');
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setStatusMessage('请先选择文件');
      return;
    }
    
    // 针对不同文件类型进行处理
    try {
      // 解析文件
      const parseResponse = await questionSetBatchApi.parseExcelFile(file);
      
      if (!parseResponse.success) {
        setErrors({ parse: [parseResponse.error || '文件解析失败'] });
        setUploadState('failed');
        setStatusMessage('文件解析失败');
        return;
      }
      
      const questionSets = parseResponse.data || [];
      
      if (questionSets.length === 0) {
        setErrors({ parse: ['文件中未找到有效的题库数据'] });
        setUploadState('failed');
        setStatusMessage('文件中未找到有效的题库数据');
        return;
      }
      
      // 进度回调
      const callbacks: Partial<UploadProgressCallback> = {
        onProgress: (progress) => {
          setProgress(progress);
        },
        onValidationStart: () => {
          setUploadState('validating');
          setStatusMessage('正在验证题库数据...');
        },
        onValidationComplete: (valid, errors) => {
          if (!valid) {
            setErrors(errors);
            setUploadState('failed');
            setStatusMessage('题库数据验证失败');
          }
        },
        onUploadStart: () => {
          setUploadState('uploading');
          setStatusMessage(`正在上传 ${questionSets.length} 个题库...`);
        },
        onUploadComplete: (success, data) => {
          if (success) {
            setUploadState('completed');
            setStatusMessage(`成功上传 ${data.length} 个题库`);
            onUploadSuccess(data);
          }
        },
        onError: (error) => {
          setErrors({ upload: [error.message] });
          setUploadState('failed');
          setStatusMessage('上传过程中出错');
        }
      };
      
      // 开始批量上传
      await questionSetBatchApi.batchUpload(questionSets, callbacks);
      
    } catch (error: any) {
      setErrors({ upload: [error.message || '上传过程中出错'] });
      setUploadState('failed');
      setStatusMessage('上传过程中出错');
    }
  };
  
  // 如果Modal不可见，则不渲染
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">批量上传题库</h3>
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
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">上传要求</h4>
            <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
              <li>支持 Excel (.xlsx, .xls), CSV, JSON 文件格式</li>
              <li>Excel 文件需要包含标题行，每个工作表对应一个题库</li>
              <li>每个题库必须包含 ID, 标题, 分类和至少一个题目</li>
              <li>题目需要包含问题内容, 选项和正确答案</li>
              <li>上传前会对数据进行验证，只有通过验证的数据才会上传</li>
            </ul>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 mb-4">
            <div className="flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                选择文件
              </label>
              
              {file && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-800 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>
          
          {/* 上传状态和进度 */}
          {uploadState !== 'idle' && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm font-medium text-gray-700">
                  {uploadState === 'validating' && '正在验证数据...'}
                  {uploadState === 'uploading' && '正在上传...'}
                  {uploadState === 'completed' && '上传完成'}
                  {uploadState === 'failed' && '上传失败'}
                </p>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    uploadState === 'failed' ? 'bg-red-600' : 'bg-blue-600'
                  }`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* 错误信息展示 */}
          {errors && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md">
              <h5 className="text-sm font-medium text-red-800 mb-2">上传遇到以下问题:</h5>
              <div className="text-xs text-red-700 max-h-40 overflow-y-auto">
                {Object.entries(errors).map(([key, messages]: [string, any]) => (
                  <div key={key} className="mb-2">
                    <p className="font-medium">{key.startsWith('set_') ? `题库 #${parseInt(key.split('_')[1]) + 1}` : key}</p>
                    <ul className="list-disc pl-5">
                      {messages.map((msg: string, i: number) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {statusMessage && (
            <div className={`mb-4 p-3 rounded-md text-sm ${
              uploadState === 'failed' ? 'bg-red-50 text-red-700' : 
              uploadState === 'completed' ? 'bg-green-50 text-green-700' : 
              'bg-blue-50 text-blue-700'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>
        
        <div className="px-6 py-3 bg-gray-50 flex justify-between">
          <button
            onClick={resetUpload}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {uploadState === 'completed' ? '上传新文件' : '重置'}
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {uploadState === 'completed' ? '关闭' : '取消'}
            </button>
            
            {uploadState !== 'completed' && (
              <button
                onClick={handleUpload}
                disabled={!file || uploadState === 'uploading' || uploadState === 'validating'}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  !file || uploadState === 'uploading' || uploadState === 'validating'
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {uploadState === 'uploading' || uploadState === 'validating' ? '处理中...' : '开始上传'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSetBatchUploadModal; 