import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isCareerWorkspaceGoal } from '../lib/career/routing'

test('opens the career workspace for job and CV goals', () => {
  for (const goal of ['Find AI Product Engineer jobs in Lisbon', 'Update my CV', 'help me prepare for an interview', 'apply to remote roles']) {
    assert.equal(isCareerWorkspaceGoal(goal), true, goal)
  }
})

test('does not hijack fitness, shopping or empty goals', () => {
  for (const goal of ['I want to work out more', 'best running shoes under 100', '', '   ']) {
    assert.equal(isCareerWorkspaceGoal(goal), false, goal)
  }
})
