const html = document.documentElement;
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const usernameOrEmail = document.getElementById('userInput').value;
    const password = document.getElementById('passInput').value;
    let user = find(usernameOrEmail)
    let nameOrEmail = 'test';
    let pass = 'password';
    if(user != undefined){
        nameOrEmail = user.username;
        pass = user.password;
    }
    if (usernameOrEmail === nameOrEmail && password === pass) {
        loginMessage.textContent = 'Login successful!';
        loginMessage.classList.remove('text-red-500');
        loginMessage.classList.add('text-green-500');
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.setItem('currentUser', JSON.stringify({ username: nameOrEmail, isAdmin: false }));
        }
        setTimeout(() => {
            // Redirect everyone to the projects management screen
            window.location.href = '../../project-management/index.html';
        }, 800);

    } else {
        loginMessage.textContent = 'Invalid username/email or password.';
        loginMessage.classList.remove('text-green-500');
        loginMessage.classList.add('text-red-500');
    }

})
