export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>No pudimos cargar esta página</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Karla:wght@400;500;600&display=swap" />
    <style>
      :root { --background: #F3E9D7; --foreground: #2A2A2A; --primary: #1F4E6B; --card: #FFFFFF; --border: color-mix(in srgb, var(--primary) 18%, var(--background)); }
      * { box-sizing: border-box; }
      body { font: 15px/1.5 "Karla", sans-serif; background: var(--background); color: var(--foreground); display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font: 600 2rem/1.2 "Cormorant Garamond", Georgia, serif; margin: 0 0 0.5rem; }
      p { color: var(--foreground); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: var(--primary); color: var(--card); }
      .secondary { background: var(--card); color: var(--foreground); border-color: var(--border); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>No pudimos cargar esta página</h1>
      <p>Algo salió mal. Probá de nuevo o volvé al panel.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Probá de nuevo</button>
        <a class="secondary" href="/">Volvé al panel</a>
      </div>
    </div>
  </body>
</html>`;
}
