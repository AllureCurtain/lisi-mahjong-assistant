# 新会话交接提示词

在 `D:\Study\cc\lisi-mahjong-assistant` 目录新开会话后，可以直接发送下面这段话：

```text
请在当前目录继续实现这个项目。

项目目标：做一个三人太原立四麻将实时助手，手机、平板、电脑三端都可以通过浏览器访问。第一版是响应式本地 Web 应用，不做摄像头识别、不做后端、不做联机。

请先阅读这些文档：
- docs/design.md
- docs/technical-solution.md
- docs/tech-stack.md
- docs/superpowers/plans/2026-06-07-lisi-mahjong-assistant.md

关键要求：
- 使用 TypeScript + React + Vite + Vitest。
- 使用 pnpm，不要使用 npm，不要生成 package-lock.json。
- package.json 里声明 packageManager: pnpm@10.6.2。
- 开发脚本使用 vite --host 0.0.0.0，方便手机和平板在同一局域网访问。
- UI 要做响应式：手机、平板、电脑都可用。手机不横向滚动，按钮至少 44px 高；平板/电脑可以多栏布局。
- 先实现纯 TypeScript 规则逻辑并写测试，再接 React UI。
- 遵循实现计划，按任务推进，每完成一块运行 pnpm test 和 pnpm build。

请从实现计划的 Task 1 开始执行。如果你发现计划和文档有冲突，以 docs/design.md 和 docs/technical-solution.md 为准，并先说明冲突再修正计划。
```

## 访问方式提醒

实现到可运行后，在项目目录执行：

```powershell
pnpm dev
```

Vite 会输出类似：

```text
Local:   http://localhost:5173/
Network: http://192.168.x.x:5173/
```

电脑可以打开 `Local` 地址；手机和平板连接同一个 Wi-Fi 后打开 `Network` 地址。
