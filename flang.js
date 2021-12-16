let parse = require("./parse_flang.js");

console.log(parse(`
int a = 1;
int b = 1;
while(a < 20){
    a = a + b;
    int c = a;//comment
    a = b;
    b = c;
    print(a);
}


/*
comment


*/

string getString(string msg){
    print(msg);
    string ret = scan();
    return ret;
}
`));








