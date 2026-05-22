export function getCurrentTab(): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length) {
        resolve(tabs[0])
      } else {
        reject(new Error('No active tab'))
      }
    })
  })
}
