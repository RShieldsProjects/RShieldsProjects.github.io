// Use this by creating functions ux(x,y) and uy(x,y)

const pxPerStream = 10;
const stepSize = 0.1;  // time
const maxSteps = 100000;

window.addEventListener('load', function () {
    if (!ux || !uy) {
        alert('Cannot streamline, define ux(x,y) and uy(x,y)');
    }

    const cvs = document.getElementById('cvs');
    const ctx = cvs.getContext('2d');
    
    ctx.strokeStyle = 'blue';
    
    const height = cvs.height;
    const width = cvs.width;
    
    for (let y0 = height * -0.5; y0 < height * 1.5; y0 += pxPerStream) {
        let x = 0;
        let y = y0;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        for (let i = 0; i < maxSteps; i++) {
            if (y > width) break;
            
            let newX = x + ux(x, y) * stepSize;
            let newY = y + uy(x, y) * stepSize;
            x = newX;
            y = newY;
            
            ctx.lineTo(newX, newY);
        }
        
        ctx.stroke();
    }
});
