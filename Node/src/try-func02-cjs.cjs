// CJS 副檔名如果是 .js .json, 副檔名可以省略
// 匯入自訂的 js 檔, 前面要用相對路徑的方式 "./"
const { f2 } = require("./func02-cjs.cjs");
// __dirname 只能在 CJS 裡使用, 不能在 ESM 使用
const { f3 } = require(__dirname + "/func02-cjs.cjs");

console.log(f2(8));
console.log(__dirname);
console.log(f3(3));