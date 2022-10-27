const inits = [];

/** Registers a function which will be called when the page finishes loading */
function registerInit(fn) {
    inits.push(fn);
}

/** Called when the page finishes loading */
function init() {
    for (const fn of inits) {
        fn();
    }
}
