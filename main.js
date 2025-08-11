// Game state management
const GameState = {
  HOME: 'home',
  PLAYING: 'playing'
};

class SensorySwipeGame {
  constructor() {
    this.currentState = GameState.HOME;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.trails = [];
    this.currentTrail = null;
    this.isDrawing = false;
    this.lastPoint = null;
    
    // Color palettes for background transitions
    this.backgroundColors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)'
    ];
    
    this.currentBgIndex = 0;
    
    // Particle styles
    this.particleStyles = ['sparkles', 'bubbles', 'stars'];
    
    // Audio setup
    this.audioContext = null;
    this.sounds = [];
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupCanvas();
    this.setupAudio();
    this.startGameLoop();
  }
  
  setupEventListeners() {
    const playButton = document.getElementById('playButton');
    const homeButton = document.getElementById('homeButton');
    
    playButton.addEventListener('click', () => this.startGame());
    homeButton.addEventListener('click', () => this.goHome());
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  setupCanvas() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Touch events
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
    
    // Mouse events for desktop
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
  }
  
  setupAudio() {
    // Create audio context for better control
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Web Audio API not supported');
    }
    
    // Setup HTML audio elements
    this.swipeSound1 = document.getElementById('swipeSound1');
    this.swipeSound2 = document.getElementById('swipeSound2');
  }
  
  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = window.innerWidth * window.devicePixelRatio;
    this.canvas.height = window.innerHeight * window.devicePixelRatio;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }
  
  startGame() {
    this.currentState = GameState.PLAYING;
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    
    // Resume audio context if needed
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
  
  goHome() {
    this.currentState = GameState.HOME;
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
    
    // Clear canvas and reset state
    this.particles = [];
    this.trails = [];
    this.currentTrail = null;
    this.isDrawing = false;
  }
  
  // Touch event handlers
  handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const point = this.getTouchPoint(touch);
    this.startDrawing(point);
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const point = this.getTouchPoint(touch);
    this.continueDrawing(point);
  }
  
  handleTouchEnd(e) {
    e.preventDefault();
    this.stopDrawing();
  }
  
  // Mouse event handlers for desktop
  handleMouseDown(e) {
    const point = this.getMousePoint(e);
    this.startDrawing(point);
  }
  
  handleMouseMove(e) {
    const point = this.getMousePoint(e);
    this.continueDrawing(point);
  }
  
  handleMouseUp(e) {
    this.stopDrawing();
  }
  
  getTouchPoint(touch) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }
  
  getMousePoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  startDrawing(point) {
    if (this.currentState !== GameState.PLAYING) return;
    
    this.isDrawing = true;
    this.lastPoint = point;
    
    // Generate new random color for this trail
    const color = this.getRandomColor();
    const particleStyle = this.getRandomParticleStyle();
    
    this.currentTrail = {
      points: [point],
      color: color,
      style: particleStyle,
      startTime: Date.now()
    };
    
    // Play sound
    this.playSwipeSound();
    
    // Change background color
    this.changeBackgroundColor();
  }
  
  continueDrawing(point) {
    if (!this.isDrawing || this.currentState !== GameState.PLAYING) return;
    
    if (this.lastPoint) {
      // Add particles along the line
      this.addParticlesAlongLine(this.lastPoint, point, this.currentTrail.color, this.currentTrail.style);
      this.currentTrail.points.push(point);
    }
    
    this.lastPoint = point;
  }
  
  stopDrawing() {
    if (!this.isDrawing) return;
    
    this.isDrawing = false;
    
    if (this.currentTrail && this.currentTrail.points.length > 1) {
      this.trails.push(this.currentTrail);
    }
    
    this.currentTrail = null;
    this.lastPoint = null;
  }
  
  addParticlesAlongLine(start, end, color, style) {
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const particleCount = Math.max(1, Math.floor(distance / 5));
    
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
      
      // Add some randomness to particle position
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      
      this.particles.push(new Particle(x + offsetX, y + offsetY, color, style));
    }
  }
  
  getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F06292', '#AED581', '#FFB74D',
      '#FF8A65', '#BA68C8', '#4FC3F7', '#81C784', '#FFD54F',
      '#F48FB1', '#80DEEA', '#C5E1A5', '#FFCC02', '#CE93D8'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  getRandomParticleStyle() {
    return this.particleStyles[Math.floor(Math.random() * this.particleStyles.length)];
  }
  
  playSwipeSound() {
    try {
      // Randomly choose between the two sounds
      const sound = Math.random() > 0.5 ? this.swipeSound1 : this.swipeSound2;
      if (sound) {
        sound.currentTime = 0;
        sound.volume = 0.3;
        sound.play();
      }
    } catch (e) {
      console.log('Could not play sound:', e);
    }
  }
  
  changeBackgroundColor() {
    this.currentBgIndex = (this.currentBgIndex + 1) % this.backgroundColors.length;
    const gameScreen = document.getElementById('gameScreen');
    gameScreen.style.background = this.backgroundColors[this.currentBgIndex];
  }
  
  startGameLoop() {
    const gameLoop = () => {
      this.update();
      this.render();
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);
  }
  
  update() {
    if (this.currentState !== GameState.PLAYING) return;
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.update();
      
      if (particle.isDead()) {
        this.particles.splice(i, 1);
      }
    }
    
    // Remove old trails (after 5 seconds)
    const currentTime = Date.now();
    this.trails = this.trails.filter(trail => currentTime - trail.startTime < 5000);
  }
  
  render() {
    if (this.currentState !== GameState.PLAYING) return;
    
    // Clear canvas with slight transparency for trailing effect
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Render particles
    this.particles.forEach(particle => particle.render(this.ctx));
  }
}

// Particle class
class Particle {
  constructor(x, y, color, style) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.color = color;
    this.style = style;
    
    // Random velocity
    this.vx = (Math.random() - 0.5) * 2;
    this.vy = (Math.random() - 0.5) * 2;
    
    // Lifecycle
    this.life = 1.0;
    this.decay = 0.02 + Math.random() * 0.02;
    
    // Size
    this.size = 2 + Math.random() * 4;
    this.originalSize = this.size;
    
    // Style-specific properties
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
  }
  
  update() {
    // Update position with slight drift
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= 0.98;
    this.vy *= 0.98;
    
    // Update lifecycle
    this.life -= this.decay;
    this.size = this.originalSize * this.life;
    
    // Update rotation
    this.rotation += this.rotationSpeed;
  }
  
  render(ctx) {
    if (this.life <= 0) return;
    
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    switch (this.style) {
      case 'sparkles':
        this.renderSparkle(ctx);
        break;
      case 'bubbles':
        this.renderBubble(ctx);
        break;
      case 'stars':
        this.renderStar(ctx);
        break;
    }
    
    ctx.restore();
  }
  
  renderSparkle(ctx) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add sparkle lines
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-this.size, 0);
    ctx.lineTo(this.size, 0);
    ctx.moveTo(0, -this.size);
    ctx.lineTo(0, this.size);
    ctx.stroke();
  }
  
  renderBubble(ctx) {
    // Outer circle
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner highlight
    const gradient = ctx.createRadialGradient(-this.size * 0.3, -this.size * 0.3, 0, 0, 0, this.size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  renderStar(ctx) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = this.size;
    const innerRadius = this.size * 0.5;
    
    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i * Math.PI) / spikes;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new SensorySwipeGame();
});