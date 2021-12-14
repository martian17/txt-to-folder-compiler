let fs = require("fs").promises;
let path = require("path");

let parseSubFolder = function(lines,i){
    let l1 = lines[i];
    if(i === lines.length-1){
        return [[l1[1],[]],i+1];
    }
    let l2 = lines[i+1];
    if(l1[0] >= l2[0]){
        return [[l1[1],[]],i+1];
    }
    //now l2 is a sub dir of l1
    i++;
    let subs = [];
    while(i < lines.length && lines[i][0] > l1[0]){
        let sub;
        [sub,i] = parseSubFolder(lines,i);
        subs.push(sub);
    }
    return [[l1[1],subs],i];
};

let transformAST = function(ast){
    let result = [];
    for(let i = 0; i < ast.length; i++){
        let sub = ast[i];
        let rep = sub[0];
        let contents = sub[1];
        for(let i = 0; i < rep; i++){
            result.push(transformAST(contents));
        }
    }
    return result;
};

let getNames = function(len){
    let order = len*10/8;//with a safe margin
    let start = 10**Math.floor(Math.log(order)/Math.log(10));
    let result = [];
    for(let i = 0; i < len; i++){
        result.push((start+i)+"");
    }
    return result;
};

let makeFolders = async function(dest,folders,cnt){
    await fs.mkdir(dest);
    let names = getNames(folders.length);
    for(let i = 0; i < folders.length; i++){
        cnt = await makeFolders(path.join(dest,names[i]),folders[i],cnt+1);
    }
    return cnt;
};


let main = async function(){
    let fname = process.argv[2];
    let dest = process.argv[3] || "a.out";
    if(!fname){
        console.log("usage: node f.js fname [optional:dest]");
        process.exit(1);
    }
    
    
    let txt = (await fs.readFile(fname)).toString();
    console.log(txt);
    let lines = txt.split("\n").map(l=>{
        let d = 0;
        let i = 0;
        for(; i < l.length; i++){
            if(l[i].match(/\s/)){
                d++;
            }else{
                break;
            }
        }
        if(i == l.length){
            return false;
        }
        if(!l[i].match(/[0-9]/)){
            return false;
        }
        let numtxt = "";
        while(i < l.length && l[i].match(/[0-9]/)){
            numtxt+=l[i];
            i++;
        }
        return [d,parseInt(numtxt),[]];//depth, repetition, subfolders
    }).filter(l=>l);
    console.log(lines);
    //make the lines into ast
    let folders = [];
    let i = 0;
    while(i < lines.length){
        let sub;
        [sub,i] = parseSubFolder(lines,i,0)
        folders.push(sub);
    }
    console.log(JSON.stringify(folders));
    folders = transformAST(folders);
    console.log(JSON.stringify(folders,null,4));
    
    
    //compiling the folders
    //deleting the dest to start from a clean state
    await fs.rm(dest, { recursive: true, force: true });
    let cnt = 0;
    await makeFolders(dest,folders,cnt);
};

main();