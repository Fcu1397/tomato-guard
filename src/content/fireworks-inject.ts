(() => {
  const canvasId = 'focus-forge-fireworks-canvas';
  if (document.getElementById(canvasId)) return;

  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '2147483646'; // Just under the overlay
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles: any[] = [];
  let animationFrameId: number;

  const random = (min: number, max: number) => Math.random() * (max - min) + min;

  function createParticle(x: number, y: number) {
    const particleCount = 100;
    const angleStep = (Math.PI * 2) / particleCount;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: x,
        y: y,
        angle: angleStep * i,
        speed: random(1, 10),
        friction: 0.95,
        gravity: 1,
        hue: random(0, 360),
        brightness: random(50, 80),
        alpha: 1,
        decay: random(0.015, 0.03),
      });
    }
  }

  function update() {
    particles.forEach((p, i) => {
      p.speed *= p.friction;
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed + p.gravity;
      p.alpha -= p.decay;
      if (p.alpha <= p.decay) {
        particles.splice(i, 1);
      }
    });
  }

  function draw() {
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';

    particles.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(p.angle) * p.speed, p.y - Math.sin(p.angle) * p.speed);
      ctx.closePath();
      ctx.strokeStyle = `hsla(${p.hue}, 100%, ${p.brightness}%, ${p.alpha})`;
      ctx.stroke();
    });
  }

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    update();
    draw();
  }

  let launchCount = 0;
  const maxLaunches = 5;
  const launchInterval = setInterval(() => {
    createParticle(random(canvas.width * 0.2, canvas.width * 0.8), random(canvas.height * 0.2, canvas.height * 0.8));
    launchCount++;
    if (launchCount >= maxLaunches) {
      clearInterval(launchInterval);
    }
  }, 400);

  setTimeout(() => {
    cancelAnimationFrame(animationFrameId);
    canvas.remove();
  }, 4000);

  animate();
})();
