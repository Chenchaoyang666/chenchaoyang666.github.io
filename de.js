var sum = 1;
var t = 25*49;
for(let a = 364;a>=316;a--){
    sum =sum*(a/365);
    console.log(sum,a);
}
// sum = t*sum/365;
console.log(sum);