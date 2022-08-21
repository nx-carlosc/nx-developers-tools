chrome.runtime.onMessage.addListener(handleMessage)

async function handleMessage (message) {
  const { newDomain } = message
  const href = new URL(window.location.href)
  const pathname = href.pathname
  const newUrl = `${newDomain.replace(/&\//, '')}${pathname}`

  const res = await fetch(newUrl, {
    mode: "no-cors"
  })
  .then(() => {
    window.location.href = newUrl
  })
  .catch((err) => {
    console.error(err);
    alert("Not available domain")
  })
}
