import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VOICE_LINES } from '../src/auto-show/steps.js'

const ROOT = dirname(fileURLToPath(import.meta.url))
const VOICE_DIR = join(ROOT, '..', 'public', 'auto-show', 'voice')

test('公开演示配音与步骤文案一致且资产完整', async () => {
  const manifest = JSON.parse(await readFile(join(VOICE_DIR, 'manifest.json'), 'utf8'))
  assert.equal(manifest.provider, 'edge-tts')
  assert.equal(manifest.voice, 'zh-CN-YunxiNeural')
  assert.equal(manifest.lines.length, VOICE_LINES.length)
  for (const expected of VOICE_LINES) {
    const line = manifest.lines.find(item => item.key === expected.key)
    assert.equal(line?.text, expected.text)
    assert.equal(line.file, `${expected.key}.mp3`)
    const audio = await readFile(join(VOICE_DIR, line.file))
    assert.ok(audio.length > 10000)
    assert.equal(audio.length, line.bytes)
    assert.equal(createHash('sha256').update(audio).digest('hex'), line.sha256)
  }
})
