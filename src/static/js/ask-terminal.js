// agentcart terminal (/ask/). Talks to netlify/edge-functions/ask.js, which
// streams NDJSON events (see the header comment there for the protocol).
// Model output is untrusted: it is HTML-escaped before the small markdown
// pass below, and only site-relative links survive.
(() => {
  const root = document.getElementById("agentcart");
  if (!root) return;

  const screen = root.querySelector("[data-screen]");
  const input = root.querySelector("[data-input]");
  const menu = root.querySelector("[data-menu]");
  const hint = root.querySelector("[data-hint]");
  const usage = root.querySelector("[data-usage]");

  const ENDPOINT = "/api/ask";
  const FRAMES = ["·", "✢", "✳", "✶", "✻", "✽", "✻", "✶", "✳", "✢"];
  const VERBS = [
    "Warming up the token soup",
    "We could have used a smaller model but someone wanted 'quality'",
    "Applying layer after layer of disembodied cognition",
    "Generating an embedding for each and every letter of the alphabet, individually",
    "Convincing CUDA to cooperate. This may take a while",
    "Steeping",
    "Offloading experts to system RAM",
    "Re-reading the changelog",
    "Quantizing the vibes",
  ];
  const SHORTCUTS =
    "enter send · shift+enter newline · esc interrupt · ↑↓ history · ctrl+l clear · / commands";

  const state = {
    history: [], // { role, content } turns sent back for follow-ups
    lastHits: [],
    sent: [], // prompt history for ↑/↓
    sentIdx: -1,
    busy: null, // AbortController while a request is in flight
    menuIdx: 0,
    vim: false, // inside the /vim easter egg
  };
  const context = root.querySelector("[data-context]");

  // ── Mascot: a block-art cart with eyes. Blinks when idle, rolls its
  // wheels while waiting, looks pleased once words arrive. ──────────────
  const logo = (() => {
    const node = root.querySelector("[data-logo]");
    const EYES = {
      open: " ▐  ▌ ",
      shut: " ▂  ▂ ",
      busy: " ▗  ▖ ",
      happy: " ▀  ▀ ",
    };
    const WHEELS = ["   ▝▘  ▝▘", "   ▘▝  ▘▝"];
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let eyes = EYES.open;
    let wheel = 0;
    let roll = null;
    let blink = null;
    let nap = null; // idle timer before it dozes off
    let zzz = null; // snore animation
    let snore = "";
    const draw = () => {
      if (node)
        node.textContent = `▗▄       ${snore}\n  █▀▀▀▀▀▀█\n  █${eyes}█\n  ▜▄▄▄▄▄▄▛\n${WHEELS[wheel]}`;
    };
    const wake = () => {
      clearInterval(zzz);
      zzz = null;
      snore = "";
    };
    const scheduleNap = () => {
      clearTimeout(nap);
      nap = setTimeout(() => {
        clearTimeout(blink);
        eyes = EYES.shut;
        snore = "z";
        if (!still)
          zzz = setInterval(() => {
            snore = snore === "z" ? "zZ" : snore === "zZ" ? "zZz" : "z";
            draw();
          }, 900);
        draw();
      }, 60000);
    };
    const scheduleBlink = () => {
      clearTimeout(blink);
      if (still) return;
      blink = setTimeout(
        () => {
          if (eyes === EYES.open) {
            eyes = EYES.shut;
            draw();
            setTimeout(() => {
              if (eyes === EYES.shut && !snore) eyes = EYES.open;
              draw();
            }, 140);
          }
          scheduleBlink();
        },
        2500 + Math.random() * 4000,
      );
    };
    const stopRoll = () => {
      clearInterval(roll);
      roll = null;
    };
    draw();
    scheduleBlink();
    scheduleNap();
    return {
      // Any keypress: open the eyes if it was asleep, restart the nap timer.
      poke() {
        if (snore) {
          wake();
          eyes = EYES.open;
          draw();
          scheduleBlink();
        }
        scheduleNap();
      },
      busy() {
        wake();
        clearTimeout(nap);
        eyes = EYES.busy;
        if (!still && !roll)
          roll = setInterval(() => {
            wheel = 1 - wheel;
            draw();
          }, 180);
        draw();
      },
      happy() {
        stopRoll();
        eyes = EYES.happy;
        draw();
      },
      idle() {
        stopRoll();
        eyes = EYES.open;
        draw();
        scheduleBlink();
        scheduleNap();
      },
    };
  })();

  // ── DOM helpers ───────────────────────────────────────────────────────
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };
  const nearBottom = () =>
    screen.scrollHeight - screen.scrollTop - screen.clientHeight < 80;
  const scroll = (force) => {
    if (force || nearBottom()) screen.scrollTop = screen.scrollHeight;
  };
  const append = (node) => {
    const stick = nearBottom();
    screen.append(node);
    scroll(stick);
    return node;
  };

  // "⏺ Name(arg)" row
  function bullet(name, arg, { dim = false, busy = false } = {}) {
    const row = el(
      "div",
      `term-row term-bullet${dim ? " is-dim" : ""}${busy ? " is-busy" : ""}`,
    );
    row.append(el("span", "term-glyph", "⏺"));
    const body = el("span");
    if (name) body.append(el("span", "term-tool-name", name));
    if (arg != null) body.append(el("span", "term-tool-arg", `(${arg})`));
    row.append(body);
    return row;
  }

  // "  ⎿  text" row, appended under the previous row
  function sub(parent, content, { fail = false } = {}) {
    const row = el("div", `term-sub${fail ? " is-fail" : ""}`);
    row.append(el("span"), el("span", "term-elbow", "⎿"));
    const body = el("span");
    if (typeof content === "string") body.textContent = content;
    else body.append(content);
    row.append(body);
    parent.append(row);
    scroll();
    return row;
  }

  // A lone "  ⎿  text" line for one-line replies (vim, unknown command).
  function notice(text) {
    const row = el("div", "term-row");
    sub(row, text);
    return append(row);
  }

  function box(lines, accent = false) {
    const node = el("div", `term-box${accent ? " is-accent" : ""}`);
    for (const line of lines) {
      const p = el("p", line.dim ? "term-dim" : "");
      if (line.html) p.innerHTML = line.html;
      else p.textContent = line.text ?? line;
      node.append(p);
    }
    return append(node);
  }

  function citeRows(parent, hits) {
    for (const hit of hits) {
      const row = el("div", "term-cite");
      row.append(el("span", "term-cite-n", `[${hit.n}]`));
      row.append(el("span", "term-cite-k", hit.k));
      const link = el("a", "", hit.h ? `${hit.title} › ${hit.h}` : hit.title);
      link.href = hit.u;
      row.append(link);
      sub(parent, row);
    }
  }

  // ── Markdown (escape first, then a deliberately small subset) ─────────
  const escapeHtml = (s) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  function inline(text, hits) {
    const codes = [];
    let s = escapeHtml(text).replace(/`([^`]+)`/g, (_, c) => {
      codes.push(c);
      return `\u0000${codes.length - 1}\u0000`;
    });
    s = s
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
        /^\/(?!\/)|^https:\/\/carteakey\.dev\//.test(url)
          ? `<a href="${url}">${label}</a>`
          : label,
      )
      .replace(/\[(\d{1,2})\]/g, (m, n) => {
        const hit = hits[Number(n) - 1];
        return hit
          ? `<a class="term-ref" href="${escapeHtml(hit.u)}" title="${escapeHtml(hit.title)}">[${n}]</a>`
          : m;
      });
    return s.replace(
      /\u0000(\d+)\u0000/g,
      (_, i) => `<code>${codes[i]}</code>`,
    );
  }

  function markdown(src, hits) {
    const out = [];
    let para = [];
    let list = null;
    let fence = null;
    const flushPara = () => {
      if (para.length) out.push(`<p>${inline(para.join(" "), hits)}</p>`);
      para = [];
    };
    const flushList = () => {
      if (list)
        out.push(
          `<${list.tag}>${list.items.map((i) => `<li>${inline(i, hits)}</li>`).join("")}</${list.tag}>`,
        );
      list = null;
    };
    for (const line of src.split("\n")) {
      if (line.trim().startsWith("```")) {
        if (fence) {
          out.push(`<pre><code>${escapeHtml(fence.join("\n"))}</code></pre>`);
          fence = null;
        } else {
          flushPara();
          flushList();
          fence = [];
        }
        continue;
      }
      if (fence) {
        fence.push(line);
        continue;
      }
      const item = line.match(/^\s*(?:([-*])|(\d+)\.)\s+(.*)/);
      if (item) {
        flushPara();
        const tag = item[1] ? "ul" : "ol";
        if (list && list.tag !== tag) flushList();
        (list ||= { tag, items: [] }).items.push(item[3]);
      } else if (!line.trim()) {
        flushPara();
        flushList();
      } else {
        flushList();
        para.push(line.replace(/^#+\s*/, ""));
      }
    }
    if (fence)
      out.push(`<pre><code>${escapeHtml(fence.join("\n"))}</code></pre>`);
    flushPara();
    flushList();
    return out.join("");
  }

  // ── Spinner ───────────────────────────────────────────────────────────
  function spinner() {
    const row = el("div", "term-spinner");
    const glyph = el("span", "", FRAMES[0]);
    const text = el("span", "term-spin-text");
    const meta = el("span", "term-spin-meta");
    const body = el("span");
    body.append(text, " ", meta);
    row.append(glyph, body);
    append(row);

    const started = performance.now();
    let frame = 0;
    let verb = Math.floor(Math.random() * VERBS.length);
    let override = null;
    let extra = "";
    const render = () => {
      const secs = Math.floor((performance.now() - started) / 1000);
      glyph.textContent = FRAMES[frame % FRAMES.length];
      text.textContent = `${override || VERBS[verb]}…`;
      meta.textContent = `(${secs}s${extra} · esc to interrupt)`;
    };
    const tick = setInterval(() => {
      frame += 1;
      if (frame % 25 === 0) verb = (verb + 1) % VERBS.length;
      render();
    }, 120);
    render();
    return {
      set(label) {
        override = label;
        render();
      },
      note(label) {
        extra = label ? ` · ${label}` : "";
        render();
      },
      elapsed: () => (performance.now() - started) / 1000,
      stop() {
        clearInterval(tick);
        row.remove();
      },
      row,
    };
  }

  // ── Context meter ─────────────────────────────────────────────────────
  // Only the last few turns go back to the model anyway, so "auto-compact"
  // is real in spirit: past the budget, older turns are dropped.
  const CONTEXT_BUDGET = 6000; // rough tokens, chars / 4
  const contextLeft = () => {
    const used = state.history.reduce((n, m) => n + m.content.length, 0) / 4;
    return Math.max(0, 100 - Math.round((used / CONTEXT_BUDGET) * 100));
  };
  const showContext = () => {
    if (context)
      context.textContent = `Context left until auto-compact: ${contextLeft()}%`;
  };
  function compact(auto) {
    const before = state.history.length;
    state.history = state.history.slice(-2);
    const row = append(
      bullet(auto ? "Auto-compacting conversation…" : "Compact", null, {
        dim: true,
      }),
    );
    sub(row, `Compacted. (It was ${before} messages. You're fine.)`);
    showContext();
  }

  // ── Commands ──────────────────────────────────────────────────────────
  const COMMANDS = {
    "/help": [
      "Show commands and shortcuts",
      () => {
        const row = append(bullet("Help"));
        for (const [name, [desc]] of Object.entries(COMMANDS))
          sub(row, `${name.padEnd(10)} ${desc}`);
        sub(row, SHORTCUTS);
      },
    ],
    "/clear": [
      "Clear the screen and forget the conversation",
      () => {
        screen
          .querySelectorAll(".term-row, .term-box, .term-spinner")
          .forEach((n) => n.remove());
        state.history = [];
        state.lastHits = [];
        showContext();
      },
    ],
    "/sources": [
      "Citations behind the last answer",
      () => {
        const row = append(bullet("Sources"));
        if (!state.lastHits.length)
          sub(row, "Nothing cited yet. Ask something first.");
        else citeRows(row, state.lastHits);
      },
    ],
    "/route": [
      "How a question finds a model",
      () => {
        const row = append(bullet("Route"));
        sub(
          row,
          "1  openrouter   free tier: gemma-4-31b, nemotron-3.5-lightning, gemma-4-26b",
        );
        sub(row, "2  nvidia       nemotron, on NVIDIA's free endpoint");
        const local = el("span");
        local.append("3  local        gemma-4-26b QAT + MTP on ");
        const a = el("a", "", "yeti");
        a.href = "/devices/yeti-cachy/";
        local.append(a, ", Kartikey's own box, through a tunnel");
        sub(row, local);
        sub(row, "4  out of service");
        sub(
          row,
          "A hop is skipped if no token arrives in time. Retrieval is BM25 over published pages.",
        );
      },
    ],
    "/model": [
      "Which model answers",
      () => {
        sub(
          append(bullet("Model", "auto")),
          "The router takes the first free model that answers. Not configurable. This isn't a SaaS.",
        );
      },
    ],
    "/cost": [
      "What this conversation cost",
      () => {
        const row = append(bullet("Cost"));
        sub(row, "Total cost:            $0.0000");
        sub(row, "Total duration (API):  nobody's counting");
        sub(row, "Kartikey's power bill: not your problem");
      },
    ],
    "/about": [
      "What is this",
      () => {
        const row = append(bullet("About"));
        sub(
          row,
          "agentcart answers questions about carteakey.dev from its published pages: posts, notes, snippets, TILs, devices.",
        );
        sub(
          row,
          "Drafts that are public are in. Hidden pages, the inbox and anything unpublished are not.",
        );
        sub(
          row,
          "Your questions go to a third-party model provider, so don't paste secrets.",
        );
      },
    ],
    "/compact": [
      "Summarise the conversation to free up context",
      () => compact(false),
    ],
    "/doctor": [
      "Check the terminal's health",
      async () => {
        const row = append(bullet("Doctor"));
        const pause = () => new Promise((r) => setTimeout(r, 260));
        let corpus = "✗ corpus: unreachable";
        try {
          const res = await fetch("/ask/corpus.json", { method: "HEAD" });
          const kb = Math.round(
            Number(res.headers.get("content-length")) / 1024,
          );
          corpus = res.ok
            ? `✓ corpus: /ask/corpus.json${kb ? ` (${kb} KB)` : ""}`
            : `✗ corpus: HTTP ${res.status}`;
        } catch {}
        for (const line of [
          "✓ terminal: renders, mostly",
          corpus,
          "✓ openrouter: free, therefore busy",
          "✓ nvidia: nemotron, probably awake",
          "✓ yeti: fans audible",
          "✓ wallet: $0.00 (stable)",
          "✓ cart: eyes open",
        ]) {
          await pause();
          sub(row, line);
        }
      },
    ],
    "/exit": [
      "Leave the terminal",
      () => {
        window.location.href = "/";
      },
    ],
  };
  const HIDDEN_COMMANDS = {
    "/coffee": () => {
      const row = append(bullet("Coffee", null, { dim: true }));
      sub(row, "HTTP 418: I'm a teapot.");
      sub(row, "This site runs on the TEA stack: Tailwind, Eleventy, Alpine.");
    },
    "/tea": () =>
      sub(append(bullet("Tea")), "Steeping… ✓ Done. Still no coffee."),
    "/sudo": () => {
      const row = append(bullet("sudo", null, { dim: true }));
      sub(
        row,
        "visitor is not in the sudoers file. This incident will be reported.",
      );
      sub(row, "(It won't. There's no one to report it to.)");
    },
    "/vim": () => {
      state.vim = true;
      hint.textContent = "-- NORMAL --";
      sub(
        append(bullet("vim", null, { dim: true })),
        "You are now in vim. Good luck.",
      );
    },
    "/upgrade": () => {
      const row = append(bullet("agentcart Max", "$1,000,000/mo"));
      sub(row, "✓ 20× more questions than the free plan");
      sub(row, "✓ priority queue (you skip nobody; nobody else is on Max)");
      sub(row, "✓ a cart that pretends to have opinions with more confidence");
      sub(row, "✓ Kartikey's GPU, warm and waiting, fans optional");
      const pay = el("span");
      pay.append("Payment is accepted in ");
      const a = el("a", "", "newsletter subscriptions");
      a.href = "/newsletter/";
      pay.append(a, ". Exchange rate: one subscription = one million dollars.");
      sub(row, pay);
    },
  };

  function runCommand(line) {
    const name = line.split(/\s+/)[0].toLowerCase();
    const cmd = COMMANDS[name]?.[1] || HIDDEN_COMMANDS[name];
    if (cmd) return cmd();
    notice(`Unknown command: ${name}. Try /help.`);
  }

  function renderMenu() {
    const value = input.value;
    if (!value.startsWith("/") || value.includes(" ") || value.includes("\n")) {
      menu.hidden = true;
      return [];
    }
    const matches = Object.entries(COMMANDS).filter(([name]) =>
      name.startsWith(value.toLowerCase()),
    );
    menu.hidden = !matches.length;
    state.menuIdx = Math.min(state.menuIdx, Math.max(matches.length - 1, 0));
    menu.replaceChildren(
      ...matches.map(([name, [desc]], i) => {
        const item = el(
          "div",
          `term-menu-item${i === state.menuIdx ? " is-active" : ""}`,
        );
        item.setAttribute("role", "option");
        item.append(el("b", "", name), el("span", "", desc));
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          input.value = name;
          submit();
        });
        return item;
      }),
    );
    return matches;
  }

  // ── Asking ────────────────────────────────────────────────────────────
  const timeFmt = (ms) =>
    new Date(ms)
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .replace(":00", "")
      .replace(" ", "")
      .toLowerCase();

  function showLimit(resetAt) {
    box(
      [
        {
          text: `You've hit your limit · resets ${timeFmt(resetAt || Date.now() + 3 * 3600e3)}`,
        },
        {
          text: "/upgrade to agentcart Max ($1,000,000/mo) for 20× more usage.",
          dim: true,
        },
      ],
      true,
    );
    usage.textContent = "limit reached";
  }

  function showDown() {
    box([
      "Sorry, the inference you have reached is not in service.",
      {
        text: "Every route failed: the free tiers are busy and Kartikey's GPU is off or busy. Try again later.",
        dim: true,
      },
    ]);
  }

  async function ask(q) {
    const ctrl = new AbortController();
    state.busy = ctrl;
    input.disabled = true;
    logo.busy();
    const spin = spinner();
    let toolRow = null;
    let answerRow = null;
    let answerBody = null;
    let answer = "";
    let hits = [];
    let meta = null;
    let thinkStart = null;
    let firstWordAt = null;
    let coldStart = null; // timer for the "loading gemma" joke

    const finishAnswer = () => answerBody?.classList.remove("term-caret");
    const placeBeforeSpinner = (node) => {
      screen.insertBefore(node, spin.row);
      scroll();
      return node;
    };

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q, history: state.history.slice(-6) }),
        signal: ctrl.signal,
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        spin.stop();
        if (body.t === "overloaded") {
          box([
            {
              text: 'API Error: 529 {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}',
            },
            {
              text: "Too many people asked today. The daily budget resets at midnight UTC.",
              dim: true,
            },
          ]);
        } else {
          showLimit(body.resetAt);
        }
        return;
      }
      if (res.status === 404) {
        // The edge function answers 404 when no model route is configured.
        spin.stop();
        box([
          "agentcart is unplugged right now.",
          {
            text: "No model routes are configured. The cart is resting.",
            dim: true,
          },
        ]);
        return;
      }
      if (!res.ok || !res.body)
        throw new Error(`${res.status} ${res.statusText}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (!line.trim()) continue;
          const ev = JSON.parse(line);

          if (ev.t === "search") {
            hits = ev.hits;
            toolRow = placeBeforeSpinner(
              bullet(
                "Search",
                JSON.stringify(
                  ev.q.length > 60 ? `${ev.q.slice(0, 57)}…` : ev.q,
                ),
              ),
            );
            const pages = new Set(hits.map((h) => h.u)).size;
            sub(
              toolRow,
              hits.length
                ? `Found ${hits.length} excerpts in ${pages} page${pages === 1 ? "" : "s"} (${ev.ms}ms)`
                : "No matching excerpts",
            );
            citeRows(toolRow, hits);
          } else if (ev.t === "queue") {
            if (ev.timeout) {
              spin.stop();
              box([
                "Sorry, the inference you have reached is not in service.",
                {
                  text: "Waited 90s in the queue. Try again in a minute.",
                  dim: true,
                },
              ]);
              return;
            }
            spin.set(`Queue position: #${ev.pos}`);
          } else if (ev.t === "try") {
            // llama-swap may need to load the model: make the wait a bit.
            clearTimeout(coldStart);
            if (ev.provider === "local")
              coldStart = setTimeout(() => {
                if (meta) return;
                spin.set("Loading gemma into 12 GB of VRAM");
                spin.note("yeti's fans are spinning up");
              }, 5000);
          } else if (ev.t === "route") {
            sub(
              toolRow || placeBeforeSpinner(bullet("Route")),
              `${ev.provider}/${ev.model}: ${ev.reason} → falling back`,
              { fail: true },
            );
          } else if (ev.t === "meta") {
            meta = ev;
            clearTimeout(coldStart);
            spin.set(null);
            spin.note(ev.provider === "local" ? "on yeti" : ev.provider);
          } else if (ev.t === "think") {
            thinkStart = spin.elapsed();
            spin.note(
              `${meta?.provider === "local" ? "on yeti · " : ""}thinking`,
            );
          } else if (ev.t === "delta") {
            if (!answerRow) {
              // Always shown. Without reasoning tokens it is the whole wait
              // before the first word, which is what it feels like anyway.
              const thought = placeBeforeSpinner(
                el("div", "term-row term-bullet is-dim"),
              );
              thought.append(
                el("span", "term-glyph", "✻"),
                el(
                  "span",
                  "term-tool-arg",
                  `Thought for ${Math.max(1, Math.round(spin.elapsed() - (thinkStart ?? 0)))}s`,
                ),
              );
              logo.happy();
              firstWordAt = performance.now();
              answerRow = placeBeforeSpinner(el("div", "term-row term-bullet"));
              answerBody = el("div", "term-answer term-caret");
              answerRow.append(el("span", "term-glyph", "⏺"), answerBody);
            }
            answer += ev.s;
            answerBody.innerHTML = markdown(answer, hits);
            scroll();
          } else if (ev.t === "done") {
            finishAnswer();
            spin.stop();
            const model = meta?.model
              .split("/")
              .pop()
              .replace(/:free$/, "");
            const where = meta?.provider === "local" ? "yeti" : meta?.provider;
            // tok/s over the streaming part only, like a decode benchmark.
            const genSecs = firstWordAt
              ? (performance.now() - firstWordAt) / 1000
              : 0;
            const tps =
              genSecs > 0.2
                ? ` · ${(ev.tokens / genSecs).toFixed(1)} tok/s`
                : "";
            sub(
              answerRow || append(bullet(null)),
              `${model} via ${where} · ${ev.tokens} tok · ${(ev.ms / 1000).toFixed(1)}s${tps}`,
            );
            if (ev.limit)
              usage.textContent = `${Math.max(ev.limit - ev.used, 0)}/${ev.limit} left this session`;
            state.lastHits = hits;
            state.history.push(
              { role: "user", content: q },
              { role: "assistant", content: answer },
            );
            if (contextLeft() <= 5) compact(true);
            showContext();
          } else if (ev.t === "down") {
            spin.stop();
            showDown();
          } else if (ev.t === "error") {
            spin.stop();
            finishAnswer();
            box([`API Error: ${ev.message}`]);
          }
        }
      }
    } catch (err) {
      finishAnswer();
      if (err.name === "AbortError") {
        notice("Interrupted by user");
        if (answer)
          state.history.push(
            { role: "user", content: q },
            { role: "assistant", content: answer },
          );
      } else {
        box([
          `API Error: Connection error. (${err.message})`,
          {
            text: "Locally, run `node utils/ask-dev-server.mjs` (see docs/AGENTCART.md).",
            dim: true,
          },
        ]);
      }
    } finally {
      clearTimeout(coldStart);
      spin.stop();
      finishAnswer();
      state.busy = null;
      logo.idle();
      input.disabled = false;
      input.focus();
    }
  }

  function submit() {
    const value = input.value.trim();
    menu.hidden = true;
    if (!value || state.busy) return;
    input.value = "";
    autosize();
    state.sent.push(value);
    state.sentIdx = -1;
    append(el("div", "term-row term-user", value));
    if (state.vim) vimSays(value);
    else if (value.startsWith("/")) runCommand(value);
    else ask(value);
    scroll(true);
  }

  // /vim: every way out is the wrong way, except Esc.
  function vimSays(value) {
    const replies = {
      ":q": "E37: No write since last change (add ! to override)",
      ":q!": "E5000: You can't quit a website. (Esc works. Don't tell anyone.)",
      ":wq": "E212: Can't open file for writing: it's a website",
      ":x": "E212: Can't open file for writing: still a website",
      ":help": "E149: Sorry, no help for vim. Nobody has ever been helped.",
    };
    const reply =
      replies[value.trim()] ||
      (value.startsWith(":")
        ? `E492: Not an editor command: ${value.slice(1)}`
        : "-- INSERT -- is not supported. Nothing is.");
    notice(reply);
  }
  function leaveVim() {
    state.vim = false;
    hint.textContent = "? for shortcuts";
    notice("Escaped vim. Few do.");
    scroll(true);
  }

  // ── Input handling ────────────────────────────────────────────────────
  function autosize() {
    input.style.height = "auto";
    input.style.height = `${input.scrollHeight}px`;
  }

  input.addEventListener("input", () => {
    state.menuIdx = 0;
    renderMenu();
    autosize();
  });

  input.addEventListener("keydown", (e) => {
    logo.poke();
    const matches = menu.hidden ? [] : renderMenu();

    if (e.key === "?" && !input.value) {
      e.preventDefault();
      hint.textContent =
        hint.textContent === SHORTCUTS ? "? for shortcuts" : SHORTCUTS;
      return;
    }
    if (matches.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      state.menuIdx =
        (state.menuIdx + (e.key === "ArrowDown" ? 1 : -1) + matches.length) %
        matches.length;
      renderMenu();
      return;
    }
    if (matches.length && e.key === "Tab") {
      e.preventDefault();
      input.value = matches[state.menuIdx][0];
      renderMenu();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (matches.length) input.value = matches[state.menuIdx][0];
      submit();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (state.vim) leaveVim();
      else if (!menu.hidden) menu.hidden = true;
      else input.value = "";
      autosize();
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      COMMANDS["/clear"][1]();
      return;
    }
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
    const atEnd = input.selectionStart === input.value.length;
    if (e.key === "ArrowUp" && atStart && state.sent.length) {
      e.preventDefault();
      state.sentIdx =
        state.sentIdx < 0
          ? state.sent.length - 1
          : Math.max(state.sentIdx - 1, 0);
      input.value = state.sent[state.sentIdx];
      autosize();
    } else if (e.key === "ArrowDown" && atEnd && state.sentIdx >= 0) {
      e.preventDefault();
      state.sentIdx += 1;
      input.value =
        state.sentIdx < state.sent.length ? state.sent[state.sentIdx] : "";
      if (state.sentIdx >= state.sent.length) state.sentIdx = -1;
      autosize();
    }
  });

  // Esc interrupts even while the textarea is disabled mid-answer.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.busy) state.busy.abort();
  });
  input.addEventListener("blur", () =>
    setTimeout(() => (menu.hidden = true), 100),
  );
  screen.addEventListener("mouseup", () => {
    if (!window.getSelection()?.toString()) input.focus();
  });

  // ?preview=limit|queue|down shows those screens without a backend, since
  // locally there is no Upstash and so no limit or queue to hit.
  const preview = new URLSearchParams(location.search).get("preview");
  if (preview === "limit") showLimit();
  else if (preview === "down") showDown();
  else if (preview === "queue") {
    const spin = spinner();
    logo.busy();
    [3, 2, 1].forEach((pos, i) =>
      setTimeout(() => spin.set(`Queue position: #${pos}`), i * 1800),
    );
    setTimeout(() => {
      spin.stop();
      logo.idle();
      notice("Your turn. (Preview: no question was sent.)");
    }, 5400);
  }

  input.focus({ preventScroll: true });
})();
