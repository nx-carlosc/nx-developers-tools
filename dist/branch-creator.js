import { branchNameCreator } from "./utils/branchNameCreator.js"
import { $ } from "./utils/selectors.js"
import { BRANCH_REGEXP, STORED_BRANCH_VALUES } from "./consts.js"
import { getCurrentTab } from "./utils/getCurrentTab.js"

let avatar = ""
let project = ""
let ticket = ""
let title = ""
let branchInputValue = ""
let charReplacerValue = ""

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
		$("#jiraProject").innerText = project
		$("#jiraTicket").innerText = ticket
		$("#jiraTitle").innerText = title
	}

	if (avatar) {
		const $jiraAvatarImg = $("#jiraAvatar")
		$jiraAvatarImg.classList.remove("hidden")
		$jiraAvatarImg.setAttribute("src", avatar)
	}

	if (project) {
		const { [STORED_BRANCH_VALUES]: projectValues } =
			await chrome.storage.sync.get([STORED_BRANCH_VALUES])

		if (projectValues) {
			branchInputValue =
				projectValues[project]?.branchInputValue || branchInputValue
			charReplacerValue =
				projectValues[project]?.charReplacerValue || charReplacerValue
			$("#branchInput").value = branchInputValue
			$("#charReplacer").value = charReplacerValue
		}
	}

	fillBranchResult()

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

	async function saveProjectInStorage() {
		const { [STORED_BRANCH_VALUES]: projectValues } =
			await chrome.storage.sync.get([STORED_BRANCH_VALUES])

		const newValue = { [project]: { branchInputValue, charReplacerValue } }
		chrome.storage.sync.set({
			[STORED_BRANCH_VALUES]: { ...projectValues, ...newValue },
		})
	}

	function fillBranchResult() {
		branchInputValue
			? $("#branchResult").classList.remove("hidden")
			: $("#branchResult").classList.add("hidden")

		const branchNameResult = branchNameCreator({
			project,
			branchInputValue,
			charReplacerValue,
			ticket,
			title,
		})

		const $branchResultValue = $("#branchResultValue")
		$branchResultValue.innerText = branchNameResult

		$("#branchResult")?.addEventListener("click", () => {
			navigator.clipboard.writeText(branchNameResult)
			$branchResultValue.innerText = "COPIED!"
			setTimeout(() => {
				$branchResultValue.innerText = branchNameResult
			}, 1000)
		})
	}
}
