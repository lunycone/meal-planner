import assert from 'node:assert/strict'
import { createStorageAdapter, syncError } from '../src/store/storage.js'

// Model the conditional update and row count returned by PostgREST.
async function check() {
  const database = { row: null, readError: false }
  const client = { from() {
    let action = 'read', patch
    const matches = []
    const request = {
      select() { return request },
      limit() { return request },
      eq(key, value) { matches.push([key, value]); return request },
      update(data) { action = 'update'; patch = data; return request },
      insert(data) { action = 'insert'; patch = data; return request },
      then(done) {
        if (action === 'read' && database.readError) return done({error: new Error('offline')})
        if (action === 'insert' && database.row) return done({error: {code: '23505'}})
        if (action === 'insert' || (action === 'update' && matches.every(([k,v]) => database.row?.[k] === v))) {
          database.row = { ...database.row, ...patch }
        } else if (action === 'update') return done({data: []})
        done({data: database.row ? [{...database.row}] : []})
      },
    }
    return request
  }}
  const a = createStorageAdapter(client), b = createStorageAdapter(client)
  const value = name => ({ version: 4, state: { name } })
  await a.getItem()
  await a.setItem('', value('first'))
  assert.deepEqual(await b.getItem(), value('first'))
  await a.setItem('', value('newer'))
  await b.setItem('', value('stale'))
  assert.match(syncError.message,/Another device/)
  assert.deepEqual(JSON.parse(database.row.data),value('newer'))
  const c = createStorageAdapter(client)
  database.readError = true
  await c.getItem()
  await c.setItem('',value('defaults'))
  database.readError = false
  await c.getItem()
  assert.deepEqual(JSON.parse(database.row.data),value('newer'))
  assert.match(syncError.message,/first successful read/)
  console.log('Verified stale-device conflict and failed initial hydration.')
}
check().catch(error => { console.error(error); process.exitCode = 1 })
