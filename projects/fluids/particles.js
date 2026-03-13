// Use this by creating functions ux(x,y) and uy(x,y)

let cvs;
let ctx;

const timeStep = 1;

let particles = [];

window.addEventListener('load', function () {
    if (!ux || !uy) {
        alert('Cannot vectorfield, define ux(x,y) and uy(x,y)');
        return;
    }

    cvs = document.getElementById('cvs');
    ctx = cvs.getContext('2d');
    
    draw();
});

function draw() {
    ctx.clearRect(0, 0, cvs.width, cvs.height);
    
    if (doFrame) doFrame(cvs, ctx);
    
    for (const particle of particles) {
        const {x, y} = particle;
        
        let newX = x + ux(x, y) * timeStep;
        let newY = y + uy(x, y) * timeStep;
        particle.x = newX;
        particle.y = newY;
        
        const squarespeed = (newX - x)**2 + (newY - y)**2;
        
        ctx.strokeStyle = `hsl(${240 - 30 * squarespeed}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(newX, newY, 1, 0, 3.1415926 * 2);
        ctx.moveTo(newX, newY);
        ctx.lineTo(newX + (x - newX) * 10, newY + (y - newY) * 10);
        ctx.stroke();
    }
    
    particles = particles.filter(p => p.y < cvs.width);
    
    for (let i = 0; i < 2; i++)
        particles.push({ x: 0, y: (Math.random() * 2 - 0.5) * cvs.height });
    
    window.requestAnimationFrame(draw);
}
