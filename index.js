chrome.runtime.onMessage.addListener((message) => {
  const { newDomain } = message
  const href = new URL(window.location.href)
  const pathname = href.pathname
  const newUrl = `${newDomain}${pathname}`
  window.location.href = newUrl
})
