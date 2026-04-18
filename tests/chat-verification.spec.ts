import { test, expect } from '@playwright/test';

/**
 * 自动化测试脚本：验证 AI 投资助手对话功能
 * 运行方式：npx playwright test tests/chat-verification.spec.ts
 */
test('验证 AI 助手红盘统计功能', async ({ page }) => {
  // 1. 访问登录页面
  await page.goto('http://localhost:3000/sign-in');
  
  // 2. 登录流程
  await page.fill('input#email', 'admin@admin.com');
  await page.fill('input#password', '123456');
  await page.click('button[type="submit"]');

  // 3. 等待跳转到聊天页面
  await page.waitForURL('**/chat', { timeout: 10000 });
  
  // 4. 输入核心测试问题
  const inputSelector = 'input[placeholder="Ask a question or upload a document..."]';
  await page.waitForSelector(inputSelector);
  await page.fill(inputSelector, '我今天有多少个标的是红盘的？');
  
  // 5. 点击发送按钮（蓝色圆钮）
  await page.click('form button[type="submit"]');

  // 6. 验证流程：
  // a) 验证工具调用状态出现
  await expect(page.locator('text=Querying Investment DB...')).toBeVisible({ timeout: 10000 });
  
  // b) 验证 AI 最终的文字回答出现
  // 这里的逻辑是：等待 "Querying..." 消失或出现新的文本内容
  const aiResponse = page.locator('div.whitespace-pre-wrap');
  await expect(aiResponse.last()).not.toBeEmpty({ timeout: 20000 });
  
  // 打印 AI 的回答，方便调试
  const content = await aiResponse.last().textContent();
  console.log('AI 回答内容:', content);
});
