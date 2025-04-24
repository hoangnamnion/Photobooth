// Kiểm tra đăng nhập
function checkLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Kiểm tra quyền admin
function checkAdmin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return false;
    }
    
    const userData = JSON.parse(currentUser);
    if (!userData.isAdmin) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Hàm đăng xuất
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login.html';
} 