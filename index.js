const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const hashToArray = require('hash-to-array');




function spawnAsync(exe,args){
	return new Promise((resolve,reject)=>{
		let outText = '';
		const sox = spawn(exe, args)
		sox.stdout.on('data', stdout => outText+=stdout);
		//sox.stderr.on('data', stderr => reject(new Error(stderr)))
		sox.on('error', reject)
		sox.on('close', (code, signal) => code ? reject(new Error(signal)) : resolve(outText))
	});
}




module.exports = class SoxClass extends EventEmitter{
	constructor(opts){
		super();
		if(opts)
			switch(typeof(opts)){
				case 'object':
					if(opts.soxPath) this.setSoxPath(opts.soxPath);
					if(opts.log) this.log = opts.log;
					break;
				case 'string':	this.setSoxPath(opts);	break;
				default: break;
			}

			if(this.log && typeof(this.log)!='function') this.log = console.log;
	}

	setSoxPath(soxPath){	this.soxPath = soxPath;	}
	getSoxPath(){	return this.soxPath || 'sox';	}

	async run(opts){
		if (!opts || typeof opts !== 'object') throw new Error('options must be an object')
		if (!opts.inputFile) throw new Error('options.inputFile is a required parameter')
		if (!opts.outputFile) throw new Error('options.outputFile is a required parameter')

		if(!opts.global)	opts.global = ['--show-progress']


		const args = []
			.concat(hashToArray(opts.global || []))
			.concat(hashToArray(opts.input || []))
			.concat(opts.inputFile)
			.concat(hashToArray(opts.output || []))
			.concat(opts.outputFile)
			.concat(opts.effects || [])
			.reduce((flattened, ele) => flattened.concat(ele), [])

		if(this.log) this.log('-> SoxAsync.run',this.getSoxPath(),args.join(' '))
		this.emit('start')
		try{
			await this._spawn(this.getSoxPath(), args)
			this.emit('end')
		}catch(err){
			this.emit('error',err);
			throw error;
		}

		return opts.outputFile;
	}

	_spawn(exe,args){

		return new Promise((resolve,reject)=>{
			const sox = spawn(exe, args)

			let dataOut = '';

			sox.on('error', reject)
			sox.stderr.on('data', stdout => {
				dataOut+=stdout;
				this.emit('progress',{stdout:stdout.toString()})
			})
			//sox.stderr.on('data', stderr => reject(new Error(stderr)))
			sox.on('close', (code, signal) => code ? reject(new Error(dataOut)) : resolve())


		});

	}


	async version(){
		try{
			let res = await spawnAsync(this.getSoxPath(),['--version']);
			let arr = res.split(':');
			if(arr.length>1)	res = arr[arr.length-1].trim();
			return res.replace('SoX ','');
		}catch(err){
			return false;
		}
	}
}
