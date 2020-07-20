var comboConsonants = ['b','c','d','f','k','l','m','n','p','r','s','t','v','z'];
var loneConsonants = comboConsonants.concat('g','h','j','x','y','bl','br','ch','cl','cr','dr','fl','fr','gl','gr','ll','pl','pr','rr','sc','scr','sh','sl','sn','sp','spl','spr','st','str','th','tr','~');
var vowels = ['a','e','i','o','u'];
var HTMLreplacements = [[/\n/g,'<br>'], [/~/g,'&ntilde;'], [/`/g,'&Ntilde;']];
var odds = 1 / 10;
var alwaysDespacito = false;

function depp() {
    odds = 1 / document.getElementById("odds").value;
    alwaysDespacito = document.getElementById("alwaysBox").checked;
    
    var arr = orig.split('').reverse();
    var output = '';
    while (arr.length > 0) {
        var word = '';
        var letter = arr.pop();
        while (/[a-zA-Z~]/.test(letter)) {
            word += letter;
            letter = arr.pop();
        }
        
        output += mutate(word);
        output += letter;
    }
    
    let title = alwaysDespacito ? titleify(mutateDespacito()) : "Despacito";
    document.getElementById("deppDiv").innerHTML = "<h1>" + title + "</h1><h2>Luis Fonsi ft. Daddy Yankee</h2><br>" + HTMLify(output);
}

function mutate(str) {
    if (str == '') return '';
    
    let capitalize = /[A-Z~]/.test(str.charAt(0));
    
    var output = '';
    if (str.toLowerCase() == 'y') {
        output = maybeSample(str, vowels);
    } else if (alwaysDespacito && str.toLowerCase() == "despacito") {
        output = mutateDespacito();
    } else {
        var arr = str.toLowerCase().split('').reverse();
        
        var chunk = '';
        while (arr.length > 0) {
            var letter = arr.pop();
            if (vowels.indexOf(letter) != -1 && chunk.charAt(chunk.length - 1) != 'q') {
                if (chunk != '') {
                    if (output == '' || Math.random() > 0.5) {
                        output += maybeSample(chunk, loneConsonants);
                    } else {
                        output += maybeSample(chunk, comboConsonants, 2);
                    }
                }
                chunk = '';
                
                output += maybeSample(letter, vowels);
            } else {
                chunk += letter;
            }
        }
        output += maybeSample(chunk, comboConsonants);
    }
    
    if (capitalize) {
        return titleify(output);
    } else {
        return output;
    }
}

function maybeSample(chunk, arr, number) {
    if (chunk == '') return '';
    if (typeof(number) === 'undefined') number = 1;
    
    if (Math.random() > odds) {
        return chunk;
    } else {
        let output = '';
        for (let i = 0; i < number; i++){
            output += arr[Math.floor(Math.random() * arr.length)]
        }
        return output;
    }
}

function mutateDespacito() {
    let origOdds = odds;
    if (odds < 0.2) odds = 0.2;
    alwaysDespacito = false;
    
    do {
        var output = mutate("despacito");
    } while (output == "despacito");
    
    odds = origOdds;
    alwaysDespacito = true;
    return output;
}

function titleify(str) {
    let firstChar = str.charAt(0);
    if (firstChar == '~') {
        return '`' + str.slice(1);
    } else {
        return firstChar.toUpperCase() + str.slice(1);
    }
}

function HTMLify(str) {
    output = str;
    for (let i = 0; i < HTMLreplacements.length; i++) {
        output = output.replace(HTMLreplacements[i][0], HTMLreplacements[i][1]);
    }
    return output;
}
