# 验证码说明（童年创伤阴影测试）

- 格式：`CS` + 4 位字符，字符表 `ABCDEFGHJKMNPQRSTUVWXYZ23456789`（无 I/L/O/0/1）
- 正则：`/^CS[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/i`
- 示例形态：`CSXXXX`（此处不公布可售卖码）
- Vault quiz key：`shadow`（发码池 `pools/shadow.txt`，由 vault 维护，不在本仓库）
- 每码最多使用 **3** 次（跨设备共享计数，由 vault `POST /redeem` 扣次）
- **重新测试**：清除会话解锁后需再次输入码并 redeem，会再扣 1 次
- **查看上次结果**：只读本机 `localStorage` 键 `shadow_last_result`，不扣次
- 解锁态键名：`shadow_unlocked`、`shadow_code`（`sessionStorage`）
- 本仓库**不**存放可卖验证码明文，也**不**接入 Mantle

造码（本机 companion，勿把码写进 git）：

```bash
/workspace/quiz-code-api/scripts/mint.sh shadow <CODE> 3
```

或见 `tools/mint.sh`。该脚本只打印用法，不会生成或写入真码。
