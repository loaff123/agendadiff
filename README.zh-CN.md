# AgendaDiff

对比两份 `.ics` 日历导出文件，区分“从导出中消失”和“明确取消”。适合日历集成开发者、课表维护者，以及迁移前后的检查。

## 使用

直接用现代浏览器打开 `dist/AgendaDiff-Offline.html`。无需服务器、账号或联网。页面先显示虚构示例；选择两份本地 UTF-8 `.ics` 文件，或粘贴文本，再点击 Compare calendars。

结果按精确的 UID 与带类型的 RECURRENCE-ID 匹配。支持分类筛选、标题/UID 搜索、原文检查，以及 JSON 和独立 HTML 报告导出。报告会包含日历的标题、标识符和原文，分享前请检查个人信息。

本应用不会上传日历内容，不使用遥测或本地持久化。使用托管演示时，托管服务仍可能接收到普通网页访问信息。

## 命令行

需要 Node.js 22 或更高版本：

```sh
npm ci
npm run verify
node dist/cli.js fixtures/before.ics fixtures/after.ics
node dist/cli.js before.ics after.ics --format html --output report.html
```

示例包含差异，因此返回退出码 1，属于正常结果。输出路径必须不存在，程序不会覆盖输入文件或已有报告。

退出码：0 表示支持范围内一致；1 表示明确差异；2 表示格式错误、冲突、未支持字段或无法确定；3 表示参数、编码或文件读写错误。元数据与等价表示的变化不会使退出码从 0 变成 1。

可运行 `npm pack` 后安装生成的本地 `.tgz`，但本项目不声称已发布到 npm。`private: true` 用于防止误发布。

## 请特别留意

- 导出缺少某条记录并不证明取消，导出时间窗口或筛选范围可能不同
- 重复 UID + RECURRENCE-ID 不会互相覆盖，每条原文都会保留
- 主事件与显式重复例外分开处理，不按标题模糊匹配
- 全天事件的结束日期是排他边界；浮动时间不会转换为电脑时区
- v0.1.0 不解析任何 TZID 的绝对时刻，包括常见 IANA 名称；内嵌 VTIMEZONE 仅保留证据，相关事件标记为无法确定
- 不展开重复实例，只比较 RRULE、RDATE、EXDATE 与显式例外；不估算受影响次数
- METHOD:CANCEL 是调度取消指令，不代表收件方已经执行；STATUS:CANCELLED 是记录的明确状态
- 参与者、组织者、提醒、附件、自定义字段及非 VEVENT 组件保留证据，但不进行完整语义解释，因此不会显示完全通过

这是只读诊断工具，不会写入日历、监听账号、发送通知或代替完整 RFC 验证器。

详细行为见 [语义说明](docs/SEMANTICS.md)，限制见 [验证记录](docs/QA.md)，贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

AgendaDiff 自有代码采用 MIT；捆绑的 ICAL.js 2.2.1 采用 MPL-2.0，源码和许可附在 vendor/ical.js。两种许可分别适用。
