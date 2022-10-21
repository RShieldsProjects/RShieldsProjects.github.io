/** Data entry fields */
var midiFileInput;
var importMetadataFileInput;
var songNameInput;
var shortNameInput;
var artistInput;
var releaseYearInput;
var genreInput;
var descriptionInput;
var bpmInput;
var beatsPerBarInput;
var difficultyInput;
var noteSpacingInput;
var noteStartColorInput;
var noteEndColorInput;
var folderNameInput;
var songEndpointInput;
var clampPitchInput;
var snapInput;

/** Warnings element */
var warningsDiv;
/** Warnings, in the form { message: {data: ...} } */
let warnings = {};

/** Returns whether all required fields are filled in */
function verifyInputs() {
    const requiredFields = [
        midiFileInput,
        songNameInput,
        shortNameInput,
        artistInput,
        releaseYearInput,
        genreInput,
        descriptionInput,
        bpmInput,
        beatsPerBarInput,
        difficultyInput,
        noteSpacingInput,
        noteStartColorInput,
        noteEndColorInput,
        snapInput,
    ];

    for (const field of requiredFields) {
        if (!field.value) return false;
    }

    return true;
}

async function importFromPrevious() {
    if (!importMetadataFileInput.value) {
        alert('Please ensure a chart is uploaded');
        return;
    }

    const reader = new FileReader();
    reader.readAsText(importMetadataFileInput.files[0]);
    return new Promise(function(resolve) {
        reader.addEventListener(
            'load',
            function(event) {
                const json = JSON.parse(event.target.result);

                songNameInput.value = json.name ?? '';
                shortNameInput.value = json.shortName ?? '';
                artistInput.value = json.author ?? '';
                releaseYearInput.value = json.year ?? '';
                genreInput.value = json.genre ?? '';
                descriptionInput.value = json.description ?? '';
                bpmInput.value = json.tempo ?? '';
                beatsPerBarInput.value = json.timesig ?? '';
                difficultyInput.value = json.difficulty ?? '';
                noteSpacingInput.value = json.savednotespacing ?? '';
                if (json.note_color_start) noteStartColorInput.value = floatsToHex(json.note_color_start);
                if (json.note_color_end) noteEndColorInput.value = floatsToHex(json.note_color_end);
                folderNameInput.value = json.trackRef ?? '';
                songEndpointInput.value = json.endpoint ?? '';

                resolve();
            },
            { once: true }
        );
    });
}

/** Entrypoint: read the midi, generate the chart, and save it */
async function generate() {
    warnings = {};
    warningsDiv.innerHTML = '';

    if (!verifyInputs()) {
        alert('Please ensure a midi is uploaded and all fields are filled\n(Folder Name and Song Endpoint can be empty)');
        return;
    }

    const bpm = Number(bpmInput.value);

    const midi = MidiParser.parse(await readFileToBytes());
    const { notes, calculatedEndpoint } = midiToNotes(midi);
    const endpoint = songEndpointInput.value
        ? Number(songEndpointInput.value)
        : calculatedEndpoint;
    songEndpointInput.placeholder = calculatedEndpoint;

    const chart = {
        notes,
        name: songNameInput.value,
        shortName: shortNameInput.value,
        trackRef: folderNameInput.value || `${Math.random()}`,
        year: Number(releaseYearInput.value),
        author: artistInput.value,
        genre: genreInput.value,
        description: descriptionInput.value,
        difficulty: Number(difficultyInput.value),
        savednotespacing: Number(noteSpacingInput.value),
        endpoint,
        timesig: Number(beatsPerBarInput.value),
        tempo: bpm,
        lyrics: [],
        note_color_start: hexToFloats(noteStartColorInput.value),
        note_color_end: hexToFloats(noteEndColorInput.value),
        UNK1: 0,
    }
    exportWarnings(warnings);
    save('song.tmb', stringifyWithRounding(chart));
}

/** Convert the midi to the notes array */
function midiToNotes(midi) {
    /** Length of a note (in beats) that would otherwise have 0 length */
    const defaultNoteLength = 0.2;

    const clampPitch = clampPitchInput.checked;
    const snaps = [Number(snapInput.value), 12];

    const notes = [];
    let lastMeasure = 0;

    /* Begin translated section */
    const { timeDivision } = midi;

    /** All the events in the midi file, sorted by time */
    const allMidiEvents = [];
    for (const track of midi.track) {
        let currTime = 0;

        for (const event of track.event) {
            currTime += event.deltaTime;
            allMidiEvents.push({ ...event, time: currTime });
        }
    }
    allMidiEvents.sort(function(a, b) {
        const deltaTime = a.time - b.time;
        if (deltaTime) return deltaTime;
        
        // Same time:
        let aPriority = 0;
        let bPriority = 0;
        const aType = eventType(a);
        const bType = eventType(b);
        if (
            (aType === 'noteOn' || aType === 'noteOff') &&
            (bType === 'noteOn' || bType === 'noteOff')
        ) {
            if (a.data[0] === b.data[0]) {
                // - If same note, note off event has priority
                aPriority = eventType(a) === 'noteOff' ? 1 : 0;
                bPriority = eventType(b) === 'noteOff' ? 1 : 0;
            } else {
                // - If different note, note on event has priority
                aPriority = eventType(a) === 'noteOn' ? 1 : 0;
                bPriority = eventType(b) === 'noteOn' ? 1 : 0;
            }
        }
        return bPriority - aPriority;
    });

    /** Note that we're currently creating */
    let currentNote;
    /** Pitch of the most recent note-on event */
    let lastPitch;

    for (const event of allMidiEvents) {
        if (eventType(event) === 'noteOff') {
            const pitch = event.data[0];

            // We ignore note-off events for pitches other than the current one
            // which prevents slide-start notes from ending slides
            if (currentNote && pitch === currentNote.startPitch) {
                warnIfUnsnapped(event.time, timeDivision, snaps);
                
                const { startTime, startPitch } = currentNote;

                const length = event.time - startTime;

                notes.push([
                    startTime / timeDivision,
                    length > 0 ? length / timeDivision : defaultNoteLength,
                    (startPitch - 60) * 13.75,
                    0,
                    (startPitch - 60) * 13.75,
                ]);
                lastMeasure = Math.ceil((event.time - 1) / timeDivision);

                currentNote = undefined;
            }
        } else if (eventType(event) === 'noteOn') {
            warnIfUnsnapped(event.time, timeDivision, snaps);

            let pitch = event.data[0];
            if (pitch < 47 || pitch > 73) {
                addWarning(
                    clampPitch ? 'Pitch clamped' : 'Pitch out of range',
                    { pitch, measure: Math.floor(event.time / timeDivision) }
                );
                if (clampPitch) pitch = Math.min(Math.max(pitch, 47), 73);
            }
            lastPitch = pitch;

            if (currentNote) {
                const { startTime, startPitch } = currentNote;

                const length = event.time - startTime;
                const endPitch = pitch;
                const pitchDelta = endPitch - startPitch;

                notes.push([
                    startTime / timeDivision,
                    length > 0 ? length / timeDivision : defaultNoteLength,
                    (startPitch - 60) * 13.75,
                    pitchDelta * 13.75,
                    (endPitch - 60) * 13.75,
                ]);
            }

            currentNote = {
                startTime: event.time,
                startPitch: pitch,
            }
        } else if (eventType(event) === 'meta') {
            if (event.metaType === 81 && event.time !== 0) { // tempo change
                addWarning(
                    'Tempo change (unsupported)',
                    { measure: Math.floor(event.time / timeDivision) }
                );
            }
        }
    }
    /* End translated section */

    return {
        notes,
        // It feels rushed to end immediately after the last note,
        // so we add an extra 4 measures
        calculatedEndpoint: lastMeasure + 4
    };
}

function eventType(event) {
    if (
        event.type === 8 ||
        (event.type === 9 && event.data[1] === 0)
    ) {
        return 'noteOff';
    } else if (event.type === 9) {
        return 'noteOn';
    } else if (event.type === 255){
        return 'meta';
    } else {
        return 'unknown';
    }
}

/** Returns whether a note is snapped (quantized) */
function warnIfUnsnapped(eventTime, timeDivision, snaps) {
    for (const snap of snaps) {
        if ((eventTime * snap) % timeDivision === 0) return;
    }

    addWarning(
        'Unsnapped note',
        { measure: Math.floor(eventTime / timeDivision), eventTime }
    )
}

/** Converts "#xxxxxx" to [float, float, float] */
function hexToFloats(hexColor) {
    const rInt = parseInt(hexColor.substring(1,3), 16);
    const gInt = parseInt(hexColor.substring(3,5), 16);
    const bInt = parseInt(hexColor.substring(5,7), 16);
    return [rInt / 255, gInt / 255, bInt / 255];
}

/** Converts [float, float, float] to "#xxxxxx" */
function floatsToHex(floats) {
    return `#${ floats.map(function(f) { return Math.round(f * 255).toString(16); }).join('') }`;
}

/** Read the file into a Uint8Array */
async function readFileToBytes() {
    const reader = new FileReader();
    reader.readAsArrayBuffer(midiFileInput.files[0]);
    return new Promise(function(resolve) {
        reader.addEventListener(
            'load',
            function(event) {
                resolve(new Uint8Array(event.target.result));
            },
            { once: true }
        );
    });
}

/** Stringify some json but round all the floats to at most 3 decimals */
function stringifyWithRounding(data) {
    return JSON.stringify(data, function(key, value) {
        if (typeof value === 'number') {
            return Math.round(value * 1000) / 1000;
        }
        return value;
    });
}

/**
 * Downloads the data as a file
 * https://stackoverflow.com/a/33542499
 */
function save(filename, data) {
    const blob = new Blob([data], { type: 'application/json' });
    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveBlob(blob, filename);
    } else {
        const elem = document.createElement('a');
        elem.href = URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
        setTimeout(function() {
            URL.revokeObjectURL(elem.href);
        }, 1000);
    }
}

/** Adds a warning to the warnings list */
function addWarning(type, data) {
    if (warnings[type] === undefined) warnings[type] = [];
    warnings[type].push(data);
}

/** Prints the warnings list to the warningsDiv */
function exportWarnings(warnings) {
    for (const [warning, data] of Object.entries(warnings)) {
        const elem = document.createElement('p');
        // TODO sanitize
        elem.innerHTML = `${warning}: ${JSON.stringify(data)}`;
        warningsDiv.appendChild(elem);
    }
    if (Object.keys(warnings).length !== 0) {
        alert('Created chart with warnings. Check above the Generate button.');
    }
}

/** Initializes the inputs and hooks */
function init() {
    midiFileInput = document.getElementById('midifile');
    importMetadataFileInput = document.getElementById('importmetadatafile');
    songNameInput = document.getElementById('songname');
    shortNameInput = document.getElementById('shortname');
    artistInput = document.getElementById('artist');
    releaseYearInput = document.getElementById('releaseyear');
    genreInput = document.getElementById('genre');
    descriptionInput = document.getElementById('description');
    bpmInput = document.getElementById('bpm');
    beatsPerBarInput = document.getElementById('beatsperbar');
    difficultyInput = document.getElementById('difficulty');
    noteSpacingInput = document.getElementById('notespacing');
    noteStartColorInput = document.getElementById('notestartcolor');
    noteEndColorInput = document.getElementById('noteendcolor');
    folderNameInput = document.getElementById('foldername');
    songEndpointInput = document.getElementById('songendpoint');
    clampPitchInput = document.getElementById('clamppitch');
    snapInput = document.getElementById('snap');

    warningsDiv = document.getElementById('warnings');

    document.getElementById('importmetadatabutton').addEventListener('click', importFromPrevious);
    document.getElementById('generatechart').addEventListener('click', generate);

    midiFileInput.addEventListener('change', function() { songEndpointInput.placeholder = 'Auto'; });
}
