// DOM Elements
const cameraView = document.getElementById("camera-view");
const countdown = document.getElementById("countdown");
const gallery = document.getElementById("gallery");
const captureBtn = document.getElementById("capture-btn");
const multiBtn = document.getElementById("multi-btn");
const filterOptions = document.querySelectorAll(".filter-option");

// Global Variables
let currentFilter = "none";
let stream = null;

// Initialize Camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 }, 
                height: { ideal: 720 }, 
                facingMode: "user" 
            }, 
            audio: false 
        });
        cameraView.srcObject = stream;
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập!");
    }
}

// Countdown Timer
function startCountdown(seconds = 3, callback) {
    countdown.style.display = "block";
    let counter = seconds;
    countdown.textContent = counter;
    
    const timer = setInterval(() => {
        counter--;
        countdown.textContent = counter;
        
        if (counter <= 0) {
            clearInterval(timer);
            countdown.style.display = "none";
            if (callback) callback();
        }
    }, 1000);
}

// Capture Photo
function capturePhoto() {
    const canvas = document.createElement("canvas");
    canvas.width = cameraView.videoWidth;
    canvas.height = cameraView.videoHeight;
    const ctx = canvas.getContext("2d");
    
    // Apply filter and capture
    ctx.filter = currentFilter;
    ctx.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
    
    // Create photo element
    const photo = new Image();
    photo.src = canvas.toDataURL("image/png");
    photo.className = "photo-item";
    photo.alt = "Photobooth image";
    
    // Add download functionality
    photo.addEventListener("click", () => {
        const link = document.createElement("a");
        link.href = photo.src;
        link.download = `photobooth_${new Date().getTime()}.png`;
        link.click();
    });
    
    gallery.appendChild(photo);
}

// Take Multiple Photos
function takeMultiPhotos(total = 4, interval = 3000) {
    let count = 0;
    const photoInterval = setInterval(() => {
        startCountdown(2, () => {
            capturePhoto();
            count++;
            if (count >= total) clearInterval(photoInterval);
        });
    }, interval);
}

// Apply Filter
function applyFilter(filter) {
    currentFilter = filter;
    cameraView.style.filter = filter;
    
    // Update active state
    filterOptions.forEach(option => {
        option.classList.toggle("active", option.dataset.filter === filter);
    });
}

// Event Listeners
captureBtn.addEventListener("click", () => startCountdown(3, capturePhoto));
multiBtn.addEventListener("click", () => takeMultiPhotos(4));

filterOptions.forEach(option => {
    option.addEventListener("click", () => {
        applyFilter(option.dataset.filter);
    });
});

// Initialize App
window.addEventListener("DOMContentLoaded", initCamera);

// Clean up camera stream when leaving
window.addEventListener("beforeunload", () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});
