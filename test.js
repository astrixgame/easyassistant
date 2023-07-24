import natural from 'natural';

var sentenceMapping = [
    { sentence: 'otevřít stránku', command: 'open' },
    { sentence: 'otevři web', command: 'open' },
    { sentence: 'otevřít webovou stránku', command: 'open' },
    { sentence: 'přehrát video', command: 'play' },
    { sentence: 'spusť video', command: 'play' },
    { sentence: 'přehraj mi video', command: 'play' }
];

function processSentence(sentence) {
    var bestMatch = null, bestScore = 0;
    for(var mapping of sentenceMapping) {
        var distance = natural.JaroWinklerDistance(mapping.sentence, sentence.toLowerCase(), {ignoreCase:true});
        if(distance>bestScore) {
            bestMatch = mapping.command;
            bestScore = distance;
        }
    }
    return bestMatch;
}

console.log('Příkaz: ' + processSentence('zapni video'));