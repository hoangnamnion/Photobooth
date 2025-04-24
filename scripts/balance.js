// Balance management for photobooth features
let userBalance = 2000;

// Function to initialize balance from server
async function initializeBalance() {
    try {
        const response = await fetch('/photobooth/balance');
        const data = await response.json();
        userBalance = data.balance;
        updateBalanceDisplay();
    } catch (error) {
        console.error('Error fetching balance:', error);
    }
}

// Function to update balance display
function updateBalanceDisplay() {
    const balanceElement = document.getElementById('h1Balance');
    if (balanceElement) {
        balanceElement.setAttribute('data-balance', userBalance);
        balanceElement.textContent = `Số dư: ${userBalance.toLocaleString()} đồng`;
    }
}

// Function to check if user has enough balance
function hasEnoughBalance(amount) {
    return userBalance >= amount;
}

// Function to deduct balance
function deductBalance(amount) {
    if (hasEnoughBalance(amount)) {
        userBalance -= amount;
        updateBalanceDisplay();
        return true;
    }
    return false;
}

// Function to add balance
function addBalance(amount) {
    userBalance += amount;
    updateBalanceDisplay();
}

// Function to get current balance
function getCurrentBalance() {
    return userBalance;
}

// Initialize balance when page loads
document.addEventListener('DOMContentLoaded', initializeBalance);

// Export functions for use in other files
window.balanceManager = {
    initializeBalance,
    updateBalanceDisplay,
    hasEnoughBalance,
    deductBalance,
    addBalance,
    getCurrentBalance
}; 