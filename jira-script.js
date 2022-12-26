chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message === "send-jira-data") {
		const avatar =
		document.querySelector("#project-avatar")?.getAttribute("src") ||
		document
			.querySelector(".ghx-project-avatar")
			?.querySelector("img")
			?.getAttribute("src") ||
		""
	const project =
		document.querySelector("#project-name-val")?.innerText?.trim() ||
		document
			.querySelector("#ghx-detail-head")
			?.querySelector(".ghx-project")
			?.innerText?.trim() ||
		""
	const ticket =
		document.querySelector("#key-val")?.dataset?.issueKey ||
		document.querySelector("#key-val")?.innerText?.trim() ||
		document.querySelector("#issuekey-val")?.innerText?.trim() ||
		""
	const title =
		document.querySelector("#summary-val")?.innerText?.trim() ||
		document.querySelector("#summary-val")?.innerText?.trim() ||
		""

		sendResponse({ avatar, project, ticket, title })
	}
})
