chrome.runtime.onMessage.addListener(handleMessage)

function handleMessage({ newDomain, replaceDomain }, sender, sendResponse) {
  if (replaceDomain) {
    window.open(replaceDomain, "_blank")
    return
  } 

  const { href, origin } = new URL(window.location.href)
  const newUrl = href.replace(origin, newDomain.replace(/\/$/, ''))

  sendResponse({ newUrl })

  // fetch(newUrl, {
  //   mode: 'no-cors'
  // })
  //   .then((res) => {
  //     console.log(res);
  //     // window.location.href = newUrl
  //     window.open(newUrl, "_blank")
  //   })
  // .catch(() => {
  //   console.log({ message: "No available domain" })
  //   setTimeout(() => sendResponse({ message: "No available domain" }), 1)
  //   return true;
  // })
}
