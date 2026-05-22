import { useState, useEffect } from 'react'
import { getCurrentTab } from './utils/getCurrentTab'
import DomainReplacer from './components/DomainReplacer'
import BranchCreator from './components/BranchCreator'
import TaskTimer from './components/TaskTimer'

export interface JiraData {
  avatar: string
  project: string
  ticket: string
  title: string
}

export default function App() {
  const [jiraData, setJiraData] = useState<JiraData | null>(null)
  const version = chrome.runtime.getManifest().version

  useEffect(() => {
    let listener: ((tabId: number, info: chrome.tabs.OnUpdatedInfo) => void) | null = null

    getCurrentTab().then((tab) => {
      if (tab.status === 'loading') {
        listener = (_tabId, info) => {
          if (info.status === 'complete' && tab.url?.match(/(jira)|(atlassian)/i)) {
            fetchJiraData(tab.id!)
          }
        }
        chrome.tabs.onUpdated.addListener(listener)
      } else if (tab.url?.match(/(jira)|(atlassian)/i)) {
        fetchJiraData(tab.id!)
      }
    })

    return () => {
      if (listener) chrome.tabs.onUpdated.removeListener(listener)
    }
  }, [])

  function fetchJiraData(tabId: number) {
    chrome.tabs.sendMessage(tabId, 'send-jira-data', (response: JiraData) => {
      if (response) setJiraData(response)
    })
  }

  return (
    <>
      <main>
        <h1>nx-tools</h1>
        <DomainReplacer />
        {jiraData && <BranchCreator jiraData={jiraData} />}
        <TaskTimer jiraData={jiraData} />
      </main>
      <div id="manifestVersion">v{version}</div>
    </>
  )
}
