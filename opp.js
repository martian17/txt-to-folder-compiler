let TrieMatch = require("./triematch.js");

let prectable = {};
let atomicExpr;
let consumeSpaces;
let matchOperator;
let compOperators;

let isBinaryOperator = function(token){
    return token[3] in prectable && prectable[token[3]][1] === token[0];
};


//[id, left,right, operator]
let opp = function(str,i){
    let s,left;
    [left,i] = atomicExpr(str,i);
    [s,i] = consumeSpaces(str,i);
    let n = 0;
    while(i < str.length){
        let opstr,right;
        let i0 = i;
        try{
            [opstr,i] = matchOperator(str,i);
            [s,i] = consumeSpaces(str,i);
            [right,i] = atomicExpr(str,i);
            [s,i] = consumeSpaces(str,i);
        }catch(err){
            i = i0;
            break;
        }
        
        let head = left;
        let parent = [0,0,left];
        let root = parent;
        while(isBinaryOperator(head) && compOperators(head[3],opstr)){
            parent = head;
            head = head[2];
        }
        parent[2] = [prectable[opstr][1],head,right,opstr];
        left = parent[2];
    }
    return [left,i];
};



let mnemonics = {
    NEWLINE:"\n",
    SPACE:" ",
    TAB:"\t"
};

module.exports = function(precstr,_atomicExpr,_consumeSpaces){
    atomicExpr = _atomicExpr;
    consumeSpaces = _consumeSpaces;
    let groups = precstr.split(/\s*\n\s*\n\s*/).map((group,i)=>{
        return group.trim().split("\n").map(line=>{
            line = line.split(/\s+/);
            line[0] = line[0].replace(/(NEWLINE|SPACE|TAB)/,match=>mnemonics[match]);
            line[1] = parseInt(line[1]);
            line[2] = i;//precedence
            line[3] = line[2]==="-";//associativity
            prectable[line[0]] = line;
            return line;
        });
    });
    triematch = (new TrieMatch(Object.keys(prectable).filter(o=>o!=="\n"&&o!==" ")));// \n is kinda treated specially
    matchOperator = triematch.maxMatch.bind(triematch);
    
    compOperators = function(op1,op2){
        let p1 = prectable[op1][2];
        let p2 = prectable[op2][2];
        
        if(p1 === p2){
            return prectable[op1][3];
        }
        return p1 < p2;
    };
    return opp;
};

