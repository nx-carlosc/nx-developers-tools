import { branchNameCreator } from "./utils/branchNameCreator.js"
import { $ } from "./utils/selectors.js"
import { BRANCH_REGEXP, STORED_BRANCH_VALUES, STORED_BRANCH_TYPES, DEFAULT_BRANCH_TYPES } from "./consts.js"
import { getCurrentTab } from "./utils/getCurrentTab.js"

let avatar = ""
let project = ""
let ticket = ""
let title = ""
let branchInputValue = ""
let charReplacerValue = ""
let typeValue = ""

$("#branchInput").value = branchInputValue
$("#charReplacer").value = charReplacerValue

getCurrentTab().then((tab) => {
	if (tab.status === "loading") {
		chrome.tabs.onUpdated.addListener((tabId, info) => {
			if (info.status === "complete" && tab.url.match(/(jira)|(atlassian)/i)) {
				generateBranch({ tabId })
			}
		})
	} else if (tab.url.match(/(jira)|(atlassian)/i)) {
		generateBranch({ tabId: tab.id })
	}
})

function generateBranch({ tabId }) {
	chrome.tabs.sendMessage(tabId, "send-jira-data", (response) => {
		if (response) {
			avatar = response.avatar
			project = response.project
			ticket = response.ticket
			title = response.title

			fillBranchCreator()
		}
	})
}

async function fillBranchCreator() {
	if (project || ticket || title) {
		$("#branchGenerator").classList.remove("hidden")
		document.dispatchEvent(new CustomEvent("jira-data", { detail: { project, ticket, title } }))
		$("#jiraProject").innerText = project
		$("#jiraTicket").innerText = ticket
		$("#jiraTitle").innerText = title
	}

	if (avatar) {
		const $jiraAvatarImg = $("#jiraAvatar")
		$jiraAvatarImg.classList.remove("hidden")
		$jiraAvatarImg.setAttribute("src", avatar)
	}

	const stored = await chrome.storage.sync.get([STORED_BRANCH_VALUES, STORED_BRANCH_TYPES])
	const allTypes = stored[STORED_BRANCH_TYPES] || DEFAULT_BRANCH_TYPES

	const $branchType = $("#branchType")
	$branchType.innerHTML = allTypes.map((t) => `<option value="${t}">${t}</option>`).join("")

	function updateRemoveButton() {
		$("#removeBranchTypeButton").disabled = $branchType.options.length <= 1
	}

	updateRemoveButton()

	if (project) {
		const projectValues = stored[STORED_BRANCH_VALUES] || {}
		branchInputValue = projectValues[project]?.branchInputValue || branchInputValue
		charReplacerValue = projectValues[project]?.charReplacerValue || charReplacerValue
		typeValue = projectValues[project]?.typeValue || allTypes[0]
		$("#branchInput").value = branchInputValue
		$("#charReplacer").value = charReplacerValue
		$branchType.value = typeValue
	} else {
		typeValue = allTypes[0]
	}

	fillBranchResult()

	$branchType.addEventListener("change", (e) => {
		typeValue = e.target.value
		project && saveProjectInStorage()
		fillBranchResult()
	})

	$("#branchInput").addEventListener("input", (e) => {
		branchInputValue = e.target.value
		project && saveProjectInStorage()
		fillBranchResult()
	})

	$("#charReplacer").addEventListener("input", (e) => {
		charReplacerValue = e.target.value.replace(BRANCH_REGEXP, "")
		e.target.value = charReplacerValue
		project && saveProjectInStorage()
		fillBranchResult()
	})

	$("#addBranchTypeButton").addEventListener("click", () => {
		$("#addTypeForm").classList.toggle("hidden")
		if (!$("#addTypeForm").classList.contains("hidden")) {
			$("#newTypeInput").focus()
		}
	})

	async function saveNewType() {
		const newType = $("#newTypeInput").value.trim()
		if (!newType) return

		const { [STORED_BRANCH_TYPES]: storedTypes } = await chrome.storage.sync.get([STORED_BRANCH_TYPES])
		const currentTypes = storedTypes || DEFAULT_BRANCH_TYPES

		if (!currentTypes.includes(newType)) {
			const updatedTypes = [...currentTypes, newType]
			await chrome.storage.sync.set({ [STORED_BRANCH_TYPES]: updatedTypes })
			$branchType.innerHTML += `<option value="${newType}">${newType}</option>`
		}

		$branchType.value = newType
		typeValue = newType
		updateRemoveButton()
		project && saveProjectInStorage()
		fillBranchResult()
		$("#newTypeInput").value = ""
		$("#addTypeForm").classList.add("hidden")
	}

	$("#saveNewTypeButton").addEventListener("click", saveNewType)
	$("#newTypeInput").addEventListener("keydown", (e) => {
		if (e.key === "Enter") saveNewType()
	})

	$("#removeBranchTypeButton").addEventListener("click", async () => {
		const typeToRemove = $branchType.value
		const { [STORED_BRANCH_TYPES]: storedTypes } = await chrome.storage.sync.get([STORED_BRANCH_TYPES])
		const currentTypes = storedTypes || DEFAULT_BRANCH_TYPES
		const updatedTypes = currentTypes.filter((t) => t !== typeToRemove)
		await chrome.storage.sync.set({ [STORED_BRANCH_TYPES]: updatedTypes })

		const removedIndex = $branchType.selectedIndex
		$branchType.remove(removedIndex)
		$branchType.selectedIndex = Math.min(removedIndex, $branchType.options.length - 1)
		typeValue = $branchType.value
		updateRemoveButton()
		project && saveProjectInStorage()
		fillBranchResult()
	})

	async function saveProjectInStorage() {
		const { [STORED_BRANCH_VALUES]: projectValues } =
			await chrome.storage.sync.get([STORED_BRANCH_VALUES])

		const newValue = { [project]: { branchInputValue, charReplacerValue, typeValue } }
		chrome.storage.sync.set({
			[STORED_BRANCH_VALUES]: { ...projectValues, ...newValue },
		})
	}

	$("#copyBranchName").addEventListener("click", () => {
		const $resultValue = $("#branchResultValue")
		navigator.clipboard.writeText($resultValue.innerText)
		$resultValue.style.visibility = "hidden"
		$("#copiedFeedback").classList.remove("hidden")
		setTimeout(() => {
			$resultValue.style.visibility = ""
			$("#copiedFeedback").classList.add("hidden")
		}, 1000)
	})

	function fillBranchResult() {
		branchInputValue
			? $("#branchResult").classList.remove("hidden")
			: $("#branchResult").classList.add("hidden")

		const branchNameResult = branchNameCreator({
			type: typeValue,
			project,
			branchInputValue,
			charReplacerValue,
			ticket,
			title,
		})

		$("#branchResultValue").innerText = branchNameResult
	}
}
