const COOKIE_NAME = "domain-replacer-values"

const replaceButton = document.querySelector("#replaceDomainButton")
const removeButton = document.querySelector("#removeDomainButton")
const rawCookie = getCookie(COOKIE_NAME)

if (rawCookie) {
	const domainsCookie = JSON.parse(rawCookie)
	fillWithCookieDomains(domainsCookie)
}

replaceButton.addEventListener("click", handleClickReplaceDomain)
removeButton.addEventListener("click", handleClickRemoveDomain)

function fillWithCookieDomains(domains) {
	domains.sort((a, b) => b.createdAt - a.createdAt)
	const domainInput = document.querySelector("#replaceDomainInput")
	const datalist = document.querySelector("datalist#domains")
	domainInput.value = domains.length ? domains[0].name : ""

	const options = domains
		.map(
			(domain, i) =>
				`<option ${i === 0 ? "selected" : ""} value="${domain.name}">${domain.name
				}</option>`
		)
		.join("\n")

	datalist.innerHTML = options
}

async function handleClickReplaceDomain(event) {
	event.preventDefault()
	const domainInput = document.querySelector("#replaceDomainInput")
	const selectedDomain = domainInput.value.trim().replace(/\/$/, '')

	if (selectedDomain) {
		const newDomain = { name: selectedDomain, createdAt: Date.now() }
		const rawCookie = getCookie(COOKIE_NAME)
		const domainsCookie = rawCookie ? JSON.parse(rawCookie) : []
		const newDomains = domainsCookie.every((el) => el.name !== selectedDomain)
			? [...domainsCookie, newDomain]
			: [...domainsCookie.filter((el) => el.name !== selectedDomain), newDomain]
		setCookie(COOKIE_NAME, JSON.stringify(newDomains))
		fillWithCookieDomains(newDomains)
		const activeTab = await getCurrentTab()
		const tabUrl = activeTab.url

		if (tabUrl) {
			const { origin } = new URL(tabUrl)
			const newUrl = tabUrl.replace(origin, selectedDomain)
			const $message = document.querySelector(".message")
			$message.innerHTML = 'Fetching...'

			fetch(newUrl, {
				mode: 'no-cors'
			})
				.then(async () => {
					$message.innerHTML = ''
					chrome.tabs.sendMessage(activeTab.id, { newUrl })
				})
				.catch(() => {
					$message.innerHTML = "No available domain"
				})
		}
	}
}

function handleClickRemoveDomain(event) {
	event.preventDefault()
	const domainInput = document.querySelector("#replaceDomainInput")
	const selectedDomain = domainInput.value
	const rawCookie = getCookie(COOKIE_NAME)
	if (rawCookie) {
		const domainsCookie = rawCookie ? JSON.parse(rawCookie) : []
		const newDomains = domainsCookie.filter(
			(domain) => domain.name !== selectedDomain
		)
		setCookie(COOKIE_NAME, JSON.stringify(newDomains))
		fillWithCookieDomains(newDomains)
	}
}

async function getCurrentTab() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length) {
				resolve(tabs[0])
			} else {
				reject(new Error("No active tab"))
			}
		})
	})
}
