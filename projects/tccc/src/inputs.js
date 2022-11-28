const Inputs = (function () {
  /** Maps input names to input elements */
  const inputs = {};

  /** Maps input names to their prop names in the chart format */
  const inputMap = {
    songname: "name",
    shortname: "shortName",
    artist: "author",
    releaseyear: "year",
    genre: "genre",
    description: "description",
    bpm: "tempo",
    beatsperbar: "timesig",
    difficulty: "difficulty",
    notespacing: "savednotespacing",
    notestartcolor: "note_color_start",
    noteendcolor: "note_color_end",
    foldername: "trackRef",
    songendpoint: "endpoint",
  };

  /** Inputs that are not required to be filled in */
  const optionalInputNames = new Set(["foldername", "songendpoint"]);

  /** Inputs that need to be formatted as ints */
  const intInputNames = new Set([
    "releaseyear",
    "difficulty",
    "notespacing",
    "songendpoint",
    "beatsperbar",
  ]);
  /** Inputs that need to be formatted as floats */
  const floatInputNames = new Set([
    "bpm",
  ]);

  /** Inputs that need to be formatted as colors */
  const colorInputNames = new Set(["notestartcolor", "noteendcolor"]);

  /** Returns whether all required fields are filled in */
  function verifyInputs() {
    for (const [inputName, input] of Object.entries(inputs)) {
      if (!optionalInputNames.has(inputName) && !input.value) {
        return false;
      }
    }
    return true;
  }

  /** Reads inputs as chart-formatted object */
  function readInputs(warnings) {
    const result = {};
    for (const [inputName, input] of Object.entries(inputs)) {
      if (intInputNames.has(inputName)) {
        result[inputMap[inputName]] = toInt(input.value, warnings, inputName);
      } else if (floatInputNames.has(inputName)) {
        result[inputMap[inputName]] = Number(input.value);
      } else if (colorInputNames.has(inputName)) {
        result[inputMap[inputName]] = Color.hexToFloats(input.value);
      } else {
        result[inputMap[inputName]] = input.value;
      }
    }
    return result;
  }

  /** Reads inputs as { startColor, endColor }, both hex codes */
  function readColors() {
    const result = {};
    for (const inputName of colorInputNames) {
      const input = inputs[inputName];
      result[inputName] = input.value;
    }
    return {
      startColor: result.notestartcolor,
      endColor: result.noteendcolor,
    };
  }

  /** Writes inputs from chart-formatted object */
  function writeInputs(obj) {
    for (const [inputName, input] of Object.entries(inputs)) {
      const chartFormatName = inputMap[inputName];
      if (!chartFormatName) continue;
      const value = obj[chartFormatName];
      if (!value) continue;

      if (colorInputNames.has(inputName)) {
        input.value = Color.floatsToHex(value);
      } else {
        input.value = value;
      }
      input.dispatchEvent(new Event("change"));
    }
  }

  /** Converts a string to an number, warning if it's actually a float */
  function toInt(str, warnings, name) {
    const num = Number(str);
    if (num % 1 !== 0) {
      warnings.add("Not a whole number", { field: name, value: num });
    }
    return num;
  }

  Init.register(function () {
    for (const inputName of Object.keys(inputMap)) {
      const input = document.getElementById(inputName);
      if (!input) throw `Could not find input: ${inputName}`;
      inputs[inputName] = input;
    }
  });

  return { inputs, readColors, readInputs, verifyInputs, writeInputs };
})();
