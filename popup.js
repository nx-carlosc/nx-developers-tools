const domainInput = document.querySelector("[name=domain]")
const replaceButton = document.querySelector("#replaceDomainButton")

domainInput.addEventListener("input", function (e) {
  const value = e.target.value
  setCookie("domain-replacer-value", value)
})

replaceButton.addEventListener("click", function () {
  const cookie = getCookie("domain-replacer-value")
  if (cookie) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      tabs[0] && chrome.tabs.sendMessage(tabs[0].id, { newDomain: cookie })
    })
  }
})

const cookie = getCookie("domain-replacer-value")
cookie && (domainInput.value = cookie)
