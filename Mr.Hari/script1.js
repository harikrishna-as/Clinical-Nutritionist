document.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const eyes = document.querySelectorAll('.eye');
    
    // Check if the password field is in focus
    const passwordField = document.querySelector('input[type="password"]');
    const isPasswordFocused = document.activeElement === passwordField;
    
    if (isPasswordFocused) {
        // Both eyes look away (to the left) when password field is in focus
        eyes.forEach(eye => {
            // Make both eyes look to the left and slightly down
            eye.style.transform = `translate(-4px, -2px)`;
        });
    } else {
        // Normal eye tracking when password field is not in focus
        eyes.forEach(eye => {
            const eyeRect = eye.getBoundingClientRect();
            const eyeX = eyeRect.left + eyeRect.width / 2;
            const eyeY = eyeRect.top + eyeRect.height / 2;

            const dx = mouseX - eyeX;
            const dy = mouseY - eyeY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const maxMovement = 3;
            const moveDistance = Math.min(maxMovement, distance);
            const angle = Math.atan2(dy, dx);

            const moveX = Math.cos(angle) * moveDistance;
            const moveY = Math.sin(angle) * moveDistance;

            eye.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    }
});

// Add event listeners for password field focus/blur
document.addEventListener('DOMContentLoaded', function() {
    const passwordField = document.querySelector('input[type="password"]');
    
    passwordField.addEventListener('focus', function() {
        // This will trigger the look-away behavior when focus occurs
    });
    
    passwordField.addEventListener('blur', function() {
        // This will allow eyes to return to normal when focus is lost
    });
});

// Loading animation code (unchanged)
var loader;
function loadNow(opacity){
    if(opacity<=0){
        displayContent();
    }
    else{
        loader.style.opacity = opacity;
        window.setTimeout(function(){
            loadNow(opacity - 0.5)
        },100);
    }
}
function displayContent(){
    loader.style.display = 'none';
    document.getElementById('content').style.display = 'block';
}
document.addEventListener("DOMContentLoaded",function(){
    loader = document.getElementById('loader');
    loadNow(0.1);
});