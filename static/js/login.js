// 验证码管理类
class CaptchaManager {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.code = '';
        this.chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符

        // 点击刷新验证码
        this.canvas.addEventListener('click', () => this.refresh());

        // 初始化生成验证码
        this.refresh();
    }

    // 生成随机验证码
    generateCode() {
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
        }
        return code;
    }

    // 刷新验证码
    refresh() {
        this.code = this.generateCode();
        this.draw();
    }

    // 绘制验证码
    draw() {
        const ctx = this.ctx;
        const canvas = this.canvas;

        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制背景（渐变色）
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#e8eaf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制干扰线
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = this.randomColor(100, 200);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }

        // 绘制干扰点
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = this.randomColor(150, 200);
            ctx.beginPath();
            ctx.arc(
                Math.random() * canvas.width,
                Math.random() * canvas.height,
                1,
                0,
                2 * Math.PI
            );
            ctx.fill();
        }

        // 绘制验证码文字
        const charWidth = canvas.width / 4;
        for (let i = 0; i < this.code.length; i++) {
            // 随机字体大小
            const fontSize = 20 + Math.random() * 8;
            ctx.font = `bold ${fontSize}px Arial`;

            // 随机颜色
            ctx.fillStyle = this.randomColor(50, 100);

            // 随机旋转角度
            const angle = (Math.random() - 0.5) * 0.4;

            // 计算位置
            const x = charWidth * i + charWidth / 2;
            const y = canvas.height / 2 + 5;

            // 保存当前状态
            ctx.save();

            // 移动到字符位置并旋转
            ctx.translate(x, y);
            ctx.rotate(angle);

            // 绘制字符（居中对齐）
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.code[i], 0, 0);

            // 恢复状态
            ctx.restore();
        }
    }

    // 生成随机颜色
    randomColor(min, max) {
        const r = min + Math.floor(Math.random() * (max - min));
        const g = min + Math.floor(Math.random() * (max - min));
        const b = min + Math.floor(Math.random() * (max - min));
        return `rgb(${r},${g},${b})`;
    }

    // 验证验证码
    validate(input) {
        return input.toUpperCase() === this.code;
    }

    // 获取当前验证码（用于调试）
    getCode() {
        return this.code;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const messageDiv = document.getElementById('message');
    const captchaInput = document.getElementById('captcha');

    // 初始化验证码
    const captcha = new CaptchaManager('captchaCanvas');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const captchaValue = captchaInput.value;

        // 验证验证码
        if (!captcha.validate(captchaValue)) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '验证码错误，请重新输入';
            captcha.refresh(); // 刷新验证码
            captchaInput.value = ''; // 清空输入
            captchaInput.focus();
            return;
        }

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

                // 登录失败后刷新验证码
                captcha.refresh();
                captchaInput.value = '';
            }
        } catch (error) {
            messageDiv.className = 'message error';
            messageDiv.textContent = '网络错误，请稍后重试';
            console.error('Login error:', error);

            // 网络错误后刷新验证码
            captcha.refresh();
            captchaInput.value = '';
        }
    });

    // 输入框自动转大写（提升用户体验）
    captchaInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
});
