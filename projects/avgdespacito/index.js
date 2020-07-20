var worldPop = -1;
var views = -1;

// On load
function avgdespacito() {
    // World Pop data
    var worldPopRequest = new XMLHttpRequest();
    worldPopRequest.open("GET", "https://api.population.io:80/1.0/population/World/today-and-tomorrow/", true);
    worldPopRequest.onreadystatechange = function() {
        //console.log(worldPopRequest)
        if (worldPopRequest.readyState == 4 && worldPopRequest.status == 200) {
            worldPop = JSON.parse(worldPopRequest.responseText).total_population[0].population;
            if (views != -1) {
                updateFront();
            }
        }
    };
    worldPopRequest.send(null);
    
    // Youtube data
    var viewsRequest = new XMLHttpRequest();
    viewsRequest.open("GET", "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=kJQP7kiw5Fk&key=AIzaSyBuIpnxdPViYmARfrMgM9Us79yMOLhlHEk", true);
    viewsRequest.onreadystatechange = function() {
        if (viewsRequest.readyState == 4 && viewsRequest.status == 200) {
            views = JSON.parse(viewsRequest.responseText).items[0].statistics.viewCount;
            if (worldPop != -1) {
                updateFront();
            }
        }
    };
    viewsRequest.send(null);
}

// Calculate
function updateFront() {
    var totalTime = 281 * views / worldPop;
    var minutes = Math.floor(totalTime / 60);
    var seconds = Math.floor(totalTime % 60 * 100) / 100;
    document.getElementById("div1").innerHTML = "<h1>" + minutes + ":" + seconds + "</h1>";
    var percent = Math.floor(views / worldPop * 10000) / 100;
    document.getElementById("div2").innerHTML = "<h1>" + percent + "%</h1>";
}
