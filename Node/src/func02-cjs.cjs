const f2 = (a) => a * a;
const f3 = (a) => a ** 3;

console.log(f2(6));
console.log(f2(7));

// 只能匯出 "一個" 東西
module.exports = { f2, f3 }; // 包成物件

