import { STORED_DOMAINS_NAME } from "./consts.js"
import { getCurrentTab } from "./utils/getCurrentTab.js"
import { $ } from "./utils/selectors.js"

const removeButton = $("#removeDomainButton")

$("#replaceDomainButton").addEventListener("click", handleClickReplaceDomain)
removeButton.addEventListener("click", handleClickRemoveDomain)
$("#replaceDomainInput").addEventListener("click", (e) => {
	e.target.select()
})

getStoredDomainsAndFillInput()

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
	const datalist = $("datalist#domains")
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
			const $message = $(".message")
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
