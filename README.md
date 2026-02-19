# agent-native

Every AI component library treats agent output like it's a chat message. Put the text in a bubble, maybe add a typing indicator, ship it. But agents don't chat. They plan. They execute five tool calls in parallel. They stream half an answer, hit an approval gate, wait for a human, get rejected, retry with a different approach, and eventually produce a code diff, three files, and a cost breakdown. Try fitting that in a chat bubble.

**agent-native** is a React component library built for what agents actually do.

```
npm install agent-native
```

> This is an early release. The type system and first component (AgentTimeline) are stable and ready to use. More components are coming, one at a time. Each one gets the attention it deserves.

---

## Ten Seconds to a Working Timeline

```tsx
import { AgentTimeline } from 'agent-native';
import 'agent-native/styles';

const steps = [
  { id: '1', label: 'Reading codebase',    status: 'complete', startedAt: 1700000000000, completedAt: 1700000003000 },
  { id: '2', label: 'Analyzing patterns',  status: 'running',  startedAt: 1700000003000 },
  { id: '3', label: 'Generating solution', status: 'pending' },
];

function App() {
  return <AgentTimeline steps={steps} showElapsedTime />;
}
```

Status indicators, smooth state transitions, live elapsed timers, auto-scroll. That's what you get out of the box. No configuration.

---

## Tailwind

If you're using Tailwind, this just works. No hacks, no `!important`, no `tailwind-merge`. All of our component styles sit inside `@layer agent-native`, which means any Tailwind utility class you write automatically takes priority over our defaults. That's how CSS cascade layers work, and it's the entire trick.

There are three ways to use it:

**Use our styles and don't think about it.**

```tsx
import 'agent-native/styles';
<AgentTimeline steps={steps} />
```

**Use our styles as a starting point and override what you want.**

```tsx
import 'agent-native/styles';

<AgentTimeline
  steps={steps}
  classNames={{
    root: "bg-gray-950 rounded-xl",
    step: "p-4 hover:bg-gray-800",
    connector: "bg-gray-700",
    approval: "border-purple-500/50 bg-purple-950/30",
    approveButton: "bg-emerald-600 hover:bg-emerald-500 rounded-lg",
    rejectButton: "bg-red-600 hover:bg-red-500 rounded-lg",
  }}
/>
```

**Throw out our styles entirely and do it all yourself.**

Don't import `agent-native/styles`. Every element emits data attributes (`data-status`, `data-step-id`) so you can target them directly:

```tsx
<AgentTimeline
  steps={steps}
  classNames={{
    root: "flex flex-col font-sans text-sm",
    step: "flex items-start gap-3 p-3 data-[status=running]:bg-blue-950 data-[status=error]:bg-red-950",
    indicator: "w-5 h-5 rounded-full border-2",
  }}
/>
```

Dark mode responds to both `.dark` (Tailwind's convention) and `.an-dark` (ours). If your app already has `<html class="dark">`, you don't need to do anything.

---

## AgentTimeline

This is the first component. A vertical timeline that shows what an agent is doing, has done, and is about to do. It handles parallel execution tiers, approval gates that block until a human says yes, live elapsed time on running steps, and auto-scrolling that's smart enough to pause when the user scrolls up to read something.

```tsx
import { AgentTimeline } from 'agent-native';
import type { AgentStep, StepTier, ApprovalRequest } from 'agent-native';
```

### Props

| Prop | Type | Default | |
|------|------|---------|---|
| `steps` | `AgentStep[]` | *required* | The steps to render |
| `tiers` | `StepTier[]` | — | Groups of steps running in parallel |
| `activeStepId` | `string` | — | Highlights one step |
| `failedStepIds` | `string[]` | — | Override these steps to error state |
| `approvalRequest` | `ApprovalRequest` | — | Renders an inline approval gate |
| `onApprove` | `(req) => void` | — | Fires when the user clicks Approve |
| `onReject` | `(req) => void` | — | Fires when the user clicks Reject |
| `onStepClick` | `(step) => void` | — | Makes steps clickable (adds keyboard support too) |
| `showElapsedTime` | `boolean` | — | Shows live timers on running and completed steps |
| `showConnectors` | `boolean` | `true` | The lines between steps |
| `autoScroll` | `boolean` | `true` | Keeps the latest step in view |
| `classNames` | `TimelineClassNames` | — | Class overrides for every internal element |
| `className` | `string` | — | Shorthand for `classNames.root` |
| `stepClassName` | `string` | — | Shorthand for `classNames.step` |
| `renderStepContent` | `(step) => ReactNode` | — | Replace the default step body |
| `renderStepIndicator` | `(step) => ReactNode` | — | Replace the default status indicator |
| `renderTierHeader` | `(tier) => ReactNode` | — | Replace the default tier header |

### classNames

The `classNames` prop lets you target every piece of the component. This is what makes Tailwind integration seamless instead of painful:

| Key | What it targets |
|-----|-----------------|
| `root` | The outer timeline container |
| `step` | Each step row |
| `indicator` | The status circle (spinner, checkmark, etc.) |
| `stepBody` | The label, description, and elapsed time area |
| `connector` | The vertical line between steps |
| `tier` | A parallel group's container |
| `tierHeader` | The header above a parallel group |
| `approval` | The approval gate box |
| `approveButton` | The green button |
| `rejectButton` | The red button |

### Parallel Tiers

Agents don't always do things one at a time. When your agent runs lint, typecheck, and tests simultaneously, you can show that:

```tsx
const steps = [
  { id: 'a', label: 'Setup',        status: 'complete' },
  { id: 'b', label: 'Lint check',   status: 'running' },
  { id: 'c', label: 'Type check',   status: 'running' },
  { id: 'd', label: 'Unit tests',   status: 'running' },
  { id: 'e', label: 'Deploy',       status: 'pending' },
];

const tiers = [
  { id: 'checks', label: 'Parallel checks', stepIds: ['b', 'c', 'd'] },
];

<AgentTimeline steps={steps} tiers={tiers} />
```

Steps `b`, `c`, and `d` get grouped into a visual container. Steps `a` and `e` render normally before and after it.

### Approval Gates

Sometimes an agent needs permission before it acts. A file write, a deployment, a database migration. The approval gate renders inline in the timeline and blocks until the human decides:

```tsx
const [approval, setApproval] = useState<ApprovalRequest>({
  id: 'gate-1',
  stepId: 'write-file',
  title: 'Write to config.json',
  description: 'The agent wants to modify your configuration file.',
  createdAt: Date.now(),
});

<AgentTimeline
  steps={steps}
  approvalRequest={approval}
  onApprove={(req) => { allowTool(req); setApproval(undefined); }}
  onReject={(req) => { denyTool(req); setApproval(undefined); }}
/>
```

### Compound Subcomponents

If you need more control over the layout, every piece of the timeline is available as a standalone component:

```tsx
<AgentTimeline.Step step={step} showElapsedTime />
<AgentTimeline.Connector fillPercent={100} />
<AgentTimeline.Tier tier={tier} steps={steps} />
<AgentTimeline.ApprovalGate request={request} onApprove={handleApprove} />
<AgentTimeline.Summary steps={steps} />
```

---

## Hooks

These are the primitives that power the components. You can use them independently in your own components. Available from the main entry or from `agent-native/hooks`.

### useVisualMemory

This is the hook that gives agent-native components their "memory." When a value changes (say, a step going from `running` to `complete`), this hook doesn't just snap to the new value. It remembers the old one and gives you an animated transition between them. That's how you get a spinner smoothly morphing into a checkmark instead of a jarring swap.

```tsx
import { useVisualMemory } from 'agent-native';

function StatusBadge({ status }: { status: string }) {
  const { current, previous, progress, isTransitioning } = useVisualMemory(status);

  return (
    <span style={{ opacity: isTransitioning ? 0.5 + progress * 0.5 : 1 }}>
      {current}
    </span>
  );
}
```

| Option | Type | Default | |
|--------|------|---------|---|
| `duration` | `number` | `300` | Transition time in ms |
| `easing` | `'ease-out' \| 'ease-in' \| 'ease-in-out' \| 'linear' \| 'spring'` | `'ease-out'` | How the transition curves |
| `animate` | `boolean` | `true` | Kill the animation entirely (also killed automatically when the user prefers reduced motion) |

Returns `{ current, previous, progress, isTransitioning }`.

### useAutoScroll

Keeps a scrollable container pinned to the bottom as new content arrives. Smart enough to back off when the user scrolls up to read something, and re-engages when they scroll back down.

```tsx
import { useAutoScroll } from 'agent-native';

function LogView({ lines }: { lines: string[] }) {
  const ref = useAutoScroll<HTMLDivElement>(lines.length);

  return (
    <div ref={ref} style={{ overflow: 'auto', maxHeight: 400 }}>
      {lines.map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
}
```

Pass any value as `trigger` that changes when new content appears. When it changes, scroll fires. When the user is scrolled up, it doesn't.

| Option | Type | Default | |
|--------|------|---------|---|
| `enabled` | `boolean` | `true` | On/off switch |
| `behavior` | `ScrollBehavior` | `'smooth'` | Scroll animation style |
| `threshold` | `number` | `50` | How close to the bottom (in px) counts as "at the bottom" |

### useElapsedTime

Returns a live-updating string like `"3s"`, `"1m 24s"`, or `"2h 5m 12s"`. Give it a start time and it ticks. Give it an end time and it freezes.

```tsx
import { useElapsedTime } from 'agent-native';

function Timer({ start, end }: { start: number; end?: number }) {
  const elapsed = useElapsedTime(start, end);
  return <span>{elapsed}</span>;
}
```

### useReducedMotion

Returns `true` when the user's system has `prefers-reduced-motion` enabled. Reactive, so if they toggle it at runtime, your component updates.

---

## Types

Every type the library uses is exported. Use them to type your own agent data, even if you're not using our components yet.

```tsx
import type { AgentStep, StepStatus, ToolCall, Artifact } from 'agent-native';
// or
import type { AgentStep } from 'agent-native/types';
```

### Core

| Type | What it represents |
|------|--------------------|
| `StepStatus` | The eight lifecycle states: `pending`, `running`, `streaming`, `waiting_approval`, `complete`, `error`, `skipped`, `cancelled` |
| `AgentStep` | One thing an agent does. Has an id, label, status, timestamps, tool calls, artifacts, token usage, and error info |
| `StepTier` | A group of steps running in parallel |
| `ToolCall` | A single tool invocation: name, input, output, status, timing |
| `Artifact` | Something the agent produced: code, a file, a diff, an image, text, JSON, or markdown |
| `ApprovalRequest` | A gate. The agent is blocked until a human approves or rejects |
| `SubAgent` | A child agent spawned by the parent, with its own steps and lifecycle |

### Messages & Feedback

| Type | What it represents |
|------|--------------------|
| `Message` | A chat message with role, content, optional tool calls and artifacts |
| `MessageRole` | `user`, `assistant`, `system`, or `tool` |
| `FeedbackPayload` | User feedback: thumbs up, thumbs down, comment, or correction |

### Code Review & Diffs

| Type | What it represents |
|------|--------------------|
| `Finding` | A code review finding. Severity, message, file path, line, suggestion |
| `FindingSeverity` | `info`, `warning`, `error`, or `critical` |
| `DiffFile` | A changed file containing hunks |
| `DiffHunk` | A section of contiguous changes |
| `DiffLine` | A single line: added, removed, or context |

### Cost & Tokens

| Type | What it represents |
|------|--------------------|
| `TokenUsage` | Input tokens, output tokens, cache reads, cache writes |
| `CostBreakdown` | What it cost: total, model, token breakdown, currency |
| `Citation` | A reference to a source: URL, file path, line number, snippet |

---

## Customization

### CSS Variables

Every visual decision in the library runs through a CSS custom property with the `--an-` prefix. Want to change a color? Override the variable. Want to match your existing design system? Override a few more.

```css
:root {
  --an-status-running: #8b5cf6;
  --an-status-complete: #10b981;
  --an-radius-md: 12px;
  --an-font-sans: 'Inter', sans-serif;
}
```

The full list is in [variables.css](src/styles/variables.css).

### Render Slots

If CSS overrides aren't enough, you can replace entire sections of a component while keeping all the behavior intact. The component still handles status transitions, elapsed time, auto-scroll, keyboard events. You just control what it looks like:

```tsx
<AgentTimeline
  steps={steps}
  renderStepIndicator={(step) => (
    <MyCustomIcon status={step.status} />
  )}
  renderStepContent={(step) => (
    <div>
      <strong>{step.label}</strong>
      {step.toolCalls?.map(tc => <ToolCallCard key={tc.id} call={tc} />)}
    </div>
  )}
/>
```

### Data Attributes

Every element emits data attributes you can target from CSS or JavaScript:

| Element | Attribute | Example |
|---------|-----------|---------|
| Step | `data-step-id` | `"step-3"` |
| Step | `data-status` | `"running"` |
| Tier | `data-tier-id` | `"parallel-1"` |
| Approval | `data-approval-id` | `"gate-1"` |

In Tailwind: `data-[status=running]:ring-2 data-[status=running]:ring-blue-500`

In CSS: `[data-status="error"] { background: var(--an-status-error-bg); }`

---

## What's in the Box

| Import | What you get |
|--------|-------------|
| `agent-native` | Everything: components, hooks, types, utilities |
| `agent-native/hooks` | Just the hooks, no component code |
| `agent-native/types` | Just the TypeScript types, no runtime JS |
| `agent-native/styles` | The pre-built CSS |

Dual ESM and CJS. Tree-shakeable. TypeScript declarations included. Zero runtime dependencies beyond React 18+.

---

## Accessibility

Interactive steps get `role="button"`, `tabIndex={0}`, and full keyboard support. Focus rings show up on keyboard navigation and stay out of the way for mouse users. Status indicators are decorative (`aria-hidden`) since the label already communicates the status. Animations respect `prefers-reduced-motion` at both the CSS and JavaScript level. Buttons are real `<button>` elements, not divs pretending.

---

## License

MIT
