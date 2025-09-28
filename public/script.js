const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('start-btn');

const gridSize = 20;
const gridWidth = canvas.width / gridSize;
const gridHeight = canvas.height / gridSize;

let snake = [];
let food = null;
let specialFood = null;
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameSpeed = 150;
let gameInterval;
let gameRunning = false;

// Variabel untuk animasi
let particles = [];
let foodPulse = 0;
let foodPulseDirection = 1;

// Variabel untuk gambar pemain
let playerAvatar = null;

// Probabilitas makanan spesial dan poin
const SPECIAL_FOOD_PROBABILITY = 0.15; // 15% chance
const MIN_SPECIAL_POINTS = 30;
const MAX_SPECIAL_POINTS = 100;

// Kelas untuk partikel efek
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.alpha = 1;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= 0.02;
        this.size -= 0.05;
    }
    
    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Efek background dinamis (bintang-bintang)
const stars = Array(100).fill().map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2,
    speed: Math.random() * 0.2
}));

function drawBackground() {
    // Gambar bintang-bintang
    ctx.fillStyle = '#334155';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        ctx.fill();
    });
}

function initGame() {
    snake = [
        {x: Math.floor(gridWidth / 2), y: Math.floor(gridHeight / 2)}
    ];
    generateFood();
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = `Skor: ${score}`;
    gameSpeed = 150;
}

function generateFood() {
    // Tentukan apakah akan membuat makanan spesial
    if (playerAvatar && Math.random() < SPECIAL_FOOD_PROBABILITY) {
        specialFood = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight),
            points: Math.floor(Math.random() * (MAX_SPECIAL_POINTS - MIN_SPECIAL_POINTS + 1)) + MIN_SPECIAL_POINTS,
            spawnTime: Date.now()
        };
        
        // Pastikan tidak bertumpuk dengan ular
        for (let segment of snake) {
            if (segment.x === specialFood.x && segment.y === specialFood.y) {
                return generateFood();
            }
        }
        
        // Kosongkan makanan biasa
        food = null;
    } else {
        // Generate makanan biasa
        food = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight)
        };
        
        // Pastikan tidak bertumpuk dengan ular
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                return generateFood();
            }
        }
        
        // Kosongkan makanan spesial
        specialFood = null;
    }
}

function draw() {
    // Bersihkan canvas dengan efek fade
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Gambar background bintang
    drawBackground();
    
    // Gambar makanan biasa (jika ada)
    if (food) {
        // Animasi makanan berdenyut
        foodPulse += 0.05 * foodPulseDirection;
        if (foodPulse > 1) foodPulseDirection = -1;
        if (foodPulse < 0.5) foodPulseDirection = 1;
        
        const pulseSize = gridSize * (1 + foodPulse * 0.2);
        const pulseOffset = (gridSize - pulseSize) / 2;
        
        // Gambar makanan dengan efek denyut
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(
            food.x * gridSize + gridSize/2,
            food.y * gridSize + gridSize/2,
            pulseSize/2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Gambar efek glow pada makanan
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
    
    // Gambar makanan spesial (jika ada)
    if (specialFood && playerAvatar) {
        const posX = specialFood.x * gridSize;
        const posY = specialFood.y * gridSize;
        
        // Efek animasi berdenyut
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
        const size = gridSize * pulse;
        const offset = (gridSize - size) / 2;
        
        // Gambar lingkaran latar
        ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.beginPath();
        ctx.arc(
            posX + gridSize/2,
            posY + gridSize/2,
            size/2 + 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Gambar gambar pemain
        ctx.drawImage(
            playerAvatar,
            posX + offset,
            posY + offset,
            size,
            size
        );
        
        // Gambar efek glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f59e0b';
        ctx.drawImage(
            playerAvatar,
            posX + offset,
            posY + offset,
            size,
            size
        );
        ctx.shadowBlur = 0;
        
        // Gambar poin
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${specialFood.points}`, 
            posX + gridSize/2, 
            posY + gridSize + 15
        );
    }
    
    // Gambar ular dengan efek gradient
    snake.forEach((segment, index) => {
        const posX = segment.x * gridSize;
        const posY = segment.y * gridSize;
        
        // Buat gradient untuk tubuh ular
        const gradient = ctx.createLinearGradient(
            posX, posY, 
            posX + gridSize, posY + gridSize
        );
        
        if (index === 0) {
            // Gradient untuk kepala
            gradient.addColorStop(0, '#4ade80');
            gradient.addColorStop(1, '#22c55e');
        } else {
            // Gradient untuk tubuh
            gradient.addColorStop(0, '#22c55e');
            gradient.addColorStop(1, '#16a34a');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(posX, posY, gridSize, gridSize);
        
        // Gambar border
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(posX, posY, gridSize, gridSize);
        
        // Gambar mata di kepala
        if (index === 0) {
            ctx.fillStyle = '#0f172a';
            const eyeSize = gridSize / 5;
            
            if (direction === 'right') {
                ctx.fillRect(posX + gridSize * 0.7, posY + gridSize * 0.2, eyeSize, eyeSize);
                ctx.fillRect(posX + gridSize * 0.7, posY + gridSize * 0.6, eyeSize, eyeSize);
            } else if (direction === 'left') {
                ctx.fillRect(posX + gridSize * 0.2, posY + gridSize * 0.2, eyeSize, eyeSize);
                ctx.fillRect(posX + gridSize * 0.2, posY + gridSize * 0.6, eyeSize, eyeSize);
            } else if (direction === 'up') {
                ctx.fillRect(posX + gridSize * 0.2, posY + gridSize * 0.2, eyeSize, eyeSize);
                ctx.fillRect(posX + gridSize * 0.6, posY + gridSize * 0.2, eyeSize, eyeSize);
            } else if (direction === 'down') {
                ctx.fillRect(posX + gridSize * 0.2, posY + gridSize * 0.7, eyeSize, eyeSize);
                ctx.fillRect(posX + gridSize * 0.6, posY + gridSize * 0.7, eyeSize, eyeSize);
            }
        }
    });
    
    // Gambar partikel efek
    particles.forEach((particle, index) => {
        particle.update();
        particle.draw();
        
        if (particle.alpha <= 0 || particle.size <= 0) {
            particles.splice(index, 1);
        }
    });
}

function update() {
    direction = nextDirection;
    
    // Hitung posisi kepala baru
    const head = {x: snake[0].x, y: snake[0].y};
    
    switch (direction) {
        case 'right': head.x++; break;
        case 'left': head.x--; break;
        case 'up': head.y--; break;
        case 'down': head.y++; break;
    }
    
    // Cek tabrakan dengan dinding (keluar masuk sisi lain)
    if (head.x >= gridWidth) head.x = 0;
    else if (head.x < 0) head.x = gridWidth - 1;
    if (head.y >= gridHeight) head.y = 0;
    else if (head.y < 0) head.y = gridHeight - 1;
    
    // Cek tabrakan dengan diri sendiri
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // Tambahkan kepala baru
    snake.unshift(head);
    
    // Cek apakah makan makanan biasa
    if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = `Skor: ${score}`;
        
        // Buat efek partikel saat makan
        for (let i = 0; i < 20; i++) {
            particles.push(new Particle(
                food.x * gridSize + gridSize/2,
                food.y * gridSize + gridSize/2,
                '#ef4444'
            ));
        }
        
        // Tingkatkan kecepatan setiap 30 poin
        if (score % 30 === 0) {
            gameSpeed = Math.max(50, gameSpeed - 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        generateFood();
        foodPulse = 0; // Reset animasi makanan
    }
    // Cek apakah makan makanan spesial
    else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        score += specialFood.points;
        scoreElement.textContent = `Skor: ${score}`;
        
        // Buat efek partikel spesial
        for (let i = 0; i < 30; i++) {
            particles.push(new Particle(
                specialFood.x * gridSize + gridSize/2,
                specialFood.y * gridSize + gridSize/2,
                '#f59e0b' // Warna kuning untuk efek spesial
            ));
        }
        
        // Tingkatkan kecepatan (jika mau)
        if (score % 30 === 0) {
            gameSpeed = Math.max(50, gameSpeed - 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        generateFood();
        foodPulse = 0;
    } else {
        // Hapus ekor jika tidak makan
        snake.pop();
    }
}

function gameLoop() {
    update();
    draw();
}

function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    startButton.textContent = 'Main Lagi';
    
    // Tampilkan pesan game over
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ef4444';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px Arial';
    ctx.fillText(`Skor Akhir: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
}

// Kontrol keyboard
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch (e.key) {
        case 'ArrowUp':
            if (direction !== 'down') nextDirection = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') nextDirection = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') nextDirection = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') nextDirection = 'right';
            break;
    }
});

// Tombol mulai
startButton.addEventListener('click', () => {
    if (gameRunning) return;
    
    initGame();
    gameRunning = true;
    startButton.textContent = 'Sedang Bermain';
    gameInterval = setInterval(gameLoop, gameSpeed);
});

// Handle upload gambar pemain
document.getElementById('avatar-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            playerAvatar = new Image();
            playerAvatar.src = event.target.result;
            
            // Tampilkan preview
            const preview = document.getElementById('avatar-preview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Avatar Anda">`;
            
            // Simpan di localStorage
            localStorage.setItem('playerAvatar', event.target.result);
        };
        reader.readAsDataURL(file);
    }
});

// Cek apakah ada avatar yang disimpan
window.onload = function() {
    const savedAvatar = localStorage.getItem('playerAvatar');
    if (savedAvatar) {
        playerAvatar = new Image();
        playerAvatar.src = savedAvatar;
        
        // Tampilkan preview
        const preview = document.getElementById('avatar-preview');
        preview.innerHTML = `<img src="${savedAvatar}" alt="Avatar Anda">`;
    }
    
    // Inisialisasi awal
    initGame();
    draw();
};
