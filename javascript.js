// Thêm filter màu (ví dụ: đen trắng)
function applyFilter() {
    const photos = document.querySelectorAll(".photo");
    photos.forEach(photo => {
        photo.style.filter = "grayscale(100%)";
    });
}
