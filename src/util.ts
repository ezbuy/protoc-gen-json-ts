export function withAllStdIn() {
	return new Promise<Buffer>((resolve, reject)=>{
		const ret: Buffer[] = [];
		let len = 0;

		const stdin = process.stdin;
		stdin.on("readable", function() {
			let chunk;

			while ((chunk = stdin.read())) {
			if (!(chunk instanceof Buffer)) throw new Error("Did not receive buffer");
				ret.push(chunk);
				len += chunk.length;
			}
		});

		stdin.on("end", function() {
			resolve(Buffer.concat(ret, len));
		});

		stdin.on("error", function(err){
			reject(err);
		});
	});
}

export const strRepeat = (str: string, times: number) => {
	const arr = new Array(times);
	for (let i = 0; i < times; i++) {
		arr[i] = str;
	}
	return arr.join("");
};

export const getRoot = (str: string) => {
	const depth = str.split("/").length;
	return depth === 1 ? "./" : strRepeat("../", depth - 1);
}