class PhotoboothApp {
    constructor() {
        this.cameraView = document.getElementById('camera-view');
        this.countdown = document.getElementById('countdown');
        this.gallery = document.getElementById('gallery');
        this.captureBtn = document.getElementById('capture-btn');
        this.multiBtn = document.getElementById('multi-btn');
        this.switchBtn = document.getElementById('switch-camera');
        this.cameraStatus = document.getElementById('camera-status');
        this.errorDisplay = document.getElementById('camera-error');
        this.loadingScreen = document.getElementById('loading');
        this.filterOptions = document.querySelectorAll('.filter-option');
        
        this.stream = null;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.currentFilter = 'none';
        
        this.init();
    }

    async init() {
        try {
            await this.detectCameras();
            await this.initCamera();
            this.setupEventListeners();
            this.loadingScreen.classList.add('hidden');
        } catch (error) {
            this.showError(`Khởi động thất bại: ${error.message}`);
            this.loadingScreen.querySelector('p').textContent = 'Không thể khởi động camera';
        }
    }

    async detectCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            
            if (this.cameras.length === 0) {
                throw new Error('Không tìm thấy camera nào');
            }
        } catch (error) {
            throw new Error(`Lỗi phát hiện camera: ${error.message}`);
        }
    }

    async initCamera() {
        try {
            // Dừng stream hiện tại nếu có
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            const constraints = {
                video: {
                    deviceId: this.cameras[this.currentCameraIndex].deviceId 
                        ? { exact: this.cameras[this.currentCameraIndex].deviceId }
                        : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.cameraView.srcObject = this.stream;
            this.updateCameraUI();
        } catch (error) {
            throw new Error(`Không thể khởi động camera: ${error.message}`);
        }
    }

    updateCameraUI() {
        if (this.cameras.length > 0) {
            const currentCamera = this.cameras[this.currentCameraIndex];
            const label = currentCamera.label.toLowerCase();
            
            if (label.includes('back') || label.includes('rear')) {
                this.cameraStatus.textContent = 'Camera sau';
            } else if (label.includes('front') || label.includes('face')) {
                this.cameraStatus.textContent = 'Camera trước';
            } else {
                this.cameraStatus.textContent = `Camera ${this.currentCameraIndex + 1}`;
            }
        }
        
        this.switchBtn.disabled = this.cameras.length <= 1;
    }

    startCountdown(seconds = 3) {
        return new Promise((resolve) => {
            let counter = seconds;
            this.countdown.textContent = counter;
            this.countdown.style.display = 'block';
            
            const timer = setInterval(() => {
                counter--;
                this.countdown.textContent = counter;
                
                if (counter <= 0) {
                    clearInterval(timer);
                    this.countdown.style.display = 'none';
                    resolve();
                }
            }, 1000);
        });
    }

    async capturePhoto() {
        try {
            await this.startCountdown();
            
            const canvas = document.createElement('canvas');
            canvas.width = this.cameraView.videoWidth;
            canvas.height = this.cameraView.videoHeight;
            const ctx = canvas.getContext('2d');
            
            // Áp dụng filter
            ctx.filter = this.currentFilter;
            ctx.drawImage(this.cameraView, 0, 0, canvas.width, canvas.height);
            
            this.addPhotoToGallery(canvas.toDataURL('image/png'));
        } catch (error) {
            this.showError(`Lỗi chụp ảnh: ${error.message}`);
        }
    }

    async takeMultiPhotos(count = 4, interval = 3000) {
        for (let i = 0; i < count; i++) {
            await this.capturePhoto();
            if (i < count - 1) await this.delay(interval);
        }
    }

    addPhotoToGallery(photoUrl) {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-container';
        
        const img = new Image();
        img.src = photoUrl;
        img.className = 'photo-item';
        img.alt = 'Ảnh Photobooth';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.innerHTML = '⬇️ Tải về';
        downloadBtn.onclick = () => this.downloadPhoto(photoUrl);
        
        photoItem.appendChild(img);
        photoItem.appendChild(downloadBtn);
        this.gallery.appendChild(photoItem);
    }

    downloadPhoto(photoUrl) {
        const link = document.createElement('a');
        link.href = photoUrl;
        link.download = `photobooth_${new Date().getTime()}.png`;
        link.click();
    }

    switchCamera() {
        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
        this.initCamera();
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        this.cameraView.style.filter = filter;
        
        // Cập nhật UI filter
        this.filterOptions.forEach(option => {
            option.classList.toggle('active', option.dataset.filter === filter);
        });
    }

    showError(message) {
        this.errorDisplay.textContent = message;
        this.errorDisplay.classList.remove('hidden');
        setTimeout(() => {
            this.errorDisplay.classList.add('hidden');
        }, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupEventListeners() {
        this.captureBtn.addEventListener('click', () => this.capturePhoto());
        this.multiBtn.addEventListener('click', () => this.takeMultiPhotos());
        this.switchBtn.addEventListener('click', () => this.switchCamera());
        
        this.filterOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.applyFilter(option.dataset.filter);
            });
        });
    }
}

// Khởi tạo ứng dụng khi trang tải xong
window.addEventListener('DOMContentLoaded', () => {
    new PhotoboothApp();
});
