//META{"name":"rTTS"}*//

class rTTS {
    getName() { return "rTTS"; }
    getShortName() { return "rTTS"; }
    getDescription() { return "A simple text-to-speech application to detect voice channel entry and exit"; }
    getVersion() { return "Septem+"; }
    getAuthor() { return "RShields"; }
    
    //Some necessary functions
    start() {
        // Cache users every few seconds
        setInterval(this.cacheUsers, 10000);
        
        this.userCache = [];
        this.speechTimeout = null;
        this.voices = window.speechSynthesis.getVoices();
        this.defaultSettings = {
            voice: this.voices[0].name,
            volume: 8,
            speed: 1.5,
            pitch: 1.5
        };
        
        this.settings = this.loadSettings();
    }
    load() {}
    unload() {}
    stop() {}
    
    // Settings shamelessly stolen from CreationDate by Natsulus
    getSettingsPanel() {
        const settings = this.loadSettings();
        var html = "<h3>Settings</h3><br>";
        html += "Voice: ";
        html += `<select id="rtts-settings-voice">`;
        for (let i = 0; i < this.voices.length; i++) {
            html += `<option value="`;
            html += this.voices[i].name;
            html += `">`;
            html += this.voices[i].name;
            html += `</option>`;
        }
        html += `</select><br><br>`;
        html += "Volume: ";
        html += `<input id="rtts-settings-volume" type="range" min="0" max="10" value="${settings.volume}"><br><br>`;
        html += "Speed: ";
        html += `<input id="rtts-settings-speed" type="number" value="${settings.speed}"><br><br>`;
        html += "Pitch: ";
        html += `<input id="rtts-settings-pitch" type="number" value="${settings.pitch}"><br><br>`;
        html += `<button id="rtts-settings-reset" onclick="BdApi.getPlugin('rTTS').resetSettings(this)">Reset</button> `;
        html += `<button id="rtts-settings-save" onclick="BdApi.getPlugin('rTTS').saveSettings(this)">Save</button>`;
        
        return html;
    }
    
    resetSettings(button) {
        this.settings = $.extend(true, {}, this.defaultSettings);
        
        document.getElementById("rtts-settings-voice").value = this.settings.voice;
        document.getElementById("rtts-settings-volume").value = this.settings.volume;
        document.getElementById("rtts-settings-speed").value = this.settings.speed;
        document.getElementById("rtts-settings-pitch").value = this.settings.pitch;
        
        bdPluginStorage.set("rTTS", "settings", JSON.stringify(this.settings));
        button.innerHTML = "Settings Reset!";
        setTimeout(function(){button.innerHTML = "Reset";}, 1000);
    }

    saveSettings(button) {
        this.settings.voice = document.getElementById("rtts-settings-voice").value;
        this.settings.volume = document.getElementById("rtts-settings-volume").value;
        this.settings.speed = document.getElementById("rtts-settings-speed").value;
        this.settings.pitch = document.getElementById("rtts-settings-pitch").value;
        
        bdPluginStorage.set("rTTS", "settings", JSON.stringify(this.settings));
        button.innerHTML = "Settings Saved!";
        setTimeout(function(){button.innerHTML = "Save";}, 1000);
    }

    loadSettings() {
        return bdPluginStorage.get("rTTS", "settings") && JSON.parse(bdPluginStorage.get("rTTS", "settings")) || $.extend(true, {}, this.defaultSettings);
    }
    
    //Fun stuff
    observer(e) {
        var prevCache = this.userCache.slice(0);
        this.cacheUsers();
        if (prevCache.length == 0 || this.userCache.length == 0) {
            window.speechSynthesis.cancel();
            return;
        }
        
        if (prevCache.length - this.userCache.length == 1) {
            this.speak( "leave <silence msec=\"250\"/> " + this.fixCamel(this.arrayDiff(prevCache, this.userCache)) );
        } else if (prevCache.length - this.userCache.length == -1) {
            this.speak( "join <silence msec=\"250\"/> " + this.fixCamel(this.arrayDiff(this.userCache, prevCache)) );
        }
    }
    
    speak(t) {
        var speech = new SpeechSynthesisUtterance(t);
        
        for (let i = 0; i < this.voices.length; i++) {
            if (this.voices[i].name == this.settings.voice) {
                speech.voice = this.voice;
                break;
            }
        }
        speech.volume = this.settings.volume / 10.0;
        speech.rate   = this.settings.speed;
        speech.pitch  = this.settings.pitch;
        
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            
            if (this.speechTimeout !== null)
                clearTimeout(this.speechTimeout);
            
            this.speechTimeout = setTimeout(function(){window.speechSynthesis.speak(speech);}, 100);
        } else {
            window.speechSynthesis.speak(speech);
        }
    }
    
    cacheUsers() {
        var userCache = [];
        $("div[class^='wrapperConnectedVoice']").each(function() {
            //var channelName = $(this).text();
            $(this).next().children().each(function() {
                let user = $(this).text();
                userCache.push(user);
            });
        });
        this.userCache = userCache;
    }
    
    arrayDiff(bigArr, smallArr) {
        for (let i = 0; i < bigArr.length; i++) {
            if (smallArr.indexOf(bigArr[i]) == -1) {
                return bigArr[i];
            }
        }
        return null;
    }
    
    fixCamel(str) {
        return str.replace(/([a-z])([A-Z])/g, "$1 $2");
    }
}