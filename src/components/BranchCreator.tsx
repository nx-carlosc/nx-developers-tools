import { useState, useEffect, useRef } from 'react'
import { branchNameCreator } from '../utils/branchNameCreator'
import { BRANCH_REGEXP, STORED_BRANCH_VALUES, STORED_BRANCH_TYPES, DEFAULT_BRANCH_TYPES } from '../consts'
import type { JiraData } from '../App'

interface BranchCreatorProps {
  jiraData: JiraData
}

export default function BranchCreator({ jiraData }: BranchCreatorProps) {
  const { avatar, project, ticket, title } = jiraData

  const [branchTypes, setBranchTypes] = useState<string[]>(DEFAULT_BRANCH_TYPES)
  const [typeValue, setTypeValue] = useState(DEFAULT_BRANCH_TYPES[0])
  const [branchInputValue, setBranchInputValue] = useState('')
  const [charReplacerValue, setCharReplacerValue] = useState('')
  const [showAddTypeForm, setShowAddTypeForm] = useState(false)
  const [newTypeInput, setNewTypeInput] = useState('')
  const [copied, setCopied] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadStoredValues()
  }, [])

  const branchResult = branchNameCreator({ type: typeValue, project, ticket, title, branchInputValue, charReplacerValue })

  useEffect(() => {
    if (resultRef.current) resultRef.current.innerText = branchResult
  }, [branchResult])

  async function loadStoredValues() {
    const stored = await chrome.storage.sync.get([STORED_BRANCH_VALUES, STORED_BRANCH_TYPES])
    const allTypes: string[] = (stored[STORED_BRANCH_TYPES] as string[]) || DEFAULT_BRANCH_TYPES
    setBranchTypes(allTypes)

    if (project) {
      const projectValues = (stored[STORED_BRANCH_VALUES] as Record<string, Record<string, string>>) || {}
      const data = projectValues[project] || {}
      setBranchInputValue(data.branchInputValue || '')
      setCharReplacerValue(data.charReplacerValue || '')
      setTypeValue(data.typeValue || allTypes[0])
    } else {
      setTypeValue(allTypes[0])
    }
  }

  async function saveProjectInStorage(updates: Partial<{ branchInputValue: string; charReplacerValue: string; typeValue: string }>) {
    if (!project) return
    const { [STORED_BRANCH_VALUES]: rawProjectValues } = await chrome.storage.sync.get([STORED_BRANCH_VALUES])
    const projectValues = (rawProjectValues as Record<string, Record<string, string>>) || {}
    const current = projectValues[project] || {}
    await chrome.storage.sync.set({
      [STORED_BRANCH_VALUES]: { ...(projectValues || {}), [project]: { ...current, ...updates } },
    })
  }

  async function handleAddType() {
    const newType = newTypeInput.trim()
    if (!newType) return
    const { [STORED_BRANCH_TYPES]: storedTypes } = await chrome.storage.sync.get([STORED_BRANCH_TYPES])
    const currentTypes: string[] = (storedTypes as string[]) || DEFAULT_BRANCH_TYPES
    const updatedTypes = currentTypes.includes(newType) ? currentTypes : [...currentTypes, newType]
    await chrome.storage.sync.set({ [STORED_BRANCH_TYPES]: updatedTypes })
    setBranchTypes(updatedTypes)
    setTypeValue(newType)
    setNewTypeInput('')
    setShowAddTypeForm(false)
    saveProjectInStorage({ typeValue: newType })
  }

  async function handleRemoveType() {
    const { [STORED_BRANCH_TYPES]: storedTypes } = await chrome.storage.sync.get([STORED_BRANCH_TYPES])
    const currentTypes: string[] = (storedTypes as string[]) || DEFAULT_BRANCH_TYPES
    const updatedTypes = currentTypes.filter((t) => t !== typeValue)
    await chrome.storage.sync.set({ [STORED_BRANCH_TYPES]: updatedTypes })
    setBranchTypes(updatedTypes)
    const newType = updatedTypes[0]
    setTypeValue(newType)
    saveProjectInStorage({ typeValue: newType })
  }

  function handleCopy() {
    const text = resultRef.current?.innerText || branchResult
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <section>
      <div className="jira-data">
        <picture>
          {avatar && <img src={avatar} id="jiraAvatar" alt="" />}
        </picture>
        <div className="jira-data-items">
          <div className="jira-data-item jira-data-type">
            $0(type):
            <select
              value={typeValue}
              onChange={(e) => {
                setTypeValue(e.target.value)
                saveProjectInStorage({ typeValue: e.target.value })
              }}
            >
              {branchTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowAddTypeForm((v) => !v)} title="Add type">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="cornflowerblue" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleRemoveType}
              disabled={branchTypes.length <= 1}
              title="Remove type"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M19 13H5v-2h14v2z" fill="crimson" />
              </svg>
            </button>
          </div>
          <div className="jira-data-item">$1(project): <span id="jiraProject">{project}</span></div>
          <div className="jira-data-item">$2(ticket): <span id="jiraTicket">{ticket}</span></div>
          <div className="jira-data-item">$3(title): <span id="jiraTitle">{title}</span></div>
        </div>
      </div>

      {showAddTypeForm && (
        <div id="addTypeForm">
          <input
            type="text"
            id="newTypeInput"
            placeholder="new type"
            maxLength={20}
            autoFocus
            value={newTypeInput}
            onChange={(e) => setNewTypeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddType() }}
          />
          <button type="button" onClick={handleAddType} className="blue-button">Add</button>
        </div>
      )}

      <div className="branch" id="branchName">
        <div className="branch-field">
          <label className="branch-label" htmlFor="branchInput">branch</label>
          <input
            type="text"
            id="branchInput"
            maxLength={124}
            placeholder="$0$2-$3"
            value={branchInputValue}
            onChange={(e) => {
              setBranchInputValue(e.target.value)
              saveProjectInStorage({ branchInputValue: e.target.value })
            }}
          />
        </div>
        <div className="branch-field">
          <label className="branch-label" htmlFor="charReplacer">divider</label>
          <input
            type="text"
            id="charReplacer"
            maxLength={1}
            placeholder="-"
            value={charReplacerValue}
            onChange={(e) => {
              const clean = e.target.value.replace(BRANCH_REGEXP, '')
              setCharReplacerValue(clean)
              saveProjectInStorage({ charReplacerValue: clean })
            }}
          />
        </div>
      </div>

      {branchInputValue && (
        <div id="branchResult">
          <div className="result-text-wrapper">
            <div
              ref={resultRef}
              id="branchResultValue"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
            />
            <div id="copiedFeedback" className={copied ? '' : 'hidden'}>Copied to clipboard!</div>
          </div>
          <button type="button" id="copyBranchName" className="flex" onClick={handleCopy}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      )}
    </section>
  )
}
