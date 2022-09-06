chrome.runtime.onMessage.addListener(handleMessage)

function handleMessage({ newUrl }) {
  if (newUrl) {
    window.open(newUrl, "_blank")
  } 
}
