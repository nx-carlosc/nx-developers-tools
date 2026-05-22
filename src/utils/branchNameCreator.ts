import { BRANCH_REGEXP } from '../consts'

interface BranchNameCreatorParams {
  type?: string
  project: string
  ticket: string
  title: string
  branchInputValue: string
  charReplacerValue: string
}

export function branchNameCreator({
  type = '',
  project,
  ticket,
  title,
  branchInputValue,
  charReplacerValue,
}: BranchNameCreatorParams): string {
  const result = branchInputValue
    .replace(/\$0/g, type)
    .replace(/\$1/g, project)
    .replace(/\$2/g, ticket)
    .replace(/\$3/g, title)
    .replace(BRANCH_REGEXP, charReplacerValue)
  if (charReplacerValue)
    return result.replace(new RegExp(`${charReplacerValue}{1,}`, 'g'), charReplacerValue)
  return result
}
