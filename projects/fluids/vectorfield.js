// Use this by creating functions ux(x,y) and uy(x,y)

const resolution = 40;
const scale = 10;

window.addEventListener('load', function () {
    if (!ux || !uy) {
        alert('Cannot vectorfield, define ux(x,y) and uy(x,y)');
    }

    const cvs = document.getElementById('cvs');
    const ctx = cvs.getContext('2d');
    
    ctx.strokeStyle = 'blue';
    
    const height = cvs.height;
    const width = cvs.width;
    
    for (let x = resolution / 2; x < width; x += resolution) {
    for (let y = resolution / 2; y < height; y += resolution) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 3.1415926 * 2);
        ctx.moveTo(x, y);
        
        let newX = x + ux(x, y) * scale;
        let newY = y + uy(x, y) * scale;
        ctx.lineTo(newX, newY);
        
        ctx.stroke();
    }
    }
});
