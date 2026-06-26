// Cloudflare Pages Functions 中间件：对全站做登录校验（服务端，浏览器看不到密码）
const USER = "stepfun";
const PASS = "funstep";
const COOKIE = "fc_auth";
const TOKEN = "stepfun-ok-v1";          // 登录成功后写入的不可逆票据（非密码本身）

function loginPage(err) {
  const msg = err
    ? `<div class="err">${err}</div>`
    : `<div class="hint">请输入账号与密码以访问</div>`;
  return new Response(`<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录 · 广义金融资产分析框架</title>
<style>
  :root{--bg:#0a1230;--panel:#10204f;--line:#2a3f7a;--gold:#f5c542;--text:#e8eefc;--muted:#8ea3d6}
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,"PingFang SC","Microsoft YaHei",Segoe UI,sans-serif;
    background:linear-gradient(160deg,#070d24,#0a1230 40%,#0b1538);color:var(--text)}
  .card{width:340px;background:linear-gradient(135deg,#15225a,#0e1840);
    border:1px solid var(--gold);border-radius:16px;padding:32px 30px;
    box-shadow:0 10px 50px rgba(245,197,66,.12)}
  .en{color:var(--gold);font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;margin-bottom:6px}
  h1{font-size:19px;margin:0 0 4px;letter-spacing:1px}
  .sub{color:var(--muted);font-size:12px;margin-bottom:22px;line-height:1.5}
  label{display:block;font-size:11px;color:var(--muted);margin:14px 0 6px;letter-spacing:.5px}
  input{width:100%;background:var(--panel);border:1px solid var(--line);color:var(--text);
    padding:11px 13px;border-radius:9px;font-size:14px;outline:none;transition:.15s}
  input:focus{border-color:var(--gold)}
  button{width:100%;margin-top:22px;background:var(--gold);color:#0a1230;border:none;
    padding:12px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer;transition:.15s}
  button:hover{filter:brightness(1.08)}
  .hint{color:var(--muted);font-size:12px;margin-bottom:4px}
  .err{color:#ff8fab;font-size:12px;margin-bottom:4px;font-weight:600}
</style></head><body>
  <form class="card" method="POST" action="/__login">
    <div class="en">Asset Analysis Framework</div>
    <h1>广义金融资产分析框架</h1>
    <div class="sub">资产分类 · 估值材料 · 岗位映射 · 规模 · 优先级 · 数据采购</div>
    ${msg}
    <label>账号</label>
    <input name="u" type="text" autocomplete="username" autofocus required>
    <label>密码</label>
    <input name="p" type="password" autocomplete="current-password" required>
    <button type="submit">登录</button>
  </form>
</body></html>`, {
    status: err ? 401 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const cookie = request.headers.get("Cookie") || "";
  const authed = cookie.split(/;\s*/).includes(`${COOKIE}=${TOKEN}`);

  // 登录提交
  if (url.pathname === "/__login" && request.method === "POST") {
    const form = await request.formData();
    if (form.get("u") === USER && form.get("p") === PASS) {
      return new Response("", { status: 302, headers: {
        "Location": "/",
        "Set-Cookie": `${COOKIE}=${TOKEN}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
      }});
    }
    return loginPage("账号或密码错误");
  }
  // 退出登录
  if (url.pathname === "/__logout") {
    return new Response("", { status: 302, headers: {
      "Location": "/__login",
      "Set-Cookie": `${COOKIE}=; Path=/; Max-Age=0`
    }});
  }
  // 已登录 → 放行真实页面
  if (authed) return next();
  // 未登录 → 任何路径都返回登录页
  return loginPage();
}
