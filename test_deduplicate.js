let a = [1, 2, 2, 3, 3, 4, 5, 5, 6];

let uniq = array => [...new Set(array)];

console.log(uniq(a));
