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
  const domainInput = document.querySelector("[name=domain]")
  const replaceButton = document.querySelector("#replaceDomainButton")

  domainInput.addEventListener("input", function (e) {
    const value = e.target.value
    setCookie("domain-replacer-value", value)
  })
  
  replaceButton.addEventListener("click", async () => {
    const cookie = getCookie("domain-replacer-value")

    if (cookie) {
      const activeTab = await getCurrentTab()
      chrome.tabs.sendMessage(activeTab.id, { newDomain: cookie })
    }
  })

  const cookie = getCookie("domain-replacer-value")
  cookie && (domainInput.value = cookie)
}

main()
