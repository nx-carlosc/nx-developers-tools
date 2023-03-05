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
})
