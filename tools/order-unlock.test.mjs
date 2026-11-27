#!/usr/bin/env node
// Local checks only. Synthetic ids. The vault host, the old order API host, and
// mantledb.sh are pinned to 127.0.0.1 so a missed mock cannot redeem a real order or code.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

function loadPuppeteer() {
  const local = createRequire(import.meta.url);
  try { return local('puppeteer-core'); } catch (e) {}
  const pkg = '/tmp/ppt/package.json';
  if (fs.existsSync(pkg)) return createRequire(pkg)('puppeteer-core');
  throw new Error('puppeteer-core is not installed');
}
const puppeteer = loadPuppeteer();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const VAULT = 'https://snappy-tundra-7uesdvk.tmp.now';
const VAULT_HOST = 'snappy-tundra-7uesdvk.tmp.now';
const API_HOST = 'snappy-tundra-7uesdvk-zengpenghui420-glitch.vercel.app';
const ORDER = 'P847291038475610293';
const OTHER = 'P564738291056473829';
const CODE = 'CSABCD';
const REPEAT = 'P111111111111111111';
const SEQUENCE = 'P123456789012345678';
const P19 = 'P9900000000000001378';

function patternError(id) {
  if (!/^P\d{18}$/.test(id)) return 'shape';
  const d = id.slice(1);
  for (const size of [1, 2, 3, 6, 9]) {
    if (d.slice(0, size).repeat(d.length / size) === d) return 'repeat';
  }
  const step = (d.charCodeAt(1) - d.charCodeAt(0) + 10) % 10;
  if (step === 1 || step === 9) {
    let seq = true;
    for (let i = 1; i < d.length; i++) {
      if ((d.charCodeAt(i) - d.charCodeAt(i - 1) + 10) % 10 !== step) seq = false;
    }
    if (seq) return 'sequence';
  }
  return '';
}
if (patternError(ORDER) || patternError(OTHER)) throw new Error('synthetic order is not a legal id');
if (patternError(REPEAT) !== 'repeat') throw new Error('repeat fixture');
if (patternError(SEQUENCE) !== 'sequence') throw new Error('sequence fixture');
if (P19.length !== 20 || /^P\d{18}$/.test(P19)) throw new Error('19-digit fixture');
if (!/^CS[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/.test(CODE)) throw new Error('synthetic code shape');

const script = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
const scriptPath = '/tmp/childhood-shadow-script.js';
fs.writeFileSync(scriptPath, script);
const check = spawnSync(process.execPath, ['--check', scriptPath], { encoding: 'utf8' });
if (check.status !== 0) {
  console.error(check.stderr || check.stdout);
  process.exit(1);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

class Book {
  constructor() {
    this.codeUses = 0;
    this.codeMode = 'ok';
    this.calls = [];
  }
  reset() {
    this.codeUses = 0;
    this.codeMode = 'ok';
    this.calls = [];
  }
  posts(pathname) {
    return this.calls.filter((c) => c.method === 'POST' && c.path === pathname && !c.unexpected);
  }
  handle(method, url, rawBody) {
    const u = new URL(url);
    let body = null;
    if (rawBody) {
      try { body = JSON.parse(rawBody); } catch (e) { body = null; }
    }
    const rec = {
      method,
      path: u.pathname,
      body,
      quiz: (body && body.quiz) || u.searchParams.get('quiz'),
      orderId: (body && body.orderId) || u.searchParams.get('orderId'),
      code: (body && body.code) || u.searchParams.get('code'),
      url,
      host: u.hostname,
    };
    const orderish = u.pathname.startsWith('/order') || u.pathname.includes('/orders/')
      || u.hostname === API_HOST || u.hostname === 'mantledb.sh' || url.includes('vercel.app');
    if (u.origin !== VAULT || orderish) {
      rec.unexpected = true;
      this.calls.push(rec);
      return { abort: true };
    }
    this.calls.push(rec);
    if (u.pathname === '/redeem' && method === 'POST') return this.redeemCode(body);
    rec.unexpected = true;
    return { abort: true };
  }
  redeemCode(body) {
    const code = body && body.code;
    if (this.codeMode === 'drop') return { abort: true };
    if (!body || body.quiz !== 'shadow' || body.orderId || code !== CODE || this.codeMode === 'miss') {
      return { status: 404, body: { ok: false, error: 'not_found' } };
    }
    if (this.codeMode === 'exhausted' || this.codeUses >= 3) {
      return { status: 403, body: { ok: false, error: 'exhausted', remaining: 0, max: 3 } };
    }
    this.codeUses += 1;
    return { status: 200, body: { ok: true, remaining: 3 - this.codeUses, max: 3, quiz: 'shadow' } };
  }
}

function staticContract() {
  assert(HTML.includes("const QUIZ_KEY='shadow'"), 'quiz key');
  assert(HTML.includes("const ORDER_USES_KEY='shadow_order_uses'"), 'quiz-specific use key');
  assert(!HTML.includes('soft_persimmon_order_uses'), 'do not reuse the other quiz key');
  assert(HTML.includes("const LEGACY_REDEEM_URL='https://snappy-tundra-7uesdvk.tmp.now/redeem'"), 'vault redeem url');
  assert(HTML.includes('LEGACY_REDEEM_URL'), 'vault redeem stays wired');
  assert(!HTML.includes('vercel.app'), 'page must not call the order host');
  assert(!HTML.includes('/order/redeem') && !HTML.includes('/order/get') && !HTML.includes('/orders/'), 'no order API');
  assert(!HTML.includes('mantledb') && !HTML.includes('MANTLE_'), 'this page has no Mantle collection');
  assert(!HTML.includes("API_BASE+'/get") && !HTML.includes('/get?quiz='), 'this page does not call GET /get');
  assert(!HTML.includes('暂时验证不了'), 'format-valid ids are not turned away');
  assert(!HTML.includes('这个订单号的 3 次已经用完了'), 'format-valid ids are not exhausted');
  assert(!HTML.includes('次数已经用完'), 'do not show 次数已经用完');
  assert(HTML.includes('3 次已经用完了'), 'exhausted access codes still say so');
  assert(!HTML.includes('只存在这台') && !HTML.includes('local-only') && !HTML.includes('cosmetic') && !HTML.includes('假的'), 'do not describe the count as local-only');
  assert(HTML.includes('paidVerified:false') && !HTML.includes('paidVerified:true') && !HTML.includes('paidVerified: true'), 'paidVerified stays false');
  assert(HTML.includes('输入订单号'), 'order title');
  assert(HTML.includes('到小红书「我的订单」复制订单号贴过来'), 'xiaohongshu copy');
  assert(HTML.includes('每个订单号可以测 3 次'), 'three uses');
  assert(HTML.includes('>重新测试<'), 'retry label stays');
  assert(HTML.includes('童年创伤阴影测试') && HTML.includes('情感空窗') && HTML.includes('你难过或受委屈时'), 'product copy and questions kept');
  assert((HTML.match(/dim:'/g) || []).length === 18, '18 questions kept');
}

function assertNoOrderNet(book, msg) {
  const bad = book.calls.filter((c) => c.unexpected
    || (c.path && (c.path.startsWith('/order') || c.path.includes('/orders/')))
    || String(c.url || '').includes('vercel.app')
    || String(c.url || '').includes('mantledb'));
  assert(bad.length === 0, msg + ' ' + JSON.stringify(bad));
}

function serve() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url.split('?')[0];
      if (url === '/' || url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(HTML);
        return;
      }
      res.writeHead(404).end('no');
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Device-Id,X-Fingerprint,X-Mantle-Key',
};

async function boot(browser, server, book) {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.setCacheEnabled(false);
  await page.evaluateOnNewDocument(() => {
    try {
      if (sessionStorage.getItem('__test_ready')) return;
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('__test_ready', '1');
    } catch (e) {}
  });
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const url = req.url();
    let host = '';
    try { host = new URL(url).hostname; } catch (e) { host = ''; }
    if (req.method() === 'OPTIONS' && (host === VAULT_HOST || host === API_HOST || host === 'mantledb.sh')) {
      if (host !== VAULT_HOST) {
        book.calls.push({ method: 'OPTIONS', url, host, path: new URL(url).pathname, unexpected: true });
      }
      req.respond({ status: 204, headers: CORS }).catch(() => {});
      return;
    }
    if (url.startsWith('http://127.0.0.1') || url.startsWith('data:')) {
      req.continue().catch(() => {});
      return;
    }
    if (host === VAULT_HOST || host === API_HOST || host === 'mantledb.sh' || url.includes('/orders/') || url.includes('vercel.app')) {
      const result = book.handle(req.method(), url, req.postData());
      if (result.abort) {
        req.abort('failed').catch(() => {});
        return;
      }
      req.respond({
        status: result.status,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(result.body),
      }).catch(() => {});
      return;
    }
    book.calls.push({ method: req.method(), path: url, url, unexpected: true });
    req.abort('blockedbyclient').catch(() => {});
  });
  page.__errors = errors;
  page.__origin = 'http://127.0.0.1:' + server.address().port;
  return page;
}

async function openHome(page, query) {
  await page.goto(page.__origin + '/' + (query || ''), { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof redeemOrder === 'function' && typeof redeemVault === 'function');
  await page.waitForSelector('#btnStart');
}

async function submit(page, value) {
  await page.click('#btnStart');
  await page.waitForSelector('#codeMask.show');
  await page.$eval('#codeInput', (el, v) => { el.value = v; }, value);
  await page.click('#btnCodeOk');
}

async function clearToast(page) {
  await page.evaluate(() => { document.getElementById('toast').textContent = ''; });
}

async function waitQuiz(page) {
  await page.waitForSelector('#quiz.active');
  await page.waitForFunction(() => /^\d+ \/ 18$/.test(document.getElementById('qprog').textContent));
}

async function waitFreshQuiz(page) {
  await waitQuiz(page);
  await page.waitForFunction(() => document.getElementById('qprog').textContent === '1 / 18');
}

async function waitResult(page) {
  await page.waitForSelector('#result.active', { timeout: 8000 });
}

async function shownUses(page, orderId = ORDER) {
  return page.evaluate((id) => shownOrderUses(id), orderId);
}

async function answerOne(page) {
  const before = await page.$eval('#qprog', (el) => el.textContent);
  await page.click('#opts .opt');
  await page.waitForFunction((prev) => document.getElementById('qprog').textContent !== prev, {}, before);
}

async function fastFinish(page) {
  await page.evaluate(() => {
    for (let i = 0; i < QS.length; i++) ans[i] = 3;
    qi = QS.length - 1;
    finish();
  });
  await waitResult(page);
}

async function main() {
  staticContract();
  const passed = [];
  const server = await serve();
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      `--host-resolver-rules=MAP ${VAULT_HOST} 127.0.0.1, MAP ${API_HOST} 127.0.0.1, MAP mantledb.sh 127.0.0.1`,
    ],
  });
  const book = new Book();
  try {
    {
      const page = await boot(browser, server, book);
      await openHome(page);
      const visible = await page.evaluate(() => document.body.innerText);
      assert(visible.includes('童年创伤阴影测试'), 'product title');
      assert(!visible.includes('验证码') && !visible.includes('已付款') && !visible.includes('paidVerified'), 'start copy');
      const helpers = await page.evaluate((order, other) => {
        const bad = redeemOrder('P111111111111111111');
        const seq = redeemOrder('P123456789012345678');
        const p19 = redeemOrder('P9900000000000001378');
        return {
          good: orderFormatError(order),
          other: orderFormatError(other),
          repeat: orderFormatError('P111111111111111111'),
          seq: orderFormatError('P123456789012345678'),
          p19: orderFormatError('P9900000000000001378'),
          p19c: classifyInput('P9900000000000001378').type,
          pasted: classifyInput(' 「p8472-9103-8475-610293」 '),
          code: classifyInput(' cs ab cd '),
          junk: classifyInput('hello'),
          shortP: classifyInput('P12345'),
          bad,
          seqRes: seq,
          p19Res: p19,
          stored: shownOrderUses('P111111111111111111'),
          copy: orderSuccessText({ ok: true, uses: 1, remaining: 2, paidVerified: false }),
          next: orderSuccessText({ ok: true, uses: 2, remaining: 1, paidVerified: false }),
          lastCopy: orderSuccessText({ ok: true, uses: 3, remaining: 0, paidVerified: false }),
          laterCopy: orderSuccessText({ ok: true, uses: 4, remaining: 0, paidVerified: false }),
          codeCopy: orderSuccessText({ ok: true, remaining: 2, max: 3 }),
          paid: redeemOrder(order).paidVerified,
        };
      }, ORDER, OTHER);
      assert(helpers.good === '' && helpers.other === '', 'legal synthetic ids rejected');
      assert(helpers.repeat === 'invalid' && helpers.seq === 'invalid' && helpers.p19 === 'invalid', 'pattern ids should be invalid');
      assert(helpers.p19c === 'order-invalid', '19-digit classifier');
      assert(helpers.pasted.type === 'order' && helpers.pasted.orderId === ORDER, 'paste normalize ' + JSON.stringify(helpers.pasted));
      assert(helpers.code.type === 'code' && helpers.code.code === CODE, 'spaced code ' + JSON.stringify(helpers.code));
      assert(helpers.junk.type === 'order-invalid' && helpers.shortP.type === 'order-invalid', 'classifier mixed');
      assert(helpers.bad.ok === false && helpers.seqRes.ok === false && helpers.p19Res.ok === false, 'rejected ids must not unlock');
      assert(helpers.stored === 0, 'rejected id stored a count');
      assert(helpers.copy === '验证成功，还可以测 2 次', helpers.copy);
      assert(helpers.next === '验证成功，还可以测 1 次', helpers.next);
      assert(helpers.lastCopy === '验证成功，这是最后一次', helpers.lastCopy);
      assert(helpers.laterCopy === '验证成功', helpers.laterCopy);
      assert(helpers.codeCopy === '验证成功，还可以测 2 次', helpers.codeCopy);
      assert(helpers.paid === false, 'paidVerified must stay false');
      assert(await shownUses(page) === 1, 'direct redeemOrder records one displayed use');
      assertNoOrderNet(book, 'format helpers');
      assert(book.calls.length === 0, 'format helpers called the network ' + JSON.stringify(book.calls));
      await page.evaluate(() => localStorage.removeItem(ORDER_USES_KEY));

      await submit(page, ' 「p8472-9103-8475-610293」 ');
      await waitFreshQuiz(page);
      assert(await shownUses(page) === 1, 'first start should display one use');
      const toast = await page.$eval('#toast', (el) => el.textContent);
      assert(toast === '验证成功，还可以测 2 次' && !toast.includes('付款'), 'success copy ' + toast);
      const q1 = await page.$eval('#qtext', (el) => el.textContent);
      assert(q1.length > 8, 'question missing');
      assertNoOrderNet(book, 'first start');

      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitQuiz(page);
      assert(await page.$eval('#qprog', (el) => el.textContent) === '1 / 18', 'refresh left question 1');
      assert(await shownUses(page) === 1, 'refresh at question 1 changed the display count');
      assertNoOrderNet(book, 'refresh');

      await answerOne(page);
      await answerOne(page);
      const prog = await page.$eval('#qprog', (el) => el.textContent);
      assert(prog === '3 / 18', 'progress ' + prog);
      const mid = await page.evaluate(() => ({ qi, a0: ans[0], a1: ans[1] }));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitQuiz(page);
      const resumed = await page.evaluate(() => ({
        prog: document.getElementById('qprog').textContent,
        qi,
        a0: ans[0],
        a1: ans[1],
      }));
      assert(resumed.prog === '3 / 18' && resumed.qi === mid.qi && resumed.a0 === 1 && resumed.a1 === 1, 'mid refresh ' + JSON.stringify(resumed));
      assert(await shownUses(page) === 1, 'mid refresh changed the display count');
      assertNoOrderNet(book, 'mid refresh');

      await page.click('#qback');
      await page.waitForSelector('#start.active');
      const contLabel = await page.$eval('#btnStart', (el) => el.textContent);
      assert(contLabel === '继续测试', contLabel);
      await page.click('#btnStart');
      await page.waitForSelector('#quiz.active');
      const cont = await page.evaluate(() => ({
        prog: document.getElementById('qprog').textContent,
        a0: ans[0],
      }));
      assert(cont.prog === '3 / 18' && cont.a0 === 1, 'continue reset the attempt ' + JSON.stringify(cont));
      assert(await shownUses(page) === 1, 'continue changed the display count');
      assertNoOrderNet(book, 'continue');

      await fastFinish(page);
      const firstIndex = await page.$eval('.index-num', (el) => el.textContent);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await waitResult(page);
      const peeked = await page.$eval('.index-num', (el) => el.textContent);
      assert(peeked === firstIndex, 'result refresh changed the index');
      assert(await shownUses(page) === 1, 'result refresh changed the display count');
      assertNoOrderNet(book, 'result refresh');

      await page.evaluate(() => show('start'));
      await page.click('#btnStart');
      await waitResult(page);
      assert(await page.$eval('.index-num', (el) => el.textContent) === firstIndex, '查看本次结果 changed the result');
      assert(await shownUses(page) === 1, '查看本次结果 changed the display count');
      assertNoOrderNet(book, 'restore click');

      await page.click('#btnViewLast');
      await page.waitForFunction(() => document.getElementById('toast').textContent.includes('不扣次'));
      assert(await shownUses(page) === 1, '查看上次 changed the display count');
      await page.evaluate(() => show('start'));
      await page.click('#btnLast');
      await page.waitForFunction(() => document.getElementById('toast').textContent.includes('不扣次'));
      assert(await shownUses(page) === 1, '查看上次结果 changed the display count');
      assertNoOrderNet(book, 'view last');

      await page.click('#btnRetry');
      await waitFreshQuiz(page);
      assert(await shownUses(page) === 2, 'retest should display the second use');
      const secondToast = await page.$eval('#toast', (el) => el.textContent);
      assert(secondToast === '验证成功，还可以测 1 次', secondToast);
      const restarted = await page.evaluate(() => ({ prog: document.getElementById('qprog').textContent, len: ans.filter((v) => v != null).length }));
      assert(restarted.prog === '1 / 18' && restarted.len === 0, 'retest should open a new attempt ' + JSON.stringify(restarted));
      assertNoOrderNet(book, 'second start');
      await fastFinish(page);

      await page.click('#btnRetry');
      await waitFreshQuiz(page);
      assert(await shownUses(page) === 3, 'third displayed use');
      const thirdToast = await page.$eval('#toast', (el) => el.textContent);
      assert(thirdToast === '验证成功，这是最后一次', thirdToast);
      await fastFinish(page);

      await page.click('#btnRetry');
      await waitFreshQuiz(page);
      await page.waitForFunction(() => document.getElementById('toast').textContent === '验证成功');
      const after = await page.evaluate((id) => ({
        quiz: document.getElementById('quiz').classList.contains('active'),
        toast: document.getElementById('toast').textContent,
        uses: shownOrderUses(id),
      }), ORDER);
      assert(after.quiz, 'a later entry must still open the quiz');
      assert(after.toast === '验证成功' && !after.toast.includes('用完') && !after.toast.includes('暂时验证不了'), after.toast);
      assert(after.uses === 4, 'later entry still records a display count');
      assertNoOrderNet(book, 'later entry');
      assert(book.calls.length === 0, 'order flow called the network ' + JSON.stringify(book.calls));

      await page.evaluate(() => { clearUnlock(); show('start'); });
      await submit(page, OTHER);
      await waitFreshQuiz(page);
      assert(await shownUses(page, OTHER) === 1, 'other id should start at one');
      assert(await shownUses(page, ORDER) === 4, 'other id changed the first count');
      const otherToast = await page.$eval('#toast', (el) => el.textContent);
      assert(otherToast === '验证成功，还可以测 2 次', otherToast);
      assertNoOrderNet(book, 'other id');
      assert(page.__errors.length === 0, page.__errors.join('\n'));
      await page.close();
      passed.push('有效订单号本地解锁，刷新/继续/上次结果不改提示，重新测试推进，三次后仍可进入');
    }

    book.reset();
    {
      const page = await boot(browser, server, book);
      await openHome(page);
      for (const value of [REPEAT, P19, SEQUENCE, 'hello']) {
        await clearToast(page);
        if (value === REPEAT) await submit(page, value);
        else {
          await page.waitForSelector('#codeMask.show');
          await page.$eval('#codeInput', (el, v) => { el.value = v; }, value);
          await page.click('#btnCodeOk');
        }
        await page.waitForFunction(() => document.getElementById('toast').textContent.includes('格式不对'));
        const state = await page.evaluate(() => ({
          quiz: document.getElementById('quiz').classList.contains('active'),
          unlocked: isUnlocked(),
        }));
        assert(!state.quiz && !state.unlocked, value + ' started the quiz');
      }
      assert(await shownUses(page, REPEAT) === 0, 'rejected id stored a count');
      assert(await shownUses(page, SEQUENCE) === 0 && await shownUses(page, P19) === 0, 'rejected ids stored a count');
      assert(book.calls.length === 0, 'invalid ids called the network ' + JSON.stringify(book.calls));
      assert(page.__errors.length === 0, page.__errors.join('\n'));
      await page.close();
      passed.push('19位/重复/序列在本地拒绝');
    }

    book.reset();
    {
      const page = await boot(browser, server, book);
      await openHome(page);
      await submit(page, ' cs ab cd ');
      await waitFreshQuiz(page);
      const posts = book.posts('/redeem');
      assert(posts.length === 1, 'vault redeem once, got ' + JSON.stringify(book.calls));
      assert(posts[0].body.quiz === 'shadow' && posts[0].body.code === CODE && !('orderId' in posts[0].body), 'vault body ' + JSON.stringify(posts[0].body));
      assert(posts[0].host === VAULT_HOST, 'vault host ' + posts[0].host);
      assertNoOrderNet(book, 'code redeem');
      const codeToast = await page.$eval('#toast', (el) => el.textContent);
      assert(codeToast === '验证成功，还可以测 2 次', codeToast);
      assert(book.codeUses === 1, 'vault remaining was not consumed in the mock');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#quiz.active');
      assert(book.posts('/redeem').length === 1, 'code refresh redeemed again');
      await fastFinish(page);
      await page.click('#btnRetry');
      await page.waitForSelector('#codeMask.show');
      const prefill = await page.$eval('#codeInput', (el) => el.value);
      assert(prefill === CODE, 'code retry prefill ' + prefill);
      await page.click('#btnCodeOk');
      await waitFreshQuiz(page);
      assert(book.posts('/redeem').length === 2 && book.codeUses === 2, 'code retry redeems again ' + JSON.stringify(book.calls));
      const again = await page.$eval('#toast', (el) => el.textContent);
      assert(again === '验证成功，还可以测 1 次', again);
      assertNoOrderNet(book, 'code retry');
      assert(page.__errors.length === 0, page.__errors.join('\n'));
      await page.close();
      passed.push('访问码仍走 vault，并按真实剩余次数提示');
    }

    book.reset();
    {
      const page = await boot(browser, server, book);
      await openHome(page);
      book.codeMode = 'miss';
      await submit(page, CODE);
      await page.waitForFunction(() => document.getElementById('toast').textContent.includes('没有找到'));
      assert(await page.$eval('#quiz', (el) => !el.classList.contains('active')), 'vault miss opened the quiz');
      assert(await page.evaluate(() => !isUnlocked()), 'vault miss unlocked');
      assert(book.posts('/redeem').length === 1, 'vault miss did not call /redeem');
      assert(book.codeUses === 0, 'vault miss consumed a use');
      assertNoOrderNet(book, 'vault miss');
      await page.close();

      book.reset();
      const exhausted = await boot(browser, server, book);
      await openHome(exhausted);
      book.codeMode = 'exhausted';
      await submit(exhausted, CODE);
      await exhausted.waitForFunction(() => document.getElementById('toast').textContent.includes('3 次已经用完了'));
      assert(await exhausted.$eval('#quiz', (el) => !el.classList.contains('active')), 'exhausted code opened the quiz');
      assert(book.posts('/redeem').length === 1 && book.codeUses === 0, 'exhausted code still incremented');
      assertNoOrderNet(book, 'exhausted code');
      await exhausted.close();

      book.reset();
      const down = await boot(browser, server, book);
      await openHome(down);
      book.codeMode = 'drop';
      await submit(down, CODE);
      await down.waitForFunction(() => document.getElementById('toast').textContent.includes('网络有点不稳定'));
      assert(await down.evaluate(() => !isUnlocked()), 'vault outage unlocked');
      assertNoOrderNet(book, 'vault outage');
      await down.close();
      passed.push('vault 未命中、用完、中断都不落到 Mantle 或订单接口');
    }

    book.reset();
    {
      const page = await boot(browser, server, book);
      await page.goto(page.__origin + '/?code=' + ORDER, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#codeMask.show');
      const prefill = await page.$eval('#codeInput', (el) => el.value);
      const linked = await page.evaluate((id) => ({
        quiz: document.getElementById('quiz').classList.contains('active'),
        uses: shownOrderUses(id),
      }), ORDER);
      assert(prefill === ORDER && !linked.quiz && linked.uses === 0, 'query order auto-started ' + JSON.stringify(linked));
      assert(book.calls.length === 0, 'query order called the network');
      await page.close();

      const codePage = await boot(browser, server, book);
      await codePage.goto(codePage.__origin + '/?code=' + CODE, { waitUntil: 'domcontentloaded' });
      await codePage.waitForSelector('#codeMask.show');
      assert(await codePage.$eval('#codeInput', (el) => el.value) === CODE, 'query code prefill');
      assert(book.posts('/redeem').length === 0, 'query code redeemed by itself');
      await codePage.close();
      passed.push('链接只预填，不自己开始');
    }

    book.reset();
    {
      for (const width of [320, 390]) {
        const page = await boot(browser, server, book);
        await page.setViewport({ width, height: 780, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        await openHome(page);
        await page.click('#btnStart');
        await page.waitForSelector('#codeMask.show');
        await page.$eval('#codeInput', (el, v) => { el.value = v; }, ORDER);
        const box = await page.evaluate(() => {
          const panel = document.querySelector('.code-panel');
          const input = document.getElementById('codeInput');
          const r = panel.getBoundingClientRect();
          return {
            client: document.documentElement.clientWidth,
            panelRight: r.right,
            panelLeft: r.left,
            inputScroll: input.scrollWidth,
            inputClient: input.clientWidth,
            title: document.querySelector('.code-panel h3').textContent,
            hint: document.querySelector('.code-hint').innerText,
            placeholder: input.placeholder,
          };
        });
        assert(box.panelLeft >= -1 && box.panelRight <= box.client + 1, width + ' panel overflows ' + JSON.stringify(box));
        assert(box.inputScroll <= box.inputClient + 2, width + ' order id overflows the input ' + JSON.stringify(box));
        assert(box.title === '输入订单号', 'title ' + box.title);
        assert(box.hint.includes('我的订单') && box.hint.includes('3 次'), 'hint ' + box.hint);
        assert(box.placeholder === '订单号', 'placeholder');
        assert(book.calls.length === 0, 'opening the form called the network');
        await page.close();
      }
      passed.push('手机 320 与 390');
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(JSON.stringify({ ok: true, passed }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
