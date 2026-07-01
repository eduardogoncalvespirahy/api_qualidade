import crypto from 'crypto';
import express, { Request } from 'express';

// ─────────────────────────────────────────────────────────────
// Configuração (defina no seu .env)
//   SWAGGER_PASSWORD → senha de acesso à documentação
//   SWAGGER_SECRET   → segredo para assinar o cookie (string longa/aleatória)
// ─────────────────────────────────────────────────────────────
const PASSWORD = process.env.SWAGGER_PASSWORD || 'troque-esta-senha';
const SECRET = process.env.SWAGGER_SECRET || 'troque-este-segredo-por-um-aleatorio';
const COOKIE_NAME = 'swagger_auth';
const MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 horas

// ───────── token assinado (HMAC) ─────────
function sign(expiresAt: number): string {
  const payload = String(expiresAt);
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verify(token?: string): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;

  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const exp = Number(payload);
  return Number.isFinite(exp) && Date.now() < exp;
}

function readCookie(req: Request, name: string): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    const k = part.slice(0, idx).trim();
    if (k === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

// comparação de senha em tempo (aproximadamente) constante
function passwordOk(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ───────── página de senha (HTML simples) ─────────
function loginPage(baseUrl: string, erro: boolean): string {
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Documentação · Acesso restrito</title>
  <style>
    :root {
      --bg: #0b1220; --card: #1e293b; --line: #334155; --ink: #e2e8f0;
      --muted: #94a3b8; --accent: #0d6efd; --accent-2: #3b82f6; --danger: #f87171;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: var(--ink);
      background:
        radial-gradient(1100px 500px at 15% -10%, #16233f 0%, transparent 55%),
        radial-gradient(900px 500px at 110% 120%, #10203a 0%, transparent 50%),
        var(--bg);
    }
    .card {
      width: 100%; max-width: 380px; background: var(--card);
      border: 1px solid var(--line); border-radius: 18px; padding: 30px;
      box-shadow: 0 24px 60px rgba(0,0,0,.45);
      animation: rise .35s ease both;
    }
    @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    .brand {
      width: 50px; height: 50px; border-radius: 14px; display: grid; place-items: center;
      color: #93c5fd; margin-bottom: 18px;
      background: linear-gradient(135deg, #0d6efd33, #3b82f61a);
      border: 1px solid #3b82f633;
    }
    .brand svg { width: 24px; height: 24px; }
    h1 { margin: 0 0 6px; font-size: 19px; letter-spacing: -.01em; }
    .sub { margin: 0 0 22px; font-size: 13.5px; color: var(--muted); line-height: 1.5; }
    label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 7px; letter-spacing: .02em; }
    .field { position: relative; }
    input[type=password], input[type=text] {
      width: 100%; padding: 12px 44px 12px 13px; border-radius: 11px;
      border: 1px solid var(--line); background: #0f172a; color: var(--ink);
      font-size: 14px; transition: border-color .15s ease, box-shadow .15s ease;
    }
    input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px #0d6efd33; }
    .toggle {
      position: absolute; top: 50%; right: 6px; transform: translateY(-50%);
      width: 34px; height: 34px; display: grid; place-items: center;
      border: none; background: transparent; color: var(--muted); cursor: pointer; border-radius: 9px;
    }
    .toggle:hover { color: var(--ink); background: #ffffff0d; }
    .toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
    .toggle svg { width: 20px; height: 20px; }
    .toggle .eye-off { display: none; }
    .toggle.is-visible .eye { display: none; }
    .toggle.is-visible .eye-off { display: block; }
    .caps {
      display: none; align-items: center; gap: 6px; margin-top: 9px;
      font-size: 12px; color: #fbbf24;
    }
    .caps svg { width: 14px; height: 14px; }
    .btn {
      width: 100%; margin-top: 18px; padding: 12px; border: none; border-radius: 11px;
      background: linear-gradient(135deg, var(--accent), var(--accent-2)); color: #fff;
      font-size: 14.5px; font-weight: 600; cursor: pointer; transition: filter .15s ease, transform .05s ease;
    }
    .btn:hover { filter: brightness(1.06); }
    .btn:active { transform: translateY(1px); }
    .alert {
      display: flex; align-items: center; gap: 8px; margin-top: 16px;
      padding: 10px 12px; border-radius: 10px; font-size: 13px;
      background: #f8717115; border: 1px solid #f8717133; color: var(--danger);
    }
    .alert svg { width: 16px; height: 16px; flex: none; }
    .foot { margin-top: 20px; text-align: center; font-size: 11.5px; color: #64748b; }
  </style>
</head>
<body>
  <form class="card" method="post" action="${baseUrl}/login" autocomplete="off" novalidate>
    <div class="brand" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    </div>
    <h1>Acesso restrito</h1>
    <p class="sub">Informe a senha para visualizar a documentação da API.</p>

    <label for="senha">Senha</label>
    <div class="field">
      <input id="senha" name="senha" type="password" autocomplete="current-password" autofocus required />
      <button id="toggle" class="toggle" type="button" aria-label="Mostrar senha" aria-pressed="false">
        <svg class="eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
        </svg>
        <svg class="eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
          <path d="M6.6 6.6A13.3 13.3 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
          <path d="m2 2 20 20" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      </button>
    </div>

    <div id="caps" class="caps" role="status">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 4 8 8h-5v5H9v-5H4l8-8Z"/></svg>
      Caps Lock ativado
    </div>

    <button class="btn" type="submit">Entrar</button>
    ${erro ? '<div class="alert" role="alert"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>Senha incorreta. Tente novamente.</div>' : ''}

    <p class="foot">Área protegida &middot; acesso somente autorizado</p>
  </form>

  <script>
    (function () {
      var input = document.getElementById('senha');
      var toggle = document.getElementById('toggle');
      var caps = document.getElementById('caps');

      toggle.addEventListener('click', function () {
        var hidden = input.getAttribute('type') === 'password';
        input.setAttribute('type', hidden ? 'text' : 'password');
        toggle.classList.toggle('is-visible', hidden);
        toggle.setAttribute('aria-pressed', hidden ? 'true' : 'false');
        toggle.setAttribute('aria-label', hidden ? 'Ocultar senha' : 'Mostrar senha');
        input.focus();
      });

      function checkCaps(e) {
        var on = typeof e.getModifierState === 'function' && e.getModifierState('CapsLock');
        caps.style.display = on ? 'flex' : 'none';
      }
      input.addEventListener('keydown', checkCaps);
      input.addEventListener('keyup', checkCaps);
      input.addEventListener('blur', function () { caps.style.display = 'none'; });
    })();
  </script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Router: trata o POST /login e faz o "portão" (gate) de acesso.
// Use ANTES do swaggerUi.serve/setup.
// ─────────────────────────────────────────────────────────────
export const swaggerAuth = express.Router();

// necessário para ler a senha enviada pelo formulário
swaggerAuth.use(express.urlencoded({ extended: false }));

// recebe a senha
swaggerAuth.post('/login', (req, res) => {
  const senha = String((req.body && req.body.senha) || '');
  if (passwordOk(senha)) {
    const token = sign(Date.now() + MAX_AGE_MS);
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: MAX_AGE_MS,
    });
    return res.redirect(req.baseUrl || '/api-docs');
  }
  return res.status(401).send(loginPage(req.baseUrl || '/api-docs', true));
});

// opcional: encerrar a sessão da documentação
swaggerAuth.get('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME);
  return res.send(loginPage(req.baseUrl || '/api-docs', false));
});

// portão: sem cookie válido → mostra a tela de senha
swaggerAuth.use((req, res, next) => {
  if (verify(readCookie(req, COOKIE_NAME))) return next();
  return res.status(401).send(loginPage(req.baseUrl || '/api-docs', false));
});