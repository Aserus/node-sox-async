const spawn = require('child_process').spawn;
const hashToArray = require('hash-to-array');


function spawnAsync(exe,args){
	return new Promise((resolve,reject)=>{
		const sox = spawn(exe, args)
		sox.on('error', reject)
		sox.stderr.on('data', stderr => reject(new Error(stderr)))
		sox.on('close', (code, signal) => code ? reject(new Error(signal)) : resolve())
	});
}


module.exports = class SoxClass{
	constructor(opts){
		if(opts)
			switch(typeof(opts)){
				case 'object':
					if(opts.soxPath) this.setSoxPath(opts.soxPath);
					break;
				case 'string':	this.setSoxPath(opts);	break;
				default: break;
			}
	}

	setSoxPath(soxPath){	this.soxPath = soxPath;	}
	getSoxPath(){	return this.soxPath || 'sox';	}

	async run(opts){
		if (!opts || typeof opts !== 'object') throw new Error('options must be an object')
		if (!opts.inputFile) throw new Error('options.inputFile is a required parameter')
		if (!opts.outputFile) throw new Error('options.outputFile is a required parameter')

		const args = []
			.concat(hashToArray(opts.global || []))
			.concat(hashToArray(opts.input || []))
			.concat(opts.inputFile)
			.concat(hashToArray(opts.output || []))
			.concat(opts.outputFile)
			.concat(opts.effects || [])
			.reduce((flattened, ele) => flattened.concat(ele), [])


		await spawnAsync(this.getSoxPath(), args)
		return opts.outputFile;
	}
}