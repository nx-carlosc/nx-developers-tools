import { STORED_TASKS } from "./consts.js"
import { $ } from "./utils/selectors.js"

let currentTicket = { project: "", ticket: "", title: "" }
let intervalId = null

document.addEventListener("jira-data", (e) => {
	currentTicket = e.detail
	renderTasks()
})

$("#startTimerButton").addEventListener("click", onClickStartButton)
$("#timerNameSubmit").addEventListener("click", submitNameForm)
$("#timerNameInput").addEventListener("keydown", (e) => {
	if (e.key === "Enter") submitNameForm()
	if (e.key === "Escape") hideNameForm()
})

renderTasks()

async function loadTasks() {
	const result = await chrome.storage.local.get([STORED_TASKS])
	return result[STORED_TASKS] || []
}

async function saveTasks(tasks) {
	const cutoff = Temporal.Now.instant().subtract({ hours: 72 })
	const pruned = tasks.filter(
		(t) => Temporal.Instant.compare(Temporal.Instant.from(t.startTime), cutoff) >= 0
	)
	await chrome.storage.local.set({ [STORED_TASKS]: pruned })
}

function filterLast72h(tasks) {
	const cutoff = Temporal.Now.instant().subtract({ hours: 72 })
	return tasks.filter(
		(t) => Temporal.Instant.compare(Temporal.Instant.from(t.startTime), cutoff) >= 0
	)
}

function formatElapsed(startIso, endIso = null) {
	const start = Temporal.Instant.from(startIso)
	const end = endIso ? Temporal.Instant.from(endIso) : Temporal.Now.instant()
	const elapsed = end.since(start, { largestUnit: "hours" })
	return [elapsed.hours, elapsed.minutes, elapsed.seconds]
		.map((n) => String(n).padStart(2, "0"))
		.join(":")
}

function formatTime(isoString) {
	return Temporal.Instant.from(isoString)
		.toZonedDateTimeISO(Temporal.Now.timeZoneId())
		.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function getDefaultName() {
	const { project, ticket, title } = currentTicket
	if (project && ticket) return `${project} - ${ticket}`
	if (ticket) return ticket
	if (title) return title
	const dt = Temporal.Now.plainDateTimeISO()
	return `${dt.toPlainDate()} ${dt.toPlainTime().toString({ smallestUnit: "minute" })}`
}

function onClickStartButton() {
	$("#startTimerButton").classList.add("hidden")
	const form = $("#timerNameForm")
	form.classList.remove("hidden")
	const input = $("#timerNameInput")
	input.value = getDefaultName()
	input.focus()
	input.select()
}

function hideNameForm() {
	$("#timerNameForm").classList.add("hidden")
	$("#startTimerButton").classList.remove("hidden")
}

async function submitNameForm() {
	const name = $("#timerNameInput").value.trim()
	if (!name) return
	hideNameForm()

	const tasks = await loadTasks()
	const now = Temporal.Now.instant().toString()
	const updated = tasks.map((t) => (t.endTime === null ? { ...t, endTime: now } : t))
	const info =
		currentTicket.project || currentTicket.ticket || currentTicket.title
			? { project: currentTicket.project, ticket: currentTicket.ticket, title: currentTicket.title }
			: null
	updated.push({ id: crypto.randomUUID(), name, startTime: now, endTime: null, info })
	await saveTasks(updated)
	renderTasks()
}

async function onClickStop(id) {
	const tasks = await loadTasks()
	const now = Temporal.Now.instant().toString()
	await saveTasks(tasks.map((t) => (t.id === id ? { ...t, endTime: now } : t)))
	renderTasks()
}

async function onClickRemove(id) {
	const tasks = await loadTasks()
	await saveTasks(tasks.filter((t) => t.id !== id))
	renderTasks()
}

async function renderTasks() {
	const allTasks = await loadTasks()
	const tasks = filterLast72h(allTasks).sort(
		(a, b) => Temporal.Instant.compare(Temporal.Instant.from(b.startTime), Temporal.Instant.from(a.startTime))
	)
	const runningTask = tasks.find((t) => t.endTime === null)

	const hasMatchingRunning =
		runningTask &&
		currentTicket.ticket &&
		runningTask.info?.ticket === currentTicket.ticket

	if (!$("#timerNameForm").classList.contains("hidden")) {
		// name form is open — don't touch the start button
	} else if (hasMatchingRunning) {
		$("#startTimerButton").classList.add("hidden")
	} else {
		$("#startTimerButton").classList.remove("hidden")
	}

	const running = tasks.filter((t) => t.endTime === null)
	const completed = tasks.filter((t) => t.endTime !== null)

	const $taskList = $("#taskList")
	$taskList.innerHTML = ""

	if (tasks.length === 0) {
		stopInterval()
		return
	}

	if (running.length > 0) {
		$taskList.appendChild(createGroupLabel("Running"))
		running.forEach((task) => $taskList.appendChild(createTaskEl(task, true)))
		startInterval()
	} else {
		stopInterval()
	}

	if (completed.length > 0) {
		$taskList.appendChild(createGroupLabel("Recent"))
		completed.forEach((task) => $taskList.appendChild(createTaskEl(task, false)))
	}
}

function createGroupLabel(text) {
	const el = document.createElement("div")
	el.className = "task-group-label"
	el.textContent = text
	return el
}

function createTaskEl(task, isRunning) {
	const el = document.createElement("div")
	el.className = `task-item${isRunning ? " task-running" : ""}`

	const infoCol = document.createElement("div")
	infoCol.className = "task-info"

	infoCol.appendChild(createNameRow(task))

	if (task.info) {
		const { project, ticket, title } = task.info
		for (const value of [project, ticket, title].filter(Boolean)) {
			const row = document.createElement("div")
			row.className = "task-row"
			const metaEl = document.createElement("span")
			metaEl.className = "task-meta"
			metaEl.textContent = value
			row.appendChild(metaEl)
			row.appendChild(makeCopyButton(value))
			infoCol.appendChild(row)
		}
	}

	const timing = document.createElement("span")
	timing.className = "task-timing"
	timing.textContent = task.endTime
		? `${formatTime(task.startTime)} → ${formatTime(task.endTime)}`
		: formatTime(task.startTime)
	infoCol.appendChild(timing)

	const actions = document.createElement("div")
	actions.className = "task-actions"

	const elapsed = document.createElement("span")
	elapsed.className = "task-elapsed"
	elapsed.textContent = formatElapsed(task.startTime, task.endTime)
	if (isRunning) elapsed.dataset.start = task.startTime
	actions.appendChild(elapsed)

	const btnRow = document.createElement("div")
	btnRow.className = "task-btn-row"

	if (isRunning) {
		const stopBtn = document.createElement("button")
		stopBtn.title = "Stop"
		stopBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="goldenrod"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 4h-10a3 3 0 0 0 -3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3 -3v-10a3 3 0 0 0 -3 -3z"/></svg>`
		stopBtn.addEventListener("click", () => onClickStop(task.id))
		btnRow.appendChild(stopBtn)
	}

	const removeBtn = document.createElement("button")
	removeBtn.title = "Remove"
	removeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="crimson"/></svg>`
	removeBtn.addEventListener("click", () => onClickRemove(task.id))
	btnRow.appendChild(removeBtn)

	actions.appendChild(btnRow)

	el.appendChild(infoCol)
	el.appendChild(actions)
	return el
}

function createNameRow(task) {
	const row = document.createElement("div")
	row.className = "task-row"

	const nameEl = document.createElement("span")
	nameEl.className = "task-name"
	nameEl.textContent = task.name

	const editBtn = document.createElement("button")
	editBtn.title = "Edit"
	editBtn.className = "task-icon-btn"
	editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a1 1 0 0 1 -1 1h-1a1 1 0 0 0 -1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1 -1v-1a1 1 0 0 1 2 0v1a3 3 0 0 1 -3 3h-9a3 3 0 0 1 -3 -3v-9a3 3 0 0 1 3 -3h1a1 1 0 0 1 1 1"/><path d="M14.596 5.011l4.392 4.392l-6.28 6.303a1 1 0 0 1 -.708 .294h-3a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 .294 -.708zm6.496 -2.103a3.097 3.097 0 0 1 .165 4.203l-.164 .18l-.693 .694l-4.387 -4.387l.695 -.69a3.1 3.1 0 0 1 4.384 0"/></svg>`

	row.appendChild(nameEl)
	row.appendChild(editBtn)
	row.appendChild(makeCopyButton(task.name))

	editBtn.addEventListener("click", () => {
		row.innerHTML = ""

		const input = document.createElement("input")
		input.type = "text"
		input.className = "task-name-input"
		input.value = task.name
		row.appendChild(input)
		input.focus()
		input.select()

		const confirmBtn = document.createElement("button")
		confirmBtn.title = "Save"
		confirmBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="cornflowerblue"/></svg>`
		row.appendChild(confirmBtn)

		async function confirm() {
			const newName = input.value.trim()
			if (!newName) return
			const tasks = await loadTasks()
			await saveTasks(tasks.map((t) => (t.id === task.id ? { ...t, name: newName } : t)))
			renderTasks()
		}

		confirmBtn.addEventListener("click", confirm)
		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") confirm()
			if (e.key === "Escape") renderTasks()
		})
	})

	return row
}

function makeCopyButton(text) {
	const btn = document.createElement("button")
	btn.title = "Copy"
	btn.className = "task-copy-btn"
	btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="white"/></svg>`
	btn.addEventListener("click", () => {
		navigator.clipboard.writeText(text)
		btn.style.opacity = "0.2"
		setTimeout(() => (btn.style.opacity = ""), 500)
	})
	return btn
}

function startInterval() {
	if (intervalId) return
	intervalId = setInterval(() => {
		document.querySelectorAll(".task-elapsed[data-start]").forEach((el) => {
			el.textContent = formatElapsed(el.dataset.start)
		})
	}, 1000)
}

function stopInterval() {
	if (intervalId) {
		clearInterval(intervalId)
		intervalId = null
	}
}
