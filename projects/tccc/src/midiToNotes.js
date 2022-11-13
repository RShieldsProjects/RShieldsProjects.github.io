const MidiToNotes = (function () {
  /** Length of a note (in beats) that would otherwise have 0 length */
  const defaultNoteLength = 0.2;

  const midiWarnings = new Warnings("midiwarnings");

  /** Convert the midi to the notes array */
  function generateNotes(midi) {
    console.log(midi);
    MidiToNotes.notes = [];
    midiWarnings.clear();

    const { timeDivision } = midi;

    /** All the events in the midi file, sorted by time */
    const sortedMidiEvents = getSortedMidiEvents(midi);

    generateWarnings(sortedMidiEvents, timeDivision);
    midiWarnings.display();

    // Calculate endpoint
    for (let i = sortedMidiEvents.length - 1; i >= 0; i--) {
      const eventType = getEventType(sortedMidiEvents[i]);
      if (eventType === "noteOff") {
        MidiToNotes.calculatedEndpoint =
          Math.ceil((sortedMidiEvents[i].time - 1) / timeDivision) + 4;
        break;
      }
    }
    Inputs.inputs["songendpoint"].placeholder = MidiToNotes.calculatedEndpoint;

    if (Settings.getSetting("slidemidi2tc")) {
      generateNotesMidi2Tc(sortedMidiEvents, timeDivision);
    } else if (Settings.getSetting("slidetccc")) {
      generateNotesTccc(sortedMidiEvents, timeDivision);
    } else {
      midiWarnings.add("Unknown slide type", {});
    }

    generateLyrics(sortedMidiEvents, timeDivision);

    Preview.display();
  }

  function getEventType(event) {
    if (event.type === 8 || (event.type === 9 && event.data[1] === 0)) {
      return "noteOff";
    } else if (event.type === 9) {
      return "noteOn";
    } else if (event.type === 255) {
      return "meta";
    } else {
      return "unknown";
    }
  }

  /**
   * Merges midi events and sorts them by when they occur.
   *
   * If two midi events occur at the same time,
   * - If they are the same note, note off takes priority (to start a new note)
   * - If they are not the same note, note on takes priority (to create a slide)
   */
  function getSortedMidiEvents(midi) {
    const allMidiEvents = [];
    for (const track of midi.track) {
      let currTime = 0;

      for (const event of track.event) {
        currTime += event.deltaTime;
        allMidiEvents.push({ ...event, time: currTime });
      }
    }

    // Sorts in place
    allMidiEvents.sort(function (a, b) {
      const deltaTime = a.time - b.time;
      if (deltaTime) return deltaTime;

      // Same time
      let aPriority = 0;
      let bPriority = 0;
      const aType = getEventType(a);
      const bType = getEventType(b);
      if (
        (aType === "noteOn" || aType === "noteOff") &&
        (bType === "noteOn" || bType === "noteOff")
      ) {
        if (a.data[0] === b.data[0]) {
          // If same pitch, note off event has priority.
          // This is so when a note ends and immediately restarts,
          // we can merge them into one note
          aPriority = getEventType(a) === "noteOff" ? 1 : 0;
          bPriority = getEventType(b) === "noteOff" ? 1 : 0;
        } else {
          // If different pitch, note on event has priority.
          // This is so when a note ends and another starts at the
          // same time, we slide from the old to the new
          aPriority = getEventType(a) === "noteOn" ? 1 : 0;
          bPriority = getEventType(b) === "noteOn" ? 1 : 0;
        }
      }
      return bPriority - aPriority;
    });

    return allMidiEvents;
  }

  function generateNotesMidi2Tc(sortedMidiEvents, timeDivision) {
    /** Note that we're currently creating */
    let currentNote;

    for (const event of sortedMidiEvents) {
      if (getEventType(event) === "noteOff") {
        const pitch = event.data[0];

        // We ignore note-off events for pitches other than the current one
        // which prevents slide-start noteOffs from ending slides
        if (currentNote && pitch === currentNote.startPitch) {
          const { startTime, startPitch } = currentNote;

          const length = event.time - startTime;

          MidiToNotes.notes.push([
            startTime / timeDivision,
            length > 0 ? length / timeDivision : defaultNoteLength,
            (startPitch - 60) * 13.75,
            0,
            (startPitch - 60) * 13.75,
          ]);

          currentNote = undefined;
        }
      } else if (getEventType(event) === "noteOn") {
        const pitch = event.data[0];

        if (currentNote) {
          const { startTime, startPitch } = currentNote;

          const length = event.time - startTime;
          const endPitch = pitch;
          const pitchDelta = endPitch - startPitch;

          MidiToNotes.notes.push([
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
        };
      }
    }
  }

  function generateNotesTccc(sortedMidiEvents, timeDivision) {
    /** Note that we're currently creating */
    let currentNote;

    for (const event of sortedMidiEvents) {
      if (getEventType(event) === "noteOff") {
        const pitch = event.data[0];

        // We ignore note-off events for pitches other than the current one
        // which prevents slide-start noteOffs from ending slides
        if (currentNote && pitch === currentNote.endPitch) {
          const { startTime, startPitch, endPitch } = currentNote;

          const length = event.time - startTime;
          const pitchDelta = endPitch - startPitch;

          MidiToNotes.notes.push([
            startTime / timeDivision,
            length > 0 ? length / timeDivision : defaultNoteLength,
            (startPitch - 60) * 13.75,
            pitchDelta * 13.75,
            (endPitch - 60) * 13.75,
          ]);

          currentNote = undefined;
        }
      } else if (getEventType(event) === "noteOn") {
        const pitch = event.data[0];

        if (currentNote) {
          currentNote.endPitch = pitch;
        } else {
          currentNote = {
            startTime: event.time,
            startPitch: pitch,
            endPitch: pitch,
          };
        }
      }
    }
  }

  function generateLyrics(sortedMidiEvents, timeDivision) {
    MidiToNotes.lyrics = [];

    for (const event of sortedMidiEvents) {
      const eventType = getEventType(event);
      if (
        eventType === "meta" &&
        (event.metaType === 0 || event.metaType === 5)
      ) {
        MidiToNotes.lyrics.push({
          bar: event.time / timeDivision,
          text: event.data.trim(),
        });
      }
    }
  }

  function generateWarnings(sortedMidiEvents, timeDivision) {
    const clampPitch = Settings.getSetting("clamppitch");
    const snaps = [Settings.getSetting("snap"), 12];

    for (const event of sortedMidiEvents) {
      const eventType = getEventType(event);
      if (eventType === "noteOn" || eventType === "noteOff") {
        warnIfUnsnapped(event.time, timeDivision, snaps);

        let pitch = event.data[0];
        if (pitch < 47 || pitch > 73) {
          midiWarnings.add(
            clampPitch ? "Pitch clamped" : "Pitch out of range",
            { pitch, beat: Math.floor(event.time / timeDivision) }
          );
          if (clampPitch) pitch = Math.min(Math.max(pitch, 47), 73);
        }
      } else if (eventType === "meta") {
        if (event.metaType === 81 && event.time !== 0) {
          // tempo change
          midiWarnings.add("Tempo change (unsupported)", {
            beat: Math.floor(event.time / timeDivision),
          });
        }
      }
    }
  }

  /** Returns whether a note is snapped (quantized) */
  function warnIfUnsnapped(eventTime, timeDivision, snaps) {
    for (const snap of snaps) {
      if ((eventTime * snap) % timeDivision === 0) return;
    }

    midiWarnings.add("Unsnapped note", {
      beat: Math.floor(eventTime / timeDivision),
      eventTime,
    });
  }

  return { calculatedEndpoint: 1, generateNotes, lyrics: [], notes: [] };
})();
