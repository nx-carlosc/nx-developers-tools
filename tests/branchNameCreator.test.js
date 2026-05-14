import { branchNameCreator } from "../dist/utils/branchNameCreator.js"
import { describe, it } from "node:test"
import { equal } from "node:assert"

const mockData = {
	project: "Adecco CDX",
	ticket: "ADECCOCDX-928",
	title: '"Buzzwords" Feature (all brands, all landingpages)',
	branchInputValue: "$2-$3",
	charReplacerValue: "-",
}

describe("branchNameCreator", () => {
	it("return correct name", () => {
		const branchName = branchNameCreator({ ...mockData })
		const expected =
			'ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)'
		equal(branchName, expected)
	})

	it("includes type from $0", () => {
		const branchName = branchNameCreator({
			...mockData,
			type: "fix",
			branchInputValue: "$0/$2-$3",
		})
		const expected =
			'fix/ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)'
		equal(branchName, expected)
	})

	it("defaults $0 to empty string when type is omitted", () => {
		const branchName = branchNameCreator({
			...mockData,
			branchInputValue: "$0$2-$3",
		})
		const expected =
			'ADECCOCDX-928-"Buzzwords"-Feature-(all-brands,-all-landingpages)'
		equal(branchName, expected)
	})
})
