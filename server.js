const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 11032;

// 中间件
app.use(express.json());
app.use(express.static('./'));

// 服务Docsify页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API端点：创建新的真题文件
app.post('/api/create-exam', (req, res) => {
  const { examId, markdown } = req.body;
  
  if (!examId || !markdown) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  
  try {
    // 1. 创建新的真题文件
    const filePath = path.join(__dirname, 'toefl', 'listening', 'real-exams', `${examId}.md`);
    fs.writeFileSync(filePath, markdown);
    
    // 2. 更新real-exams.md文件，添加新的链接
    updateRealExamsFile(examId);
    
    // 3. 更新侧边栏文件，添加新的链接
    updateSidebarFiles(examId);
    
    res.json({ 
      success: true, 
      filePath: `/toefl/listening/real-exams/${examId}.md`,
      url: `/#/toefl/listening/real-exams/${examId}.md`
    });
  } catch (error) {
    console.error('Error creating exam file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 更新real-exams.md文件，添加新的链接
function updateRealExamsFile(examId) {
  const realExamsPath = path.join(__dirname, 'toefl', 'listening', 'real-exams.md');
  let content = fs.readFileSync(realExamsPath, 'utf8');
  
  // 检查链接是否已存在
  if (!content.includes(`${examId}.md`)) {
    // 找到列表的位置并添加新链接
    const lines = content.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('- [') && !lines[i].includes('即将上线')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex !== -1) {
      // 在第一个链接前插入新链接
      lines.splice(insertIndex, 0, `- [${examId}](../listening/real-exams/${examId}.md)`);
      content = lines.join('\n');
      fs.writeFileSync(realExamsPath, content);
    }
  }
}

// 更新侧边栏文件，添加新的链接
function updateSidebarFiles(examId) {
  // 更新主侧边栏
  const mainSidebarPath = path.join(__dirname, '_sidebar.md');
  let mainContent = fs.readFileSync(mainSidebarPath, 'utf8');
  
  if (!mainContent.includes(`${examId}.md`)) {
    const lines = mainContent.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('/toefl/listening/real-exams/') && !lines[i].includes('即将上线')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex !== -1) {
      // 在第一个真题链接前插入新链接
      lines.splice(insertIndex, 0, `      * [${examId}](/toefl/listening/real-exams/${examId}.md)`);
      mainContent = lines.join('\n');
      fs.writeFileSync(mainSidebarPath, mainContent);
    }
  }
  
  // 更新真题专用侧边栏
  const examsSidebarPath = path.join(__dirname, 'toefl', 'listening', 'real-exams', '_sidebar.md');
  let examsContent = fs.readFileSync(examsSidebarPath, 'utf8');
  
  if (!examsContent.includes(`${examId}.md`)) {
    const lines = examsContent.split('\n');
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('(250') && !lines[i].includes('即将上线')) {
        insertIndex = i;
        break;
      }
    }
    
    if (insertIndex !== -1) {
      // 在第一个真题链接前插入新链接
      lines.splice(insertIndex, 0, `  * [${examId}](${examId}.md)`);
      examsContent = lines.join('\n');
      fs.writeFileSync(examsSidebarPath, examsContent);
    }
  }
}

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
  console.log(`管理页面: http://localhost:${port}/#/admin/add-exam.html`);
});
