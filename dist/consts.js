export const BRANCH_REGEXP =
	/^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/g

export const STORED_DOMAINS_NAME = "domain-replacer-values"

export const STORED_BRANCH_VALUES = "branch-values"

export const STORED_BRANCH_TYPES = "branch-types"

export const DEFAULT_BRANCH_TYPES = ["feat", "fix", "hotfix", "release", "chore", "docs", "refactor"]
