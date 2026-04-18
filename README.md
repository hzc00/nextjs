This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

参考资料
https://www.prisma.io/docs/guides/nextjs#2-install-and-configure-prisma

参考视频
https://www.bilibili.com/video/BV1RtuEzEEHv/?spm_id_from=333.1391.0.0&p=7

1. 核心底座：Vercel AI SDK (Google Provider)
   我们在代码里用到 useChat、streamText、embedMany 全部来自这个库。这是目前 Next.js 生态里做 AI 最好用的框架：

Google Gemini 专属接入指南： 👉 Vercel AI SDK - Google Generative AI Provider (这是最推荐看的一篇，包含了如何配置环境变量，如何初始化 google('gemini-2.0-flash') 等基础用法)
Tool Calling (工具调用 / 也就是我们在用的结构化查询)： 👉 Vercel AI SDK - Tool Calling (非常重要！教您大模型是如何触发函数执行数据库查询的)
文本向量化 (Embeddings)： 👉 Vercel AI SDK - Embeddings (展示了 embedMany 和 embed 方法的使用，以及官方推荐的 RAG 极简实现) 2. 谷歌官方底层文档 (Google Gemini API)
如果你想了解刚才坑了我们的“模型名称版本”或者更多底层参数，可以看 Google 的官方文档：

Gemini 官方开发主页： 👉 Google AI for Developers
Google Gemini 模型清单： 👉 Gemini Models Reference (里面记录了 gemini-1.5-flash、text-embedding-004 等各种模型的区别和适用场景)
Embeddings 向量化官方指南： 👉 Embeddings Guide (讲解了为什么向量能比较相似度，以及底层到底在干什么)
