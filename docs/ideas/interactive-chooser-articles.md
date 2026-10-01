# Idea: interactive chooser widgets inside articles

Status: parked, not shipped. Originally prototyped in
`src/posts/local-inference/2026-08-31-qwen3-8-27b-vs-flash-next.md` (section 6),
then replaced by plain tables to keep the post static. The idea is worth revisiting.

## The idea

A decision tree in a post is more useful if the reader can put their own setup
into it. Instead of a static flowchart, the post embeds a small Alpine.js widget:
a few toggles at the top, a live verdict card, and a schematic below where the
gate matching the reader's answers lights up (ring highlight). A collapsed
`<details>` block keeps the raw ASCII tree for terminal readers and copy-paste.

Why it is attractive:
- Turns "which should I run?" into something the reader answers for their own box.
- Alpine is already loaded globally (`base.njk`), so no new dependency.
- Works inside Markdown posts as a raw `<div x-data=...>` block with `not-prose`.

Why it was parked:
- Content duplicated in three places (widget logic, schematic cards, ASCII), so
  every update to the post's conclusion had to be made three times. It drifted:
  after the Strata update the widget still said "latency floor, pick dense".
- Heavy markup for a 3-gate decision; tables read fine and are copyable.
- A static drawn diagram (see the `sketches` skill, Part B) may carry the same
  idea with less upkeep, if the model can get the flow logic right.

If revived: drive both the verdict and the highlighted gate from ONE data object
in `x-data` (gates, branches, verdict text), render the schematic with `x-for`,
and generate the ASCII fallback from the same data, so there is a single source
of truth.

## The prototype logic (Alpine)

Three inputs, a computed verdict. Gate 1 is MoE working set fit
(<= 0.85 x (RAM + VRAM), SSD-tier parts excluded), gate 2 is discrete GPU, gate 3
is workload headroom.

```html
<div class="not-prose ..." x-data="{
  ramOk: 'yes',          // 'yes' = >= 15% headroom, 'no' = spills to disk
  hasGpu: 'yes',         // 'yes' = >= 12GB VRAM, 'no' = CPU / unified only
  constraints: 'no',     // 'yes' = long context or shared machine
  get verdict() {
    if (this.ramOk === 'no')
      return { model: 'DENSE (Full VRAM)', color: 'amber', note: '...' };
    if (this.hasGpu === 'no')
      return { model: 'MoE (Flash-Next)', color: 'teal', note: '...' };
    if (this.constraints === 'yes')
      return { model: 'DENSE (Qwen 27B)', color: 'amber', note: '...' };
    return { model: 'MoE (Flash-Next)', color: 'teal', note: '...' };
  }
}">
  <!-- 1. segmented toggle per question; Q2 x-show="ramOk === 'yes'",
          Q3 x-show="ramOk === 'yes' && hasGpu === 'yes'"; a muted italic
          placeholder takes the slot when a gate is skipped -->
  <button type="button" @click="ramOk = 'no'"
          :class="ramOk === 'no' ? 'bg-white font-semibold shadow-xs' : 'text-stone-600'">Spills to Disk</button>

  <!-- 2. live verdict card -->
  <span :class="{ 'bg-teal-500/15 ...': verdict.color === 'teal',
                  'bg-amber-500/15 ...': verdict.color === 'amber' }"
        x-text="verdict.model"></span>
  <p x-text="verdict.note"></p>

  <!-- 3. schematic: one card per gate, each with a YES/NO branch grid;
          the active gate gets a ring via :class, e.g.
          :class="{'ring-2 ring-teal-500/60': ramOk === 'yes'}" -->

  <!-- 4. collapsed raw ASCII tree in <details><pre> -->
</div>
```

Gotchas from the prototype:
- Use `&gt;` / `&lt;` for comparison signs inside attribute strings and text.
- Teal = MoE, amber = dense was the colour coding; keep it consistent with the
  site's accent usage.
- Verdict text must be kept in sync with the post's current benchmarks.
