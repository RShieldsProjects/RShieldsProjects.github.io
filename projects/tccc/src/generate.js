const generateWarnings = new Warnings('generatewarnings')

/** Entrypoint: read the midi, generate the chart, and save it */
async function generate() {
    generateWarnings.clear();

    if (!verifyInputs() || notes.length === 0) {
        alert(
            'Please ensure a valid midi is uploaded and all fields are filled\n' +
            '(Folder Name and Song Endpoint can be empty)'
        );
        return;
    }

    const inputs = readInputs(generateWarnings);

    const chart = {
        ...inputs,
        notes,
        lyrics: [],
        trackRef: inputs.trackRef || `${Math.random()}`,
        endpoint: inputs.endpoint || calculatedEndpoint,
        UNK1: 0,
    }
    generateWarnings.display();
    save(chart);
}

registerInit(function() {
    document.getElementById('generatechart').addEventListener('click', generate);
});
