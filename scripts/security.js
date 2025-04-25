// Chặn F12 và Ctrl+U
document.addEventListener('keydown', function(e) {
    // Chặn F12
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
    }
    // Chặn Ctrl+U
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
    }
    // Chặn Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
    }
    // Chặn Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }
    // Chặn Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
    }
});

// Chặn click chuột phải
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
});

// Chặn mở DevTools bằng menu
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
    }
});

// Chặn mở DevTools bằng cách kiểm tra kích thước cửa sổ
// let lastWidth = window.innerWidth;
// let lastHeight = window.innerHeight;
// setInterval(function() {
//     if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
//         if (window.innerWidth < lastWidth || window.innerHeight < lastHeight) {
//             window.location.reload();
//         }
//         lastWidth = window.innerWidth;
//         lastHeight = window.innerHeight;
//     }
// }, 1000);
