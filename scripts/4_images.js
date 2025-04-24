// Lấy tham chiếu các phần tử DOM
const video = document.getElementById("video");
const captureBtn = document.getElementById("captureBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadInput = document.getElementById("uploadInput");
const exportBtn = document.getElementById("exportBtn");
const exportVideoBtn = document.getElementById("exportVideoBtn");
const previewImagesContainer = document.getElementById("previewImages");
const countdownEl = document.getElementById("countdown");
const spinner = document.getElementById("spinner");
const captureSound = document.getElementById("captureSound");
const captureTimeSelect = document.getElementById("captureTime");
const flipCamBtn = document.getElementById("flipCamBtn");
const switchCamBtn = document.getElementById("switchCamBtn");

// Tham chiếu chọn frame
const frameOptions = document.querySelectorAll("#frameOptions img");

// Modal elements
const videoExportModal = document.getElementById("videoExportModal");
const currentBalanceEl = document.getElementById("currentBalance");
const youtubeSignupBtn = document.getElementById("youtubeSignupBtn");
const hihiBtn = document.getElementById("hihiBtn");
const rechargeBtn = document.getElementById("rechargeBtn");
const confirmExportBtn = document.getElementById("confirmExportBtn");
const cancelExportBtn = document.getElementById("cancelExportBtn");

// Canvas preview
const templatePreviewCanvas = document.getElementById("templatePreview");
const previewCtx = templatePreviewCanvas.getContext("2d");

let userBalance = Number(document.getElementById('h1Balance').getAttribute("data-balance"));

// Mảng lưu ảnh và video; đối với ảnh upload, videoSegments sẽ chứa giá trị null
let photoData = [];
let videoSegments = [];

let mediaRecorder;
let recordedChunks = [];

// Quản lý flip và facing mode
let isFlipped = true;
let currentFacingMode = "user";

// Frame được chọn
let selectedFrameUrl = document.querySelector("#frameOptions img.selected").getAttribute("data-frame-url");

// Xử lý chọn frame
frameOptions.forEach(frameEl => {
  frameEl.addEventListener("click", () => {
    frameOptions.forEach(el => el.classList.remove("selected"));
    frameEl.classList.add("selected");
    selectedFrameUrl = frameEl.getAttribute("data-frame-url");
    updateTemplatePreview();
  });
});

// Hàm khởi tạo stream
async function startStream() {
  // 1. Tắt stream cũ
  if (window.stream) window.stream.getTracks().forEach(t => t.stop());

  // 2. Độ phân giải từ cao → thấp
  const RES_LEVELS = [
    { w: 4096, h: 2160 },  // 4K DCI
    { w: 3840, h: 2160 },  // 4K UHD
    { w: 2560, h: 1440 },  // QHD
    { w: 1920, h: 1080 },  // Full‑HD
    { w: 1280, h: 720  },  // HD
    { w: 640 , h: 480  }   // VGA
  ];

  let stream  = null;
  let lastErr = null;

  for (const { w, h } of RES_LEVELS) {
    const constraints = {
      video: {
        width :  { ideal: w },
        height:  { ideal: h },
        facingMode: currentFacingMode       // "user" | "environment"
      },
      audio: false
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`> Đã mở camera ở ${w}×${h}`);
      break; // thành công
    } catch (err) {
      lastErr = err;

      /*  Nếu lỗi do thông số vượt quá khả năng (Overconstrained) **hoặc**
          lỗi khởi tạo nguồn (NotReadable) -> thử mức thấp hơn.
          Các lỗi khác (NotAllowed, NotFound...) -> dừng ngay.            */
      if (err.name === 'OverconstrainedError' || err.name === 'NotReadableError') {
        console.warn(`Không dùng được ${w}×${h}:`, err.name);
        continue; // thử độ phân giải tiếp theo
      }
      break;
    }
  }

  if (!stream) {
    console.error('Không thể truy cập camera:', lastErr);
    alert('Không truy cập được camera. Vui lòng kiểm tra:\n'
        + '• Quyền truy cập camera (biểu tượng ổ khóa trên thanh địa chỉ)\n'
        + '• Đảm bảo camera không bị ứng dụng khác sử dụng.');
    return;
  }

  /* ---------- hiển thị & khởi tạo MediaRecorder ---------- */
  window.stream      = stream;
  video.srcObject    = stream;
  video.style.transform = isFlipped ? 'scaleX(-1)' : 'scaleX(1)';

  let options = { mimeType: 'video/webm' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = MediaRecorder.isTypeSupported('video/mp4') ? { mimeType: 'video/mp4' } : {};
  }
  try {
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = e => {
      if (e.data && e.data.size) recordedChunks.push(e.data);
    };
  } catch (e) {
    console.error('Lỗi tạo MediaRecorder:', e);
  }
}

startStream();   // gọi lần đầu

// Nút Lật Cam
flipCamBtn.addEventListener("click", () => {
  isFlipped = !isFlipped;
  video.style.transform = isFlipped ? "scaleX(-1)" : "scaleX(1)";
});

// Nút Đổi Cam
switchCamBtn.addEventListener("click", () => {
  currentFacingMode = (currentFacingMode === "user") ? "environment" : "user";
  startStream();
});

// Xử lý upload ảnh
uploadBtn.addEventListener("click", () => {
  uploadInput.click();
});

uploadInput.addEventListener("change", event => {
  const files = event.target.files;
  if (files.length) {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataURL = e.target.result;
        // Lưu ảnh vào photoData và thêm null vào videoSegments
        photoData.push(dataURL);
        videoSegments.push(null); // Không có video cho ảnh upload
        // Tạo preview với flag upload
        const wrapper = document.createElement("div");
        wrapper.classList.add("preview-wrapper");
        const imgPreview = document.createElement("img");
        imgPreview.src = dataURL;
        // Gán data-upload="true"
        imgPreview.setAttribute("data-upload", "true");
        // Tạo marker upload
        const marker = document.createElement("div");
        marker.classList.add("upload-marker");
        marker.textContent = "UPLOAD";
        wrapper.appendChild(imgPreview);
        wrapper.appendChild(marker);
        // Gán sự kiện click cho wrapper để chọn/deselect
        wrapper.addEventListener("click", function () {
          wrapper.classList.toggle("selected");
          // Lưu ý: các ảnh upload không cần xuất video nên khi updateTemplatePreview chỉ cần dùng src
          updateTemplatePreview();
        });
        previewImagesContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
    // Reset input sau khi đọc xong
    uploadInput.value = "";
  }
});

// Hàm capture từ camera
function capturePhotoCover() {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    alert("Video chưa sẵn sàng, hãy thử lại sau vài giây.");
    return null;
  }

  // Phát âm thanh chụp ảnh
  if (captureSound) {
    captureSound.currentTime = 0; // Reset âm thanh về đầu
    captureSound.play().catch(e => console.log("Không thể phát âm thanh:", e));
  }

  const desiredWidth = 500, desiredHeight = 350;
  const desiredAspect = desiredWidth / desiredHeight;
  const videoWidth = video.videoWidth, videoHeight = video.videoHeight;
  const videoAspect = videoWidth / videoHeight;
  let sx, sy, sWidth, sHeight;
  if (videoAspect > desiredAspect) {
    sHeight = videoHeight;
    sWidth = videoHeight * desiredAspect;
    sx = (videoWidth - sWidth) / 2;
    sy = 0;
  } else {
    sWidth = videoWidth;
    sHeight = videoWidth / desiredAspect;
    sx = 0;
    sy = (videoHeight - sHeight) / 2;
  }
  const canvas = document.createElement("canvas");
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  const ctx = canvas.getContext("2d");
  if (isFlipped) {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, desiredWidth, desiredHeight);
    ctx.restore();
  } else {
    ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, desiredWidth, desiredHeight);
  }
  return canvas.toDataURL("image/png");
}

// PHẦN quay video từ camera
let videoRecorderController = null;
function startVideoSegmentRecording() {
  const desiredWidth = 500, desiredHeight = 350;
  const canvas = document.createElement("canvas");
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  const ctx = canvas.getContext("2d");
  let animationFrameId;
  function drawFrame() {
    const videoWidth = video.videoWidth, videoHeight = video.videoHeight;
    if (videoWidth && videoHeight) {
      const desiredAspect = desiredWidth / desiredHeight;
      const videoAspect = videoWidth / videoHeight;
      let sx, sy, sWidth, sHeight;
      if (videoAspect > desiredAspect) {
        sHeight = videoHeight;
        sWidth = videoHeight * desiredAspect;
        sx = (videoWidth - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = videoWidth;
        sHeight = videoWidth / desiredAspect;
        sx = 0;
        sy = (videoHeight - sHeight) / 2;
      }
      if (isFlipped) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, desiredWidth, desiredHeight);
        ctx.restore();
      } else {
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, desiredWidth, desiredHeight);
      }
    }
    animationFrameId = requestAnimationFrame(drawFrame);
  }
  drawFrame();
  const stream = canvas.captureStream(30);
  let recorder, chunks = [];
  let options = { mimeType: "video/webm", videoBitsPerSecond: 300000 };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = MediaRecorder.isTypeSupported("video/mp4") ? { mimeType: "video/mp4", videoBitsPerSecond: 300000 } : { videoBitsPerSecond: 300000 };
  }
  try {
    recorder = new MediaRecorder(stream, options);
  } catch (e) {
    cancelAnimationFrame(animationFrameId);
    console.error("Lỗi tạo MediaRecorder cho video segment:", e);
    return null;
  }
  recorder.ondataavailable = event => {
    if (event.data && event.data.size > 0) { chunks.push(event.data); }
  };
  const stopPromise = new Promise((resolve, reject) => {
    recorder.onstop = () => {
      cancelAnimationFrame(animationFrameId);
      const blob = new Blob(chunks, { type: recorder.mimeType || "video/mp4" });
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    };
    recorder.onerror = reject;
  });
  recorder.start();
  videoRecorderController = { recorder, stopPromise };
}

async function stopVideoSegmentRecording() {
  if (videoRecorderController && videoRecorderController.recorder.state === "recording") {
    videoRecorderController.recorder.stop();
    const videoData = await videoRecorderController.stopPromise;
    videoRecorderController = null;
    return videoData;
  }
  return null;
}

// HIỆU ỨNG FLASH VÀ COUNTDOWN
async function runCountdown(seconds) {
  if (seconds === 0) {
    // Tạo hiệu ứng flash
    const flash = document.createElement('div');
    flash.className = 'flash';
    video.parentNode.appendChild(flash);
    
    // Thêm animation flash
    flash.style.animation = 'flash 0.3s ease-out';
    
    // Xóa flash sau khi animation kết thúc
    setTimeout(() => {
      flash.remove();
    }, 300);
    
    // Phát âm thanh chụp ảnh
    if (captureSound) {
      captureSound.currentTime = 0;
      captureSound.play().catch(e => console.log("Không thể phát âm thanh:", e));
    }
    return;
  }

  for (let i = seconds; i > 0; i--) {
    const circle = document.createElement("div");
    circle.classList.add("countdown-circle");
    circle.textContent = i;
    countdownEl.innerHTML = "";
    countdownEl.appendChild(circle);
    await sleep(1000);
  }
  countdownEl.innerHTML = "";
  
  // Tạo hiệu ứng flash
  const flash = document.createElement('div');
  flash.className = 'flash';
  video.parentNode.appendChild(flash);
  
  // Thêm animation flash
  flash.style.animation = 'flash 0.3s ease-out';
  
  // Xóa flash sau khi animation kết thúc
  setTimeout(() => {
    flash.remove();
  }, 300);
  
  // Phát âm thanh chụp ảnh
  if (captureSound) {
    captureSound.currentTime = 0;
    captureSound.play().catch(e => console.log("Không thể phát âm thanh:", e));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showSpinner(message) {
  spinner.textContent = message;
  spinner.style.display = "flex";
}
function hideSpinner() {
  spinner.style.display = "none";
}
function updateModal() {
  currentBalanceEl.textContent = userBalance;
  confirmExportBtn.disabled = (userBalance < 2000);
}
function hideModal() {
  videoExportModal.style.display = "none";
}
async function refreshBalance() {
  try {
    await window.balanceManager.initializeBalance();
    userBalance = window.balanceManager.getCurrentBalance();
    updateModal();
  } catch (err) {
    console.error("Lỗi cập nhật số dư:", err);
  }
}
setInterval(refreshBalance, 60000);

// Cập nhật canvas preview (chỉ dùng cho xuất ảnh)
function updateTemplatePreview() {
  const selectedImgElems = previewImagesContainer
        .querySelectorAll(".preview-wrapper.selected img, .preview-wrapper.selected > img");

  if (selectedImgElems.length !== 4) {
    previewCtx.clearRect(0, 0, templatePreviewCanvas.width, templatePreviewCanvas.height);
    return;
  }

  const scale           = 0.5;
  const templateWidth   = 600 * scale;
  const templateHeight  = 1800 * scale;
  const padding         = 50  * scale;
  const gap             = 50  * scale;
  const targetW         = 500 * scale;
  const targetH         = 350 * scale;

  templatePreviewCanvas.width  = templateWidth;
  templatePreviewCanvas.height = templateHeight;
  previewCtx.clearRect(0, 0, templateWidth, templateHeight);

  /* ---------- 1. VẼ 4 ẢNH ----------- */
  selectedImgElems.forEach((img, idx) => {
    const x = padding;
    const y = padding + idx * (targetH + gap);

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const iAsp = iw / ih;
    const tAsp = targetW / targetH;
    let sx, sy, sW, sH;

    if (iAsp > tAsp) { // ảnh quá rộng
      sH = ih;
      sW = ih * tAsp;
      sx = (iw - sW) / 2;
      sy = 0;
    } else {           // ảnh quá cao
      sW = iw;
      sH = iw / tAsp;
      sx = 0;
      sy = (ih - sH) / 2;
    }
    previewCtx.drawImage(img, sx, sy, sW, sH, x, y, targetW, targetH);
  });

  /* ---------- 2. VẼ FRAME ĐÈ LÊN ----------- */
  if (selectedFrameUrl) {
    const frameImg = new Image();
    frameImg.onload = () => {
      previewCtx.drawImage(frameImg, 0, 0, templateWidth, templateHeight);
      
      // Thêm ngày chụp
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Thêm hiệu ứng bóng đổ rất nhẹ cho text
      previewCtx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      previewCtx.shadowBlur = 2;
      previewCtx.shadowOffsetX = 1;
      previewCtx.shadowOffsetY = 1;
      
      // Vẽ text với gradient nhẹ
      const gradient = previewCtx.createLinearGradient(0, templateHeight - 30, 0, templateHeight - 15);
      gradient.addColorStop(0, '#555555');
      gradient.addColorStop(1, '#777777');
      previewCtx.fillStyle = gradient;
      
      previewCtx.font = '16px "Segoe UI", Arial, sans-serif';
      previewCtx.textAlign = 'right';
      previewCtx.fillText(dateStr, templateWidth - 25, templateHeight - 15);
      
      // Reset shadow
      previewCtx.shadowColor = 'transparent';
      previewCtx.shadowBlur = 0;
      previewCtx.shadowOffsetX = 0;
      previewCtx.shadowOffsetY = 0;
    };
    frameImg.src = selectedFrameUrl;
  }
}

// Gán sự kiện click cho ảnh preview (cho cả upload và chụp từ camera)
function attachPreviewClick(wrapper) {
  wrapper.addEventListener("click", function () {
    wrapper.classList.toggle("selected");
    updateTemplatePreview();
  });
}

// Hàm tạo preview wrapper với nút xóa
function createPreviewWrapper(photo, index) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("preview-wrapper");
    
    const imgPreview = document.createElement("img");
    imgPreview.src = photo;
    imgPreview.setAttribute("data-index", index);
    
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.innerHTML = "×";
    deleteBtn.addEventListener("click", () => {
        // Xóa ảnh khỏi mảng dữ liệu
        photoData.splice(index, 1);
        videoSegments.splice(index, 1);
        // Xóa wrapper khỏi DOM
        wrapper.remove();
        // Cập nhật lại data-index cho các ảnh còn lại
        const remainingWrappers = previewImagesContainer.querySelectorAll(".preview-wrapper");
        remainingWrappers.forEach((w, i) => {
            w.querySelector("img").setAttribute("data-index", i);
        });
        updateTemplatePreview();
    });
    
    wrapper.appendChild(imgPreview);
    wrapper.appendChild(deleteBtn);
    attachPreviewClick(wrapper);
    return wrapper;
}

// Sự kiện chụp ảnh & quay video từ camera
captureBtn.addEventListener("click", async () => {
    const captureTime = parseInt(captureTimeSelect.value);
    const captureCount = parseInt(document.getElementById("captureCount").value);
    captureBtn.disabled = true;
    
    // Nếu là chế độ chụp luôn (không đếm ngược)
    if (captureTime === 0) {
        startVideoSegmentRecording();
        const photo = capturePhotoCover();
        const videoData = await stopVideoSegmentRecording();
        
        // Thêm ảnh mới vào mảng
        const newIndex = photoData.length;
        photoData.push(photo);
        videoSegments.push(videoData);
        
        // Tạo và thêm wrapper mới
        const wrapper = createPreviewWrapper(photo, newIndex);
        previewImagesContainer.appendChild(wrapper);
    } else {
        // Chế độ có đếm ngược, chụp đủ số lượng ảnh đã chọn
        for (let i = 0; i < captureCount; i++) {
            startVideoSegmentRecording();
            await runCountdown(captureTime);
            const photo = capturePhotoCover();
            const videoData = await stopVideoSegmentRecording();
            
            // Thêm ảnh mới vào mảng
            const newIndex = photoData.length;
            photoData.push(photo);
            videoSegments.push(videoData);
            
            // Tạo và thêm wrapper mới
            const wrapper = createPreviewWrapper(photo, newIndex);
            previewImagesContainer.appendChild(wrapper);
        }
    }
    
    captureBtn.disabled = false;
});

// Hàm ghép ảnh
async function mergeImages(images, frameUrl) {
    return new Promise((resolve, reject) => {
        const scale = 0.5;
        const templateWidth = 600 * scale;
        const templateHeight = 1800 * scale;
        const padding = 50 * scale;
        const gap = 50 * scale;
        const targetW = 500 * scale;
        const targetH = 350 * scale;

        const canvas = document.createElement('canvas');
        canvas.width = templateWidth;
        canvas.height = templateHeight;
        const ctx = canvas.getContext('2d');

        // Vẽ 4 ảnh
        let loadedImages = 0;
        images.forEach((imgSrc, idx) => {
            const img = new Image();
            img.onload = () => {
                const x = padding;
                const y = padding + idx * (targetH + gap);

                const iw = img.naturalWidth;
                const ih = img.naturalHeight;
                const iAsp = iw / ih;
                const tAsp = targetW / targetH;
                let sx, sy, sW, sH;

                if (iAsp > tAsp) {
                    sH = ih;
                    sW = ih * tAsp;
                    sx = (iw - sW) / 2;
                    sy = 0;
                } else {
                    sW = iw;
                    sH = iw / tAsp;
                    sx = 0;
                    sy = (ih - sH) / 2;
                }
                ctx.drawImage(img, sx, sy, sW, sH, x, y, targetW, targetH);

                loadedImages++;
                if (loadedImages === images.length) {
                    // Vẽ frame
                    const frameImg = new Image();
                    frameImg.onload = () => {
                        ctx.drawImage(frameImg, 0, 0, templateWidth, templateHeight);
                        
                        // Thêm ngày chụp
                        const now = new Date();
                        const dateStr = now.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        });
                        
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                        ctx.shadowBlur = 2;
                        ctx.shadowOffsetX = 1;
                        ctx.shadowOffsetY = 1;
                        
                        const gradient = ctx.createLinearGradient(0, templateHeight - 30, 0, templateHeight - 15);
                        gradient.addColorStop(0, '#555555');
                        gradient.addColorStop(1, '#777777');
                        ctx.fillStyle = gradient;
                        
                        ctx.font = '16px "Segoe UI", Arial, sans-serif';
                        ctx.textAlign = 'right';
                        ctx.fillText(dateStr, templateWidth - 25, templateHeight - 15);
                        
                        resolve(canvas.toDataURL('image/png'));
                    };
                    frameImg.src = frameUrl;
                }
            };
            img.onerror = reject;
            img.src = imgSrc;
        });
    });
}

exportBtn.addEventListener("click", async () => {
    const selectedWrappers = previewImagesContainer.querySelectorAll(".preview-wrapper.selected");
    if (selectedWrappers.length !== 4) {
        alert("Bạn phải chọn chính xác 4 ảnh để xuất.");
        return;
    }

    // Lấy danh sách ảnh đã chọn
    const selectedImages = Array.from(selectedWrappers).map(wrapper => 
        wrapper.querySelector("img").src
    );

    if (!selectedFrameUrl) {
        alert("Vui lòng chọn frame trước khi xuất ảnh.");
        return;
    }

    showSpinner("Đang xử lý ảnh...");
    try {
        const mergedImage = await mergeImages(selectedImages, selectedFrameUrl);
        hideSpinner();

        // Tạo link tải ảnh
        const link = document.createElement('a');
        link.href = mergedImage;
        link.download = `photoboothHoangNam-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        hideSpinner();
        console.error("Lỗi khi xuất ảnh:", error);
        alert("Có lỗi xảy ra khi xuất ảnh. Vui lòng thử lại sau.");
    }
});

// Khi xuất video, trước tiên kiểm tra xem có ảnh nào được upload (không có video) không
exportVideoBtn.addEventListener("click", async () => {
  const selectedWrappers = previewImagesContainer.querySelectorAll(".preview-wrapper.selected");
  if (selectedWrappers.length !== 4) {
    alert("Bạn phải chọn chính xác 4 video (qua ảnh preview) để xuất.");
    return;
  }
  // Kiểm tra xem có ảnh nào có thuộc tính data-upload hay không
  const hasUpload = Array.from(selectedWrappers).some(wrapper => {
    const img = wrapper.querySelector("img");
    return img.getAttribute("data-upload") === "true";
  });
  if (hasUpload) {
    alert("Có ảnh được upload không có video. Vui lòng chọn lại hoặc chụp ảnh mới để xuất video.");
    return;
  }
  updateModal();
  videoExportModal.style.display = "flex";
});

confirmExportBtn.addEventListener("click", async () => {
  const selectedWrappers = previewImagesContainer.querySelectorAll(".preview-wrapper.selected");
  let selectedVideos = [];
  for (const wrapper of selectedWrappers) {
    const img = wrapper.querySelector("img");
    const dataIndex = img.getAttribute("data-index");
    if (!dataIndex) {
      alert("Ảnh được upload không có video! Vui lòng chọn lại hoặc chụp ảnh mới để xuất video.");
      return;
    }
    const index = parseInt(dataIndex);
    const videoData = videoSegments[index];
    if (!videoData) {
      alert("Một hoặc nhiều ảnh được chọn không có video! Vui lòng chọn lại hoặc chụp ảnh mới để xuất video.");
      return;
    }
    selectedVideos.push(videoData);
  }
  
  if (!window.balanceManager.hasEnoughBalance(2000)) {
    alert("Số dư không đủ để xuất video!");
    return;
  }
  
  showSpinner("Đang xử lý video...");
  hideModal();
  try {
    const response = await fetch("/photobooth/4-images/upload-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos: selectedVideos }),
    });
    const result = await response.json();
    hideSpinner();
    if (result.mergedVideo) {
      window.balanceManager.deductBalance(2000);
      window.open("/preview?type=video&data=" + encodeURIComponent(result.mergedVideo), "_blank");
    } else {
      alert("Lỗi khi ghép video.");
    }
  } catch (error) {
    hideSpinner();
    console.error(error);
    alert("Có lỗi xảy ra khi gửi dữ liệu video.");
  }
});

cancelExportBtn.addEventListener("click", () => {
  hideModal();
});

youtubeSignupBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/photobooth/4-images/youtube-signup", { method: "POST" });
    const result = await response.json();
    if (result.success) {
      window.balanceManager.addBalance(10000);
      window.open("https://www.youtube.com/@meobeodev", "_blank");
      alert("Đăng ký Youtube thành công! Số dư đã được cộng thêm 10000 đồng.");
      updateModal();
    } else {
      alert(result.message || "Có lỗi khi đăng ký Youtube.");
    }
  } catch (error) {
    console.error(error);
    alert("Có lỗi khi đăng ký Youtube.");
  }
});

hihiBtn.addEventListener("click", () => {
  window.open("https://www.facebook.com/meobeodangiuu", "_blank");
});

rechargeBtn.addEventListener("click", () => {
  window.location.href = "/deposit";
});

// Update the captureCount select options
document.getElementById("captureCount").innerHTML = `
  <option value="1" selected>1</option>
  <option value="4">4</option>
  <option value="8">8</option>
`;