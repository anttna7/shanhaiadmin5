document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/v1/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok && data.code === 200) {
                // 登录成功
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('username', username);
                messageDiv.className = 'message success';
                messageDiv.textContent = '登录成功，正在跳转...';

                setTimeout(function() {
                    window.location.href = '/';
                }, 1000);
            } else {
                // 登录失败
                messageDiv.className = 'message error';
                messageDiv.textContent = data.msg || '登录失败，请检查用户名和密码';
            }
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '网络错误，请稍后重试';
            console.error('Login error:', error);
        }
    });
});
