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
