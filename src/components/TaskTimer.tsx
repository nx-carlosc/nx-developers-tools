import { useState, useEffect, useRef } from 'react'
import { STORED_TASKS } from '../consts'
import type { JiraData } from '../App'

interface TaskInfo {
  project: string
  ticket: string
  title: string
}

interface Task {
  id: string
  name: string
  startTime: string
  endTime: string | null
  info: TaskInfo | null
}

function formatElapsed(startIso: string, endIso?: string | null): string {
  const start = Temporal.Instant.from(startIso)
  const end = endIso ? Temporal.Instant.from(endIso) : Temporal.Now.instant()
  const elapsed = end.since(start, { largestUnit: 'hours' })
  return [elapsed.hours, elapsed.minutes, elapsed.seconds]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

function formatTime(isoString: string): string {
  return Temporal.Instant.from(isoString)
    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadTasks(): Promise<Task[]> {
  const result = await chrome.storage.local.get([STORED_TASKS])
  return (result[STORED_TASKS] as Task[]) || []
}

async function saveTasks(tasks: Task[]): Promise<void> {
  const cutoff = Temporal.Now.instant().subtract({ hours: 72 })
  const pruned = tasks.filter(
    (t) => Temporal.Instant.compare(Temporal.Instant.from(t.startTime), cutoff) >= 0
  )
  await chrome.storage.local.set({ [STORED_TASKS]: pruned })
}

function filterLast72h(tasks: Task[]): Task[] {
  const cutoff = Temporal.Now.instant().subtract({ hours: 72 })
  return tasks.filter(
    (t) => Temporal.Instant.compare(Temporal.Instant.from(t.startTime), cutoff) >= 0
  )
}

function CopyButton({ text }: { text: string }) {
  const [dimmed, setDimmed] = useState(false)
  return (
    <button
      title="Copy"
      className="task-copy-btn"
      style={dimmed ? { opacity: 0.2 } : undefined}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setDimmed(true)
        setTimeout(() => setDimmed(false), 500)
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path
          d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
          fill="white"
        />
      </svg>
    </button>
  )
}

interface TaskItemProps {
  task: Task
  isRunning: boolean
  editingId: string | null
  editingName: string
  onStop: (id: string) => void
  onRemove: (id: string) => void
  onEditStart: (id: string, name: string) => void
  onEditChange: (name: string) => void
  onEditConfirm: (id: string) => void
  onEditCancel: () => void
}

function TaskItem({
  task,
  isRunning,
  editingId,
  editingName,
  onStop,
  onRemove,
  onEditStart,
  onEditChange,
  onEditConfirm,
  onEditCancel,
}: TaskItemProps) {
  const isEditing = editingId === task.id
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }
  }, [isEditing])

  return (
    <div className={`task-item${isRunning ? ' task-running' : ''}`}>
      <div className="task-info">
        <div className="task-row">
          {isEditing ? (
            <>
              <input
                ref={editInputRef}
                type="text"
                className="task-name-input"
                value={editingName}
                onChange={(e) => onEditChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onEditConfirm(task.id)
                  if (e.key === 'Escape') onEditCancel()
                }}
              />
              <button title="Save" onClick={() => onEditConfirm(task.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="cornflowerblue" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <span className="task-name">{task.name}</span>
              <button
                title="Edit"
                className="task-icon-btn"
                onClick={() => onEditStart(task.id, task.name)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M8 7a1 1 0 0 1 -1 1h-1a1 1 0 0 0 -1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1 -1v-1a1 1 0 0 1 2 0v1a3 3 0 0 1 -3 3h-9a3 3 0 0 1 -3 -3v-9a3 3 0 0 1 3 -3h1a1 1 0 0 1 1 1" />
                  <path d="M14.596 5.011l4.392 4.392l-6.28 6.303a1 1 0 0 1 -.708 .294h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 .294 -.708zm6.496 -2.103a3.097 3.097 0 0 1 .165 4.203l-.164 .18l-.693 .694l-4.387 -4.387l.695 -.69a3.1 3.1 0 0 1 4.384 0" />
                </svg>
              </button>
              <CopyButton text={task.name} />
            </>
          )}
        </div>

        {task.info &&
          ([task.info.project, task.info.ticket, task.info.title] as string[])
            .filter(Boolean)
            .map((value) => (
              <div key={value} className="task-row">
                <span className="task-meta">{value}</span>
                <CopyButton text={value} />
              </div>
            ))}

        <span className="task-timing">
          {task.endTime
            ? `${formatTime(task.startTime)} → ${formatTime(task.endTime)}`
            : formatTime(task.startTime)}
        </span>
      </div>

      <div className="task-actions">
        <span className="task-elapsed">{formatElapsed(task.startTime, task.endTime)}</span>
        <div className="task-btn-row">
          {isRunning && (
            <button title="Stop" onClick={() => onStop(task.id)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="goldenrod"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M17 4h-10a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3 -3v-10a3 3 0 0 0 -3 -3z" />
              </svg>
            </button>
          )}
          <button title="Remove" onClick={() => onRemove(task.id)}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                fill="crimson"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaskTimer({ jiraData }: { jiraData: JiraData | null }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showNameForm, setShowNameForm] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  const currentTicket = jiraData ?? { project: '', ticket: '', title: '' }

  async function refresh() {
    const all = await loadTasks()
    const filtered = filterLast72h(all).sort((a, b) =>
      Temporal.Instant.compare(
        Temporal.Instant.from(b.startTime),
        Temporal.Instant.from(a.startTime)
      )
    )
    setTasks(filtered)
  }

  useEffect(() => {
    refresh()
  }, [])

  const hasRunning = tasks.some((t) => t.endTime === null)
  useEffect(() => {
    if (!hasRunning) return
    const id = setInterval(() => setTasks((prev) => [...prev]), 1000)
    return () => clearInterval(id)
  }, [hasRunning])

  function getDefaultName(): string {
    const { project, ticket, title } = currentTicket
    if (project && ticket) return `${project} - ${ticket}`
    if (ticket) return ticket
    if (title) return title
    const dt = Temporal.Now.plainDateTimeISO()
    return `${dt.toPlainDate()} ${dt.toPlainTime().toString({ smallestUnit: 'minute' })}`
  }

  function handleStartClick() {
    setShowNameForm(true)
    setNameInput(getDefaultName())
    setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }, 0)
  }

  function hideNameForm() {
    setShowNameForm(false)
  }

  async function submitNameForm() {
    const name = nameInput.trim()
    if (!name) return
    hideNameForm()

    const allTasks = await loadTasks()
    const now = Temporal.Now.instant().toString()
    const updated = allTasks.map((t) => (t.endTime === null ? { ...t, endTime: now } : t))
    const info =
      currentTicket.project || currentTicket.ticket || currentTicket.title
        ? { project: currentTicket.project, ticket: currentTicket.ticket, title: currentTicket.title }
        : null
    updated.push({ id: crypto.randomUUID(), name, startTime: now, endTime: null, info })
    await saveTasks(updated)
    refresh()
  }

  async function handleStop(id: string) {
    const allTasks = await loadTasks()
    const now = Temporal.Now.instant().toString()
    await saveTasks(allTasks.map((t) => (t.id === id ? { ...t, endTime: now } : t)))
    refresh()
  }

  async function handleRemove(id: string) {
    const allTasks = await loadTasks()
    await saveTasks(allTasks.filter((t) => t.id !== id))
    refresh()
  }

  async function handleEditConfirm(id: string) {
    const newName = editingName.trim()
    if (!newName) return
    const allTasks = await loadTasks()
    await saveTasks(allTasks.map((t) => (t.id === id ? { ...t, name: newName } : t)))
    setEditingId(null)
    refresh()
  }

  const runningTask = tasks.find((t) => t.endTime === null)
  const hasMatchingRunning =
    runningTask && currentTicket.ticket && runningTask.info?.ticket === currentTicket.ticket

  const running = tasks.filter((t) => t.endTime === null)
  const completed = tasks.filter((t) => t.endTime !== null)

  return (
    <section>
      {!showNameForm && !hasMatchingRunning && (
        <button id="startTimerButton" onClick={handleStartClick}>
          <span>Start Timer</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="cornflowerblue">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
          </svg>
        </button>
      )}

      {showNameForm && (
        <div id="timerNameForm">
          <input
            ref={nameInputRef}
            id="timerNameInput"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitNameForm()
              if (e.key === 'Escape') hideNameForm()
            }}
            autoFocus
          />
          <button id="timerNameSubmit" title="Start" onClick={submitNameForm}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="cornflowerblue" />
            </svg>
          </button>
        </div>
      )}

      <div id="taskList">
        {running.length > 0 && (
          <>
            <div className="task-group-label">Running</div>
            {running.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isRunning
                editingId={editingId}
                editingName={editingName}
                onStop={handleStop}
                onRemove={handleRemove}
                onEditStart={(id, name) => {
                  setEditingId(id)
                  setEditingName(name)
                }}
                onEditChange={setEditingName}
                onEditConfirm={handleEditConfirm}
                onEditCancel={() => setEditingId(null)}
              />
            ))}
          </>
        )}

        {completed.length > 0 && (
          <>
            <div className="task-group-label">Recent</div>
            {completed.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isRunning={false}
                editingId={editingId}
                editingName={editingName}
                onStop={handleStop}
                onRemove={handleRemove}
                onEditStart={(id, name) => {
                  setEditingId(id)
                  setEditingName(name)
                }}
                onEditChange={setEditingName}
                onEditConfirm={handleEditConfirm}
                onEditCancel={() => setEditingId(null)}
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}
