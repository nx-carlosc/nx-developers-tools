chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { ticket, title } = JSON.parse(message)
  console.log({ ticket, title })
  sendResponse('ok')
})

