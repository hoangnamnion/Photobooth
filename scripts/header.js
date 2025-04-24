document.getElementById('app-logo').addEventListener('click', () => {
    window.location.href = '/';
  });
  
  // Hàm toggle hiển thị/ẩn menu mobile
  function toggleMobileMenu() {
    const menu = document.getElementById('header-button-container');
    menu.classList.toggle('active');
  }
  
  document.getElementById('mobile-menu-toggle').addEventListener('click', toggleMobileMenu);
  document.getElementById('close-menu').addEventListener('click', toggleMobileMenu);
  
  // Thay đổi background header và fill của svg khi scroll
  window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    const svgIcon = document.querySelector('.mobile-menu-button svg');
    
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        if (svgIcon) {
            svgIcon.style.fill = '#fff';
        }
    } else {
        header.style.backgroundColor = 'transparent';
        if (svgIcon) {
            svgIcon.style.fill = '#333';
        }
    }
  });