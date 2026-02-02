# 投资管理面板 (Investment Dashboard) 项目架构说明

## 1. 技术栈选型
* **Framework:** [Next.js 15+ (App Router)](https://nextjs.org/)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Database:** SQLite (初期快速迭代方案)
* **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (基于 Radix UI + Tailwind CSS)
* **Charts:** ECharts (用于复杂金融曲线及资产配比)
* **State Management:** React Query (TanStack Query) - 用于处理行情数据的实时性缓存
* **参考现有项目架构去开发**，尽量按照现在目录架构去存放文件


## 2. ui 组件设计原则
1. 内容统一用英文
2. 页面内容统一使用响应式布局设计。


个人投资管理面板 (Lite 版) 开发手册
1. 产品定位
一个极简的个人财务/投资聚合看板，解决“资产散落在各处、记账不直观”的痛点。

核心目标： 搞清楚我总共有多少钱，钱分布在哪里。

核心原则： 录入简单，数据直观，拒绝过度设计。

2. 核心功能模块 (MVP Scope)
A. 资产大盘 (Overview)
资产总额卡片： 实时汇总所有账户的余额。

资产构成饼图 (ECharts)： 显示股票、现金、基金等类别的占比。

账户列表： 以列表形式展示各个账户（如：支付宝、招商银行、证券账户）的即时余额。

B. 账户管理 (Account Management)
创建账户： 设置账户名称（如“招行工资卡”）、类型（现金/股票/理财）、初始余额。

手动调余额： 针对懒人，支持直接修改账户当前余额，系统自动生成一条差额记录。

C. 极简记账 (Quick Log)
流水记录： 仅记录“账户、金额变动、日期、备注”。

逻辑联动： 记录保存后，自动更新对应账户的余额。

3. 数据库设计 (Prisma + SQLite)
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

// 账户模型：代表你的钱包、银行卡或证券账户
model Account {
  id           String        @id @default(cuid())
  name         String        // 账户名称，如：支付宝
  type         String        // 类型：CASH(现金), STOCK(股票), FUND(基金)
  balance      Float         @default(0) // 当前总余额
  currency     String        @default("CNY")
  transactions Transaction[]
  updatedAt    DateTime      @updatedAt
}

// 交易记录：代表每一笔资金变动
model Transaction {
  id        String   @id @default(cuid())
  accountId String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  amount    Float    // 变动金额，正数为入，负数为出
  category  String?  // 类别，如：工资、买入、消费
  note      String?  // 备注
  createdAt DateTime @default(now())
}

| 区域 | 推荐组件 | 描述 |
| :--- | :--- | :--- |
| 顶部导航 | Navigation Menu | 项目名称 + 切换暗黑模式按钮。 |
| 首屏顶部 | Card | 大字显示总资产，右侧放置“记账” Button。 |
| 中段左侧 | Card + ECharts | 饼图展示 Account.balance 的占比。 |
| 中段右侧 | Table | 展示所有账户的名称、类型和当前金额。 |
| 底部/二级页 | DataTable | 展示最近 10 条 Transaction 记录。 |


5. 开发建议指令 (发给 AI 编辑器)
关于前端组件： "请使用 Shadcn UI 的 Dialog 组件创建一个记账表单，包含账户选择（Select）、金额输入（Input）、备注，并确保提交后页面数据自动刷新。"

关于图表： "请基于 ECharts 编写一个 AssetPie 组件，接收账户列表数据，展示不同 type 的金额总和比例。"

6. 默认红涨绿跌，页面内容统一用英语，回复和代码注释使用中文
 
