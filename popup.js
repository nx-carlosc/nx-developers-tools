main()

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

async function main() {
  const COOKIE_NAME = "domain-replacer-values"
  const domainInput = document.querySelector("#replaceDomainInput")
  const replaceButton = document.querySelector("#replaceDomainButton")
  let domainsCookie = []
  const rawCookie = getCookie(COOKIE_NAME)

  if (rawCookie) {
    domainsCookie = JSON.parse(rawCookie)
  }

  domainsCookie.length > 0 &&
    (domainInput.value = domainsCookie[domainsCookie.length - 1].name)

  replaceButton.addEventListener("click", async () => {
    const domain = domainInput.value

    if (domain.trim()) {
      if (domainsCookie.every((el) => el.name !== domain)) {
        const newDomains = [
          ...domainsCookie,
          { name: domain, createdAt: Date.now() },
        ]
        domainsCookie = newDomains
        setCookie(COOKIE_NAME, JSON.stringify(newDomains))
      }

      const activeTab = await getCurrentTab()
      chrome.tabs.sendMessage(activeTab.id, { newDomain: domain })
    }
  })
}
