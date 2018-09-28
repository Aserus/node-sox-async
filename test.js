const test = require('tape')
const SoxClass = require('./')
const fs = require('fs')
const fsAsync = require('mz/fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const testAudio = require('test-audio')()

const sox = new SoxClass();


const tmpDir = path.join(os.tmpdir(), 'sox_js_test')


function catchError(err){	t.ifError(err)	}

function closeEnough(x, y) {
	const ratio = x / y
	const diff = Math.abs(ratio - 1)
	return diff < 0.01 // within 1/100th of the correct value
}

function assertSize(t, value) {
	return async filename => {
		const stat = await fsAsync.stat(filename);
		t.ok(closeEnough(stat.size, value), stat.size + ' bytes is close enough to ' + value + ' bytes')
		t.end()
	}
}

test('create temp dir', t => {
	mkdirp(tmpDir, err => {
		t.ifError(err)
		t.end()
	})
})

test('ogg > wav', t => {
	sox.run({
		inputFile: testAudio.ogg.path,
		outputFile: path.join(tmpDir, 'test_1i.wav')
	})
	.then(assertSize(t, 542884))
	.catch(catchError)
})

test('ogg > wav - options - adjusted volume', { timeout: 3000 }, t => {
	sox.run({
		input: { v: 0.9 },
		inputFile: testAudio.ogg.path,
		output: {
			b: 16,
			c: 1,
			r: 44100,
			C: 5
		},
		outputFile: path.join(tmpDir, 'test_2a.wav')
	})
	.then(assertSize(t, 271464))
	.catch(catchError)
})

test('wav > flac', t => {
	sox.run({
		inputFile: testAudio.wav.path,
		outputFile: path.join(tmpDir, 'test_4.flac')
	})
	.then(assertSize(t, 4711))
	.catch(catchError)
})

test('wav > ogg with effects string', t => {
	sox.run({
		inputFile: testAudio.wav.path,
		outputFile: path.join(tmpDir, 'test_5t.ogg'),
		effects: 'swap'
	})
	.then(assertSize(t, 5792))
	.catch(catchError)
})

test('wav > ogg with effects array of strings', t => {
	sox.run({
		inputFile: testAudio.wav.path,
		outputFile: path.join(tmpDir, 'test_5t.ogg'),
		effects: [ 'phaser', 0.6, 0.66, 3, 0.6, 2, '-t' ]
	})
	.then(assertSize(t, 5979))
	.catch(catchError)
})

test('wav > ogg with effects sub-array', t => {
	sox.run({
		inputFile: testAudio.wav.path,
		outputFile: path.join(tmpDir, 'test_5t.ogg'),
		effects: [
			[ 'phaser', 0.6, 0.66, 3, 0.6, 2, '-t' ],
			'swap'
		]
	})
	.then(assertSize(t, 5995))
	.catch(catchError)
})

test('flac > ogg', t => {
	sox.run({
		inputFile: testAudio.flac.path,
		outputFile: path.join(tmpDir, 'test_7.ogg')
	})
	.then(assertSize(t, 5086))
	.catch(catchError)
})

test('delete temp dir', t => {
	rimraf(tmpDir, err => {
		t.ifError(err)
		t.end()
	})
})
