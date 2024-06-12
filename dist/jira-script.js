const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => document.querySelectorAll(selector)

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	if (message === "send-jira-data") {
		if (location.href.match(/atlassian.+modal/i)) {
			const $breadcrumbs = $$('[aria-label="Breadcrumbs"] ol > * ')

			const avatar =
				$breadcrumbs[1].querySelector("img")?.getAttribute("src") || ""

			const project = $breadcrumbs[1]?.innerText?.trim() || ""

			const ticket =
				$breadcrumbs[$breadcrumbs.length - 1].innerText?.trim() || ""

			const title = $('[role="dialog"] h1')?.innerText?.trim() || ""

			sendResponse({ avatar, project, ticket, title })
			return
		}

		if (location.href.match(/atlassian/i)) {
			const $breadcrumbs = $$('[aria-label*="readcrumb"] ol > * ')

			const avatar =
				$breadcrumbs[1].querySelector("img")?.getAttribute("src") || ""

			const project = $breadcrumbs[1]?.innerText?.trim() || ""

			const ticket =
				$breadcrumbs[$breadcrumbs.length - 1].innerText?.trim() || ""

			const title = $("h1")?.innerText?.trim() || ""

			sendResponse({ avatar, project, ticket, title })
			return
		}

		const avatar =
			$("#project-avatar")?.getAttribute("src") ||
			$(".ghx-project-avatar")?.querySelector("img")?.getAttribute("src") ||
			""
		const project =
			$("#project-name-val")?.innerText?.trim() ||
			$("#ghx-detail-head")?.querySelector(".ghx-project")?.innerText?.trim() ||
			""
		const ticket =
			$("#key-val")?.dataset?.issueKey ||
			$("#key-val")?.innerText?.trim() ||
			$("#issuekey-val")?.innerText?.trim() ||
			""
		const title =
			$("#summary-val")?.innerText?.trim() ||
			$("#summary-val")?.innerText?.trim() ||
			""

		sendResponse({ avatar, project, ticket, title })
	}
})
