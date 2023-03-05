import { BRANCH_REGEXP } from "../consts.js"

export function branchNameCreator({
	project,
	ticket,
	title,
	branchInputValue,
	charReplacerValue,
}) {
	const result = branchInputValue
		.replace(/\$1/g, project)
		.replace(/\$2/g, ticket)
		.replace(/\$3/g, title)
		.replace(BRANCH_REGEXP, charReplacerValue)
	if (charReplacerValue)
		return result.replace(
			new RegExp(`${charReplacerValue}{1,}`, "g"),
			charReplacerValue
		)

	return result
}
