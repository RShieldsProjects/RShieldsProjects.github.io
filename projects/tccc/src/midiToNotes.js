var notes = [];
var calculatedEndpoint = 1;

/** Length of a note (in beats) that would otherwise have 0 length */
const defaultNoteLength = 0.2;

const midiWarnings = new Warnings('midiwarnings');

/** Convert the midi to the notes array */
function midiToNotes(midi) {
    notes = [];
    midiWarnings.clear();

    const clampPitch = getSetting('clamppitch');
    const snaps = [getSetting('snap'), 12];
    console.log(snaps);

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
        
        // Same time
        let aPriority = 0;
        let bPriority = 0;
        const aType = eventType(a);
        const bType = eventType(b);
        if (
            (aType === 'noteOn' || aType === 'noteOff') &&
            (bType === 'noteOn' || bType === 'noteOff')
        ) {
            if (a.data[0] === b.data[0]) {
                // If same pitch, note off event has priority.
                // This is so when a note ends and immediately restarts,
                // we can merge them into one note
                aPriority = eventType(a) === 'noteOff' ? 1 : 0;
                bPriority = eventType(b) === 'noteOff' ? 1 : 0;
            } else {
                // If different pitch, note on event has priority.
                // This is so when a note ends and another starts at the
                // same time, we slide from the old to the new
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
                midiWarnings.add(
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
                midiWarnings.add(
                    'Tempo change (unsupported)',
                    { measure: Math.floor(event.time / timeDivision) }
                );
            }
        }
    }
    /* End translated section */

    calculatedEndpoint = lastMeasure + 4;
    inputs['songendpoint'].placeholder = calculatedEndpoint;
    midiWarnings.display();
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

    midiWarnings.add(
        'Unsnapped note',
        { measure: Math.floor(eventTime / timeDivision), eventTime }
    )
}
