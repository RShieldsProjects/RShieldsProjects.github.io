var settings = {};

var settingsArr = ['clamppitch', 'snap'];

function getSetting(name) {
    switch (name) {
        case 'clamppitch': return settings['clamppitch'].checked;
        case 'snap': return Number(settings['snap'].value);
        default: throw `Unknown setting: ${name}`;
    }
}

registerInit(function() {
    for (const settingName of settingsArr) {
        const setting = document.getElementById(settingName);
        if (!setting) throw `Could not find setting: ${settingName}`
        settings[settingName] = setting;
    }
});
