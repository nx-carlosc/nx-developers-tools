const STORED_DOMAINS_NAME = "domain-replacer-values"
const STORED_BRANCH_VALUES = "branch-values"
const removeButton = document.querySelector("#removeDomainButton")
const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)
const BRANCH_REGEXP = /^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/g

let branchInputValue = ""
let charReplacerValue = ""
let avatar = ""
let project = ""
let ticket = ""
let title = ""

$("#replaceDomainButton").addEventListener("click", handleClickReplaceDomain)
removeButton.addEventListener("click", handleClickRemoveDomain)
$("#replaceDomainInput").addEventListener("click", (e) => {
	e.target.select()
})
$("#branchInput").value = branchInputValue
$("#charReplacer").value = charReplacerValue

getStoredDomainsAndFillInput()

getCurrentTab().then((tab) => {
	if (tab.status === "loading") {
		chrome.tabs.onUpdated.addListener((tabId, info) => {
			if (
				info.status === "complete" &&
				tab.url.includes("https://jira.nexum.de")
			) {
				generateBranch({ tabId })
			}
		})
	} else if (tab.url.includes("https://jira.nexum.de")) {
		generateBranch({ tabId: tab.id })
	}
})

async function getStoredDomainsAndFillInput(newDomain) {
	const result = await chrome.storage.sync.get([STORED_DOMAINS_NAME])
	const storedDomains = result[STORED_DOMAINS_NAME] || []
	const newDomains = newDomain
		? storedDomains.every((el) => el.name !== newDomain.name)
			? [...storedDomains, newDomain]
			: [...storedDomains.filter((el) => el.name !== newDomain.name), newDomain]
		: storedDomains

	fillWithStoredDomains(newDomains)
	chrome.storage.sync.set({ [STORED_DOMAINS_NAME]: newDomains })
}

function fillWithStoredDomains(domains) {
	domains.sort((a, b) => b.createdAt - a.createdAt)
	const datalist = document.querySelector("datalist#domains")
	$("#replaceDomainInput").value = domains.length ? domains[0].name : ""

	const options = domains
		.map(
			(domain, i) =>
				`<option ${i === 0 ? "selected" : ""} value="${domain.name}">${
					domain.name
				}</option>`
		)
		.join("\n")

	datalist.innerHTML = options
}

async function handleClickReplaceDomain(event) {
	event.preventDefault()
	const selectedDomain = $("#replaceDomainInput")
		.value.trim()
		.replace(/\/$/, "")

	if (selectedDomain) {
		const newDomain = { name: selectedDomain, createdAt: Date.now() }
		getStoredDomainsAndFillInput(newDomain)
		const activeTab = await getCurrentTab()
		const tabUrl = activeTab.url

		if (tabUrl) {
			const { origin } = new URL(tabUrl)
			const newUrl = tabUrl.replace(origin, selectedDomain)
			const $message = document.querySelector(".message")
			$message.innerHTML = "Fetching..."

			fetch(newUrl, {
				mode: "no-cors",
			})
				.then(() => {
					$message.innerHTML = ""
					chrome.tabs.create({ url: newUrl })
				})
				.catch(() => {
					$message.innerHTML = "No available domain"
				})
		}
	}
}

function handleClickRemoveDomain(event) {
	event.preventDefault()
	const selectedDomain = $("#replaceDomainInput").value
	chrome.storage.sync.get([STORED_DOMAINS_NAME], (result) => {
		const storedDomains = result[STORED_DOMAINS_NAME] || []

		const newDomains = storedDomains.filter(
			(domain) => domain.name !== selectedDomain
		)
		chrome.storage.sync.set({ [STORED_DOMAINS_NAME]: newDomains })
		fillWithStoredDomains(newDomains)
	})
}

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
	if(project || ticket || title ) {
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

		const branchNameResult = branchNameCreator()

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

function branchNameCreator() {
	const result = branchInputValue
		.replace(/\$1/g, project)
		.replace(/\$2/g, ticket)
		.replace(/\$3/g, title)
		.replace(BRANCH_REGEXP, charReplacerValue)
	if(charReplacerValue) return result.replace(new RegExp(`${charReplacerValue}{1,}`, "g"), charReplacerValue)

	return result
}
