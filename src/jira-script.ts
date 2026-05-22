const $ = (selector: string) => document.querySelector(selector)
const $$ = (selector: string) => document.querySelectorAll(selector)

chrome.runtime.onMessage.addListener(function (message, _sender, sendResponse) {
  if (message === 'send-jira-data') {
    if (location.href.match(/atlassian.+modal/i)) {
      const breadcrumbs = $$('[aria-label="Breadcrumbs"] ol > * ')
      const avatar = breadcrumbs[1].querySelector('img')?.getAttribute('src') || ''
      const project = (breadcrumbs[1] as HTMLElement)?.innerText?.trim() || ''
      const ticket = (breadcrumbs[breadcrumbs.length - 1] as HTMLElement).innerText?.trim() || ''
      const title = ($('[role="dialog"] h1') as HTMLElement)?.innerText?.trim() || ''
      sendResponse({ avatar, project, ticket, title })
      return
    }

    if (location.href.match(/atlassian/i)) {
      const breadcrumbs = $$('[aria-label*="readcrumb"] ol > * ')
      const avatar = breadcrumbs[1].querySelector('img')?.getAttribute('src') || ''
      const project = (breadcrumbs[1] as HTMLElement)?.innerText?.trim() || ''
      const ticket = (breadcrumbs[breadcrumbs.length - 1] as HTMLElement).innerText?.trim() || ''
      const title = ($('h1') as HTMLElement)?.innerText?.trim() || ''
      sendResponse({ avatar, project, ticket, title })
      return
    }

    const avatar =
      ($('#project-avatar') as HTMLElement)?.getAttribute('src') ||
      $('.ghx-project-avatar')?.querySelector('img')?.getAttribute('src') ||
      ''
    const project =
      ($('#project-name-val') as HTMLElement)?.innerText?.trim() ||
      ($('#ghx-detail-head')?.querySelector('.ghx-project') as HTMLElement)?.innerText?.trim() ||
      ''
    const ticket =
      ($('#key-val') as HTMLElement & { dataset: DOMStringMap })?.dataset?.issueKey ||
      ($('#key-val') as HTMLElement)?.innerText?.trim() ||
      ($('#issuekey-val') as HTMLElement)?.innerText?.trim() ||
      ''
    const title =
      ($('#summary-val') as HTMLElement)?.innerText?.trim() || ''

    sendResponse({ avatar, project, ticket, title })
  }
})
