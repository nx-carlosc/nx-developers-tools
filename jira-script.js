const ticket = document.querySelector('#key-val').dataset.issueKey
const title = document.querySelector('#summary-val').innerText

const data = {
	ticket, title
}

chrome.runtime.sendMessage(JSON.stringify(data))