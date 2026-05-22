import { useState, useEffect } from 'react'
import { getCurrentTab } from '../utils/getCurrentTab'
import { STORED_DOMAINS_NAME } from '../consts'

interface Domain {
  name: string
  createdAt: number
}

export default function DomainReplacer() {
  const [inputValue, setInputValue] = useState('')
  const [domains, setDomains] = useState<Domain[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadDomains()
  }, [])

  async function loadDomains(newDomain?: Domain) {
    const result = await chrome.storage.sync.get([STORED_DOMAINS_NAME])
    const stored: Domain[] = (result[STORED_DOMAINS_NAME] as Domain[]) || []

    let updated = stored
    if (newDomain) {
      const exists = stored.some((d) => d.name === newDomain.name)
      updated = exists
        ? [...stored.filter((d) => d.name !== newDomain.name), newDomain]
        : [...stored, newDomain]
      await chrome.storage.sync.set({ [STORED_DOMAINS_NAME]: updated })
    }

    const sorted = [...updated].sort((a, b) => b.createdAt - a.createdAt)
    setDomains(sorted)
    if (sorted.length > 0) setInputValue(sorted[0].name)
  }

  async function handleReplace(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const selected = inputValue.trim().replace(/\/$/, '')
    if (!selected) return

    loadDomains({ name: selected, createdAt: Date.now() })

    const tab = await getCurrentTab()
    if (!tab.url) return

    const { origin } = new URL(tab.url)
    const newUrl = tab.url.replace(origin, selected)
    setMessage('Fetching...')

    fetch(newUrl, { mode: 'no-cors' })
      .then(() => {
        setMessage('')
        chrome.tabs.create({ url: newUrl })
      })
      .catch(() => setMessage('No available domain'))
  }

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault()
    chrome.storage.sync.get([STORED_DOMAINS_NAME], (result) => {
      const stored: Domain[] = (result[STORED_DOMAINS_NAME] as Domain[]) || []
      const updated = stored.filter((d) => d.name !== inputValue)
      chrome.storage.sync.set({ [STORED_DOMAINS_NAME]: updated })
      const sorted = [...updated].sort((a, b) => b.createdAt - a.createdAt)
      setDomains(sorted)
      setInputValue(sorted.length > 0 ? sorted[0].name : '')
    })
  }

  return (
    <section>
      <form onSubmit={handleReplace}>
        <div className="domain-input-button">
          <input
            type="url"
            list="domains"
            value={inputValue}
            autoFocus
            onChange={(e) => setInputValue(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            placeholder="https://mydomain.com"
          />
          <div id="removeDomainButton" onClick={handleRemove}>
            <svg width="18px" height="18px" viewBox="0 0 24 24">
              <path
                d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                fill="crimson"
              />
            </svg>
          </div>
        </div>
        <datalist id="domains">
          {domains.map((d) => (
            <option key={d.name} value={d.name} />
          ))}
        </datalist>
        <button type="submit" className="blue-button">
          Replace Domain
        </button>
      </form>
      <div className="message">{message}</div>
    </section>
  )
}
