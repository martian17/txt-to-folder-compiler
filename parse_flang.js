let getChar = function(str,i){
    if(i < str.length){
        return str[i];
    }
    return "";
};

let repeatstr = function(str,n){
    let r = "";
    for(let i = 0; i < n; i++){
        r += str;
    }
    return r;
};

let consumeMultiComment = function(str,i){
    i+=2;
    token = "/*";
    for(; i < str.length-1; i++){
        if(str[i] === "*"){
            if(str[i+1] === "/"){
                token += "*/";
                return [token,i+2];
            }
        }else{
            token += str[i];
        }
    }
    throw new Error(`Expected a multi-line comment termination */, but got EOF instead at at ${errat(str,i)}`);
};

let consumeSingleComment = function(str,i){
    i+=2;
    token = "//";
    for(; i < str.length; i++){
        if(str[i] === "\n"){
            token += "\n";
            return [token,i+1];
        }else{
            token += str[i];
            i++;
        }
    }
    return [token,i];
};

let consumeSpaces = function(str,i){
    let token = "";
    for(; i < str.length; i++){
        let c1 = str[i];
        let c2 = getChar(str,i+1);
        if(!c1.match(/\s/)){
            if(c1+c2 === "//"){
                [t,i] = consumeSingleComment(str,i);
                token += t;
            }else if(c1+c2 === "/*"){
                [t,i] = consumeMultiComment(str,i);
                token += t;
            }else{
                break;
            }
        }else{
            token += str[i];
        }
    }
    return [token,i];
};


const errat = function(str,n){
    let line = 1;
    let chars = 1;
    for(let i = 0; i < n; i++){
        if(str[i] === "\n"){
            line++;
            chars = 1;
        }else{
            chars++;
        }
    }
    const lines = str.split("\n");
    
    return `line ${line}:${chars}\n${lines[line-1]}\n${repeatstr(" ",chars)}^`;
};




let parseIdentifier = function(str,i){
    if(!str[i].match(/[A-Za-z_$]/)){
        throw new Error(`At ${errat(str,i)}\n Expected an identifier, but got "${str[i]}" instead`);
    }
    let idname = str[i];
    i++;
    for(;i<str.length; i++){
        if(str[i].match(/[A-Za-z_$0-9]/)){
            idname+=str[i];
        }else{
            break;
        }
    }
    return [idname,i]
};

let consumeSemiSpace = function(str,i){
    let s1,s2;
    [s1,i] = consumeSpaces(str,i);
    if(str[i] === ";"){
        i++;
    }
    [s2,i] = consumeSpaces(str,i);
    return [s1+s2,i];
};

/*
keywords
if
while
funcdef command
funccall command
assignment command
declaration command
*/

let typenames = {
    int:0,
    float:1,
    string:2,
    char:3
};
let INT = 0;
let FLOAT = 1;
let STRING = 2;
let CHAR = 3;

let cmdnames = {
    if:0,
    while:1,
    "return":8
}
let IFST = 0;
let WHIL = 1;
let DECL = 2;
let ASSI = 3;
let PRNT = 4;
let INPU = 5;
let FUND = 6;//func def
let FUNC = 7;//func call
let RETU = 8;



let VAR = 0;
let ADD = 1;
let SUB = 2;
let MUL = 3;
let DIV = 4;
let LIT = 5;
let EQU = 6;
let GRE = 7;
let LES = 8;
let PAR = 9;//parenthesis




let parseCommand = function(str,i){
    let idname,s;
    [idname,i] = parseIdentifier(str,i);
    [s,i] = consumeSpaces(str,i);
    let retval;
    if(idname in typenames){
        //declaration or funcdef
        let typename = idname;
        [idname,i] = parseIdentifier(str,i);
        [s,i] = consumeSpaces(str,i);
        if(str[i] === "("){
            let funcexpr;
            [args,i] = parseFuncDefArgs(str,i);
            [s,i] = consumeSpaces(str,i);
            [body,i] = parseScope(str,i);
            retval = [FUND,typenames[typename],idname,args,body];
        }else if(str[i] === "="){
            i++;
            [s,i] = consumeSpaces(str,i);
            let right;
            [right,i] = parseExpr(str,i);
            retval = [DECL,typenames[typename],idname,right];
        }
    }else if(idname in cmdnames){
        if(idname === "if"){
            let cond,body;
            [cond,i] = parseParen(str,i);
            [s,i] = consumeSpaces(str,i);
            [body,i] = parseScope(str,i);
            retval = [IFST,cond[1],body];
        }else if(idname === "while"){
            let cond,body;
            [cond,i] = parseParen(str,i);
            [s,i] = consumeSpaces(str,i);
            [body,i] = parseScope(str,i);
            retval = [WHIL,cond[1],body];
        }else if(idname === "return"){
            console.log(str[i]);
            let val;
            try{
                [val,i] = parseExpr(str,i);
                retval = [RETU,val];
            }catch(err){
                retval = [RETU,null];
            }
        }
    }else{//assignemnt or func call
        if(str[i] === "("){//funccall
            i++;
            [s,i] = consumeSpaces(str,i);
            let args;
            [args,i] = parseFuncCallArgs(str,i);
            retval = [FUNC,idname,args];
        }else if(str[i] === "="){//assignment
            i++;
            [s,i] = consumeSpaces(str,i);
            let right;
            [right,i] =  parseExpr(str,i);
            retval = [ASSI,idname,right];
        }else{
            throw new Error(`Unexpected identifier ${idname} at ${errat(str,i)}`);
        }
    }
    [s,i] = consumeSemiSpace(str,i);//could encounter semicolon so yeah, but it's optional
    return [retval,i];
};

let parseFuncDefArgs = function(str,i){
    i++;
    let s;
    [s,i] = consumeSpaces(str,i);
    let args = [];
    if(str[i] === ")"){
        return [args,i+1]
    }
    while(i < str.length){
        let typename,idname;
        [typename,i] = parseIdentifier(str,i);
        [s,i] = consumeSpaces(str,i);
        [idname,i] = parseIdentifier(str,i);
        if(!(typename in typenames)){
            throw new Error(`Typename ${typename} not defined at ${errat(str,i)}`);
        }
        args.push([typenames[typename],idname]);
        [s,i] = consumeSpaces(str,i);
        if(str[i] === ","){
            i++;
            [s,i] = consumeSpaces(str,i);
        }else if(str[i] === ")"){
            return [args,i+1];
        }else{
            throw new Error(`Unexpected token ${str[i]} at ${errat(str,i)}`);
        }
    }
    throw new Error(`Unexpected end of funcdef argument at ${errat(str,i)}`);
};


let parseFuncCallArgs = function(str,i){
    i++;
    let s;
    [s,i] = consumeSpaces(str,i);
    let args = [];
    if(str[i] === ")"){
        return [args,i+1]
    }
    while(i < str.length){
        let expr;
        [expr,i] = parseExpr(str,i);
        args.push(expr);
        [s,i] = consumeSpaces(str,i);
        if(str[i] === ","){
            i++;
            [s,i] = consumeSpaces(str,i);
        }else if(str[i] === ")"){
            return [args,i+1];
        }else{
            throw new Error(`Unexpected token ${str[i]} at ${errat(str,i)}`);
        }
    }
};

let parseParen = function(str,i){
    let s;
    i++;//skip the first paren
    [s,i] = consumeSpaces(str,i);
    let expr;
    [expr,i] = parseExpr(str,i);
    [s,i] = consumeSpaces(str,i);
    if(str[i] !== ")"){
        throw new Error(`Expected ")" at the end of a parenthesis. but found "${str[i]}" at ${errat(str,i)}`);
    }
    return [[PAR,expr],i+1];
};

let parseScope = function(str,i){
    let s;
    if(str[i] !== "{"){
        throw new Error(`Expected "{" at the beginning of a scope at ${errat(str,i)}`);
    }
    i++;
    [s,i] = consumeSpaces(str,i);
    let commands = [];
    while(i < str.length){
        if(str[i] === "}"){
            return [commands,i+1];
        }
        let cmd;
        [cmd,i] = parseCommand(str,i);
        commands.push(cmd);
        [s,i] = consumeSpaces(str,i);
    }
    throw new Error(`Expected "}" at the end of a scope at ${errat(str,i)}`);
};







let parseString = function(str,i){
    i++;//consume the first quote
    let result = "";
    while(i < str.length){
        if(str[i] === "\""){
            i++;
            return [[LIT,STRING,result],i];
            break;
        }else if(str[i] === "\\"){
            i++;
            result += str[i];
            i++;
        }else{
            result += str[i];
            i++;
        }
        result += str[i];
    }
    throw new Error(`Expected " after the end of a string at ${errat(str,i)}`);
};


let parseNumber = function(str,i){
    //conforms to the JSON standard number notation
    //sign
    let sign = "+";
    if(str[i] === "+"){//prefix
        i++;
    }else if(str[i] === "-"){
        sign = "-";
        i++;
    }
    //digit
    let digitStr = "";
    if(str[i] === "0"){
        digitStr += str[i];
        i++;
    }else if(getChar(str,i).match(/[1-9]/)){//overflow protection
        digitStr += str[i];
        i++;
        while(i < str.length){
            if(str[i].match(/[0-9]/)){
                i++;
                digitStr += str[i];
            }else{
                break;
            }
        }
    }else{
        err();
    }
    //fraction
    let fracStr = "";
    if(str[i] === "."){
        i++;
        if(!getChar(str,i).match(/[0-9]/)){
            err();
        }
        while(i < str.length){
            if(str[i].match(/[0-9]/)){
                i++;
                fracStr += str[i];
            }else{
                break;
            }
        }
    }
    //exponent
    let expSign = "+";
    let expStr = "";
    if(str[i] === "e" || str[i] === "E"){
        i++;
        if(str[i] === "+"){
            i++;
        }else if(str[i] === "-"){
            i++;
            expSign = "-";
        }
        if(!getChar(str,i).match(/[0-9]/)){
            err();
        }
        while(i < str.length){
            if(str[i].match(/[0-9]/)){
                i++;
                expStr += str[i];
            }else{
                break;
            }
        }
    }
    
    //float (double)
    const numstr = sign+digitStr+(fracStr===""?"":"."+fracStr)+(expStr===""?"":"E"+expSign+expStr);
    if(fracStr !== "" || expStr !== ""){
        return [[LIT,FLOAT,parseFloat(numstr)],i];
    }else{
        return [[LIT,INT,parseInt(numstr)],i];
    }
};



///OOOOOOOOhh kay, finally, expression time
//* binary expr
//* funccall expr
//* parenthesis
let parseAtomics = function(str,i){
    if(i >= str.length){
        return false;
    }
    if(str[i] === "("){
        return parseParen(str,i);
    }else if(str[i] === "\""){
        return parseString(str,i);
    }else if(str[i] === "\'"){
        i++;
        let c = str[i];
        i++;
        if(str[i] !== "\'"){
            throw new Error("Expected \' at the end of a char literal at ${errat(str,i)}");
        }
        return [[LIT,CHAR,c],i+1];
    }else if(str[i].match(/[0-9\+\-]/)){
        return parseNumber(str,i);
    }else{
        let idname;
        [idname,i] = parseIdentifier(str,i);
        let i0 = i;
        [s,i] = consumeSpaces(str,i);
        if(str[i] === "("){
            let args;
            [args,i] = parseFuncCallArgs(str,i);
            return [[FUNC,idname,args],i]
        }else{
            return [[VAR,idname],i0];
        }
        
    }
};

//first spot: token
//second spot: id
//third spot: +: greater than itself, -: less than itself
let parseExpr = new (require("./opp.js"))(`
*  3  +
/  4  +
 
-  2  +
+  1  +

== 6  +
>  7  +
<  8  +
`,parseAtomics,consumeSpaces);




let parseCommands = function(str){
    let i = 0;
    let s;
    let commands = [];
    while(i < str.length){
        [s,i] = consumeSpaces(str,i);
        let cmd;
        [cmd,i] = parseCommand(str,i);
        console.log("cmd: ",cmd);
        commands.push(cmd);
    }
    return commands;
};



module.exports = parseCommands;