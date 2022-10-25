/** Maps input names to input elements */
var inputs = {};

/** Maps input names to their prop names in the chart format */
var inputMap = {
    songname: 'name',
    shortname: 'shortName',
    artist: 'author',
    releaseyear: 'year',
    genre: 'genre',
    description: 'description',
    bpm: 'tempo',
    beatsperbar: 'timesig',
    difficulty: 'difficulty',
    notespacing: 'savednotespacing',
    notestartcolor: 'note_color_start',
    noteendcolor: 'note_color_end',
    foldername: 'trackRef',
    songendpoint: 'endpoint',
};

var optionalInputNames = new Set(['foldername', 'songendpoint']);

var numberInputNames = new Set(['releaseyear', 'difficulty', 'notespacing', 'songendpoint', 'beatsperbar', 'bpm']);
var colorInputNames = new Set(['notestartcolor', 'noteendcolor']);

/** Returns whether all required fields are filled in */
function verifyInputs() {
    for (const [inputName, input] of Object.entries(inputs)) {
        if (!optionalInputNames.has(inputName) && !input.value) {
            return false;
        }
    }
    return true;
}

function readInputs(warnings) {
    const result = {};
    for (const [inputName, input] of Object.entries(inputs)) {
        if (numberInputNames.has(inputName)) {
            result[inputMap[inputName]] = toNumber(input.value, warnings, inputName);
        } else if (colorInputNames.has(inputName)) {
            result[inputMap[inputName]] = hexToFloats(input.value);
        } else {
            result[inputMap[inputName]] = input.value;
        }
    }
    return result;
}

function writeInputs(obj) {
    for (const [inputName, input] of Object.entries(inputs)) {
        const chartFormatName = inputMap[inputName];
        if (!chartFormatName) continue;
        const value = obj[chartFormatName];
        if (!value) continue;

        if (colorInputNames.has(inputName)) {
            input.value = floatsToHex(value);
        } else {
            input.value = value;
        }
    }
}

/** Converts a string to an number, warning if it's actually a float */
function toNumber(str, warnings, name) {
    const num = Number(str);
    if (num % 1 !== 0) {
        warnings.add('Not a whole number', { field: name, value: num })
    }
    return num;
}

registerInit(function() {
    for (const inputName of Object.keys(inputMap)) {
        const input = document.getElementById(inputName);
        if (!input) throw `Could not find input: ${inputName}`
        inputs[inputName] = input;
    }
});
