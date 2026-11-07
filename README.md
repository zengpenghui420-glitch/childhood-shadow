# 童年创伤阴影测试 · 那些你没说出口的伤

测测日记 · 付费移动端 H5 娱乐测验。18 道原创 Likert 题，六维画像 + 阴影指数（0–100）+ 六档锐评 + 雷达。

## 在线地址

https://zengpenghui420-glitch.github.io/childhood-shadow/

## 产品要点

| 项 | 说明 |
|---|---|
| 题目 | 18 题 · 五级自评（完全不像我 → 非常像我），可跳过单题 |
| 维度 | 情感空窗 / 身体警报 / 价值贴现 / 预警雷达 / 亲密戒备 / 情绪淤积 |
| 计分 | 每维 3 题；`rev` 题按 `6−v`；维分 `(mean−1)/4×100`。**高分 = 该侧印记更重** |
| 结果 | 阴影指数 0–100（六维均值四舍五入）+ 档位 + 最重的一面 + 雷达 + 特征 + 小建议 |
| 档位 | DEW / HAZE / DUSK / UMBRA / ECLIPSE / NIGHT |
| 验证码 | `CS****`，每码 3 次；vault quiz key `shadow`；**不接 Mantle** |
| 接口 | `https://snappy-tundra-7uesdvk.tmp.now`（`quiz=shadow`） |
| 重新测试 | 清会话解锁 → 再弹码 → redeem（扣次） |
| 查看上次 | 仅读本机 `shadow_last_result`，不扣次 |

## 免责声明

本测试为娱乐向自我观察，非正式心理测量或创伤评估，不能替代专业心理咨询、心理治疗或临床诊断。「阴影指数」只是对你成长期某些感受残留的趣味画像，不是对任何人的定罪，也不等于你现在「坏掉了」；结果会受回忆偏差与当下情绪影响。若题目勾起强烈不适、闪回或失控感，请随时停下，优先照顾自己。

看见阴影是为了更温柔地对待现在的自己，不是为了沉进旧伤。童年没有标准答案。若相关体验已明显影响睡眠、工作、关系或安全，寻求现实支持（可信赖的人、正规心理咨询/医院心理科/危机热线）是勇敢的选择，而不是软弱。

## 文件

- `index.html` — 单文件 H5
- `.nojekyll` — GitHub Pages 跳过 Jekyll
- `CODES.md` — 验证码格式与规则（无可卖码）
- `tools/mint.sh` — 只打印 vault 造码用法

## 本地预览

```bash
python3 -m http.server 8080
```

浏览器打开 http://127.0.0.1:8080/ 。未解锁时点「开始测试」会要求验证码；「查看上次结果」只读本地缓存。

## GitHub Pages

从 `main` 分支的根目录 `/` 发布：

1. 仓库 Settings → Pages → Build and deployment → Deploy from a branch
2. Branch 选 `main`，Folder 选 `/ (root)`，保存
3. 确认仓库根目录有 `.nojekyll`

也可用 API（需有 Pages 管理权限）：

```bash
gh api --method POST repos/zengpenghui420-glitch/childhood-shadow/pages \
  -f build_type=legacy \
  -f 'source[branch]=main' \
  -f 'source[path]=/'
```

## 版权

题目、档位名与结果文案均为原创中文日常情景。不使用临床诊断或量表品牌标签，也不照搬第三方创伤题库或档名。
