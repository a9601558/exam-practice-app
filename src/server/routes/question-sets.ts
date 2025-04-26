import express, { Request, Response, RequestHandler } from 'express';
import { db, QueryResult } from '../db';
import { authMiddleware, adminMiddleware } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import xlsx from 'xlsx';

const router = express.Router();

// Get all question sets
router.get('/', (async (_req: Request, res: Response) => {
  try {
    const questionSets = await db.query(
      `SELECT * FROM question_sets ORDER BY title`
    );
    res.json(questionSets);
  } catch (error) {
    console.error('Error fetching question sets:', error);
    res.status(500).json({ error: 'Failed to fetch question sets' });
  }
}) as RequestHandler);

// Get a specific question set by ID
router.get('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const questionSets: QueryResult = await db.query(
      `SELECT * FROM question_sets WHERE id = ?`,
      [id]
    );
    
    // Handle array result properly
    const questionSet = questionSets.length > 0 ? questionSets[0] : null;
    
    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    res.json(questionSet);
  } catch (error) {
    console.error(`Error fetching question set ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch question set' });
  }
}) as RequestHandler);

// Create a new question set
router.post('/', (async (req: Request, res: Response) => {
  try {
    const { 
      id, 
      title, 
      description, 
      category, 
      icon, 
      isPaid, 
      price, 
      trialQuestions,
      questions 
    } = req.body;
    
    // Validate required fields
    if (!id || !title || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert question set
    await db.query(
      `INSERT INTO question_sets (
        id, title, description, category, icon, isPaid, price, trialQuestions, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, title, description || '', category, icon, isPaid ? 1 : 0, price || 0, trialQuestions || 0]
    );
    
    // Insert questions if provided
    if (questions && Array.isArray(questions) && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        // Insert question
        const questionId = `${id}-q${i+1}`;
        await db.query(
          `INSERT INTO questions (
            id, questionSetId, text, questionType, explanation, orderIndex, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [questionId, id, question.question, question.questionType, question.explanation, i]
        );
        
        // Insert options
        if (question.options && Array.isArray(question.options)) {
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            const isCorrect = question.questionType === 'single' 
              ? question.correctAnswer === option.id
              : (question.correctAnswer as string[]).includes(option.id);
              
            await db.query(
              `INSERT INTO options (
                id, questionId, text, isCorrect, optionIndex, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
              [`${questionId}-o${j+1}`, questionId, option.text, isCorrect ? 1 : 0, option.id]
            );
          }
        }
      }
    }
    
    res.status(201).json({ id, message: 'Question set created successfully' });
  } catch (error) {
    console.error('Error creating question set:', error);
    res.status(500).json({ error: 'Failed to create question set' });
  }
}) as RequestHandler);

// Delete a question set
router.delete('/:id', (async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if question set exists
    const questionSets: QueryResult = await db.query(
      `SELECT id FROM question_sets WHERE id = ?`,
      [id]
    );
    
    if (questionSets.length === 0) {
      return res.status(404).json({ error: 'Question set not found' });
    }
    
    // Delete the question set (cascading delete will handle questions and options)
    await db.query(
      `DELETE FROM question_sets WHERE id = ?`,
      [id]
    );
    
    res.json({ message: 'Question set deleted successfully' });
  } catch (error) {
    console.error(`Error deleting question set ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete question set' });
  }
}) as RequestHandler);

// 新增用于批量处理的端点

// 批量上传题库
router.post('/bulk-upload', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questionSets } = req.body;
    
    if (!Array.isArray(questionSets) || questionSets.length === 0) {
      return res.status(400).json({ success: false, message: '请提供有效的题库数据数组' });
    }
    
    // 验证每个题库的基本结构
    const validationErrors: Record<string, string[]> = {};
    
    questionSets.forEach((set, index) => {
      const setErrors: string[] = [];
      
      if (!set.id) setErrors.push('题库ID不能为空');
      if (!set.title) setErrors.push('题库标题不能为空');
      if (!set.category) setErrors.push('题库分类不能为空');
      
      // 题目验证
      if (set.questions && set.questions.length > 0) {
        set.questions.forEach((question: any, qIndex: number) => {
          if (!question.question) {
            setErrors.push(`题目 #${qIndex + 1} 缺少问题内容`);
          }
          if (!question.options || question.options.length < 2) {
            setErrors.push(`题目 #${qIndex + 1} 至少需要2个选项`);
          }
          if (!question.correctAnswer) {
            setErrors.push(`题目 #${qIndex + 1} 缺少正确答案`);
          }
        });
      } else {
        setErrors.push('题库至少需要包含一个题目');
      }
      
      if (setErrors.length > 0) {
        validationErrors[`set_${index}`] = setErrors;
      }
    });
    
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: '题库数据验证失败',
        errors: validationErrors 
      });
    }
    
    // 处理每个题库
    const results = [];
    
    for (const set of questionSets) {
      // 检查ID是否已存在
      const existingSet = await db.query(
        `SELECT * FROM question_sets WHERE id = ?`,
        [set.id]
      );
      
      if (existingSet.length > 0) {
        // 更新现有题库
        await db.query(
          `UPDATE question_sets SET title = ?, description = ?, category = ?, icon = ?, isPaid = ?, price = ?, trialQuestions = ? WHERE id = ?`,
          [set.title, set.description, set.category, set.icon, set.isPaid ? 1 : 0, set.price || 0, set.trialQuestions || 0, set.id]
        );
        results.push(existingSet[0]);
      } else {
        // 创建新题库
        await db.query(
          `INSERT INTO question_sets (id, title, description, category, icon, isPaid, price, trialQuestions, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [set.id, set.title, set.description || '', set.category, set.icon, set.isPaid ? 1 : 0, set.price || 0, set.trialQuestions || 0]
        );
        results.push(set);
      }
    }
    
    return res.json({
      success: true,
      data: results,
      message: `成功处理 ${results.length} 个题库`
    });
    
  } catch (error: any) {
    console.error('批量上传题库失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，批量上传题库失败',
      error: error.message 
    });
  }
});

// 批量操作（更新/删除）
router.post('/batch-operation', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { operation, ids } = req.body;
    
    if (!operation || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '请提供有效的操作类型和ID列表' 
      });
    }
    
    let results;
    
    if (operation === 'delete') {
      // 批量删除
      results = await db.query(
        `DELETE FROM question_sets WHERE id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      
      return res.json({
        success: true,
        data: { deletedCount: results.affectedRows },
        message: `成功删除 ${results.affectedRows} 个题库`
      });
      
    } else if (operation === 'update') {
      // 批量更新
      const updateResults = [];
      
      for (const id of ids) {
        const { title, description, category, icon, isPaid, price, trialQuestions } = req.body.data[id] || {};
        
        if (title || description || category || icon || isPaid || price || trialQuestions) {
          const updateQuery = `
            UPDATE question_sets SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            category = COALESCE(?, category),
            icon = COALESCE(?, icon),
            isPaid = COALESCE(?, isPaid),
            price = COALESCE(?, price),
            trialQuestions = COALESCE(?, trialQuestions),
            updatedAt = NOW()
            WHERE id = ?
          `;
          
          const updateValues = [
            title, description, category, icon, isPaid ? 1 : 0, price || 0, trialQuestions || 0, id
          ];
          
          await db.query(updateQuery, updateValues);
          
          const updatedSet = await db.query(
            `SELECT * FROM question_sets WHERE id = ?`,
            [id]
          );
          
          if (updatedSet.length > 0) {
            updateResults.push(updatedSet[0]);
          }
        }
      }
      
      return res.json({
        success: true,
        data: updateResults,
        message: `成功更新 ${updateResults.length} 个题库`
      });
      
    } else {
      return res.status(400).json({ 
        success: false, 
        message: '不支持的操作类型' 
      });
    }
    
  } catch (error: any) {
    console.error('批量操作题库失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，批量操作题库失败',
      error: error.message 
    });
  }
});

// 解析Excel文件
router.post('/parse-excel', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未提供文件' });
    }
    
    const fileBuffer = req.file.buffer;
    const fileType = req.file.mimetype;
    
    // 判断文件类型
    if (fileType.includes('json')) {
      // 解析JSON文件
      const jsonString = fileBuffer.toString('utf8');
      let jsonData;
      
      try {
        jsonData = JSON.parse(jsonString);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'JSON格式无效' });
      }
      
      if (!Array.isArray(jsonData) && !jsonData.questionSets) {
        if (jsonData.id && jsonData.title) {
          // 单个题库
          return res.json({
            success: true,
            data: [jsonData],
            message: '成功解析1个题库'
          });
        }
        return res.status(400).json({ success: false, message: 'JSON格式无效，缺少题库数据' });
      }
      
      const questionSets = Array.isArray(jsonData) ? jsonData : jsonData.questionSets;
      
      return res.json({
        success: true,
        data: questionSets,
        message: `成功解析 ${questionSets.length} 个题库`
      });
      
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('sheet') || req.file.originalname.endsWith('.xlsx') || req.file.originalname.endsWith('.xls')) {
      // 解析Excel文件
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const questionSets = [];
      
      // 遍历所有工作表
      for (const sheetName of workbook.SheetNames) {
        // 跳过说明页
        if (sheetName.includes('说明') || sheetName.includes('instruction')) continue;
        
        if (sheetName === '题库信息') {
          // 这是元数据工作表
          continue;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        if (data.length === 0) continue;
        
        // 检查是否是题目工作表
        if ('题目ID' in data[0] || '题目内容' in data[0] || 'question' in data[0]) {
          // 这是一个题目工作表，需要找到对应的题库信息
          // 简单处理：假设题库信息在第一个工作表
          const metadataSheet = workbook.Sheets['题库信息'] || workbook.Sheets[workbook.SheetNames[0]];
          const metadata = xlsx.utils.sheet_to_json(metadataSheet);
          
          if (metadata.length === 0) {
            return res.status(400).json({ success: false, message: '缺少题库基本信息' });
          }
          
          // 提取第一行作为题库信息
          const setInfo = metadata[0] as any;
          
          // 创建题库对象
          const questionSet = {
            id: setInfo['题库ID'] || setInfo['id'] || `set_${Date.now()}`,
            title: setInfo['题库标题'] || setInfo['title'] || '未命名题库',
            description: setInfo['描述'] || setInfo['description'] || '',
            category: setInfo['分类'] || setInfo['category'] || '未分类',
            icon: setInfo['图标'] || setInfo['icon'] || '📝',
            isPaid: (setInfo['是否付费'] || setInfo['isPaid'] || 'FALSE').toString().toUpperCase() === 'TRUE',
            price: parseFloat(setInfo['价格'] || setInfo['price'] || '0'),
            trialQuestions: parseInt(setInfo['可试用题目数'] || setInfo['trialQuestions'] || '0', 10),
            questions: []
          };
          
          // 解析题目数据
          questionSet.questions = data.map((row: any, index: number) => {
            // 识别列名
            const questionIdKey = Object.keys(row).find(k => k.includes('ID') || k === 'id') || '';
            const questionTextKey = Object.keys(row).find(k => k.includes('题目内容') || k === 'question') || '';
            const questionTypeKey = Object.keys(row).find(k => k.includes('题目类型') || k === 'type') || '';
            const explanationKey = Object.keys(row).find(k => k.includes('解释') || k === 'explanation') || '';
            const correctAnswerKey = Object.keys(row).find(k => k.includes('正确答案') || k === 'correctAnswer') || '';
            
            // 提取选项键
            const optionKeys = Object.keys(row).filter(k => 
              k.includes('选项') || k.startsWith('A') || k.startsWith('B') || k.startsWith('C') || k.startsWith('D') || k.startsWith('E') || k.startsWith('F')
            );
            
            // 确定问题类型
            let questionType = 'single';
            const typeText = row[questionTypeKey] || '';
            if (typeText.includes('多选') || typeText === 'multiple') {
              questionType = 'multiple';
            }
            
            // 构建选项
            const options = optionKeys.map((key, i) => {
              // 生成选项ID (A, B, C, D...)
              const optionId = String.fromCharCode(65 + i);
              return {
                id: optionId,
                text: row[key] || ''
              };
            }).filter(opt => opt.text); // 过滤掉空选项
            
            // 处理正确答案
            let correctAnswer = row[correctAnswerKey] || '';
            if (questionType === 'multiple' && typeof correctAnswer === 'string') {
              // 尝试分割多选答案
              correctAnswer = correctAnswer.split(/,|，|\s+/).filter(Boolean);
            }
            
            return {
              id: row[questionIdKey] || index + 1,
              question: row[questionTextKey] || '',
              questionType: questionType,
              options: options,
              correctAnswer: correctAnswer,
              explanation: row[explanationKey] || ''
            };
          }).filter((q: any) => q.question && q.options.length >= 2);
          
          questionSets.push(questionSet);
        } else {
          // 这可能是题库信息工作表
          // 每一行都是一个题库的基本信息
          for (const row of data) {
            // 跳过空行或标题行
            if (!row['id'] && !row['题库ID']) continue;
            
            questionSets.push({
              id: row['题库ID'] || row['id'] || `set_${Date.now()}`,
              title: row['题库标题'] || row['title'] || '未命名题库',
              description: row['描述'] || row['description'] || '',
              category: row['分类'] || row['category'] || '未分类',
              icon: row['图标'] || row['icon'] || '📝',
              isPaid: (row['是否付费'] || row['isPaid'] || 'FALSE').toString().toUpperCase() === 'TRUE',
              price: parseFloat(row['价格'] || row['price'] || '0'),
              trialQuestions: parseInt(row['可试用题目数'] || row['trialQuestions'] || '0', 10),
              questions: [] // 题目需要另外解析
            });
          }
        }
      }
      
      if (questionSets.length === 0) {
        return res.status(400).json({ success: false, message: '未找到有效的题库数据' });
      }
      
      return res.json({
        success: true,
        data: questionSets,
        message: `成功解析 ${questionSets.length} 个题库`
      });
      
    } else {
      return res.status(400).json({ success: false, message: '不支持的文件格式' });
    }
    
  } catch (error: any) {
    console.error('解析文件失败:', error);
    return res.status(500).json({ 
      success: false, 
      message: '服务器错误，解析文件失败',
      error: error.message 
    });
  }
});

export default router; 