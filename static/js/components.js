// ===================================
// SH Admin 前端组件库
// ===================================

// 全局配置
const SHAdmin = {
    apiBaseUrl: '/api/v1',

    // Toast 消息提示
    toast: {
        show(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `sh-toast sh-toast-${type}`;
            toast.innerHTML = `
                <div class="sh-toast-content">
                    <span class="sh-toast-icon">${this.getIcon(type)}</span>
                    <span class="sh-toast-message">${message}</span>
                </div>
            `;

            document.body.appendChild(toast);

            // 触发动画
            setTimeout(() => toast.classList.add('sh-toast-show'), 10);

            // 自动移除
            setTimeout(() => {
                toast.classList.remove('sh-toast-show');
                setTimeout(() => document.body.removeChild(toast), 300);
            }, duration);
        },

        getIcon(type) {
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            return icons[type] || icons.info;
        },

        success(message, duration) {
            this.show(message, 'success', duration);
        },

        error(message, duration) {
            this.show(message, 'error', duration);
        },

        warning(message, duration) {
            this.show(message, 'warning', duration);
        },

        info(message, duration) {
            this.show(message, 'info', duration);
        }
    },

    // 模态框
    modal: {
        current: null,

        open(options) {
            const {
                title = '提示',
                content = '',
                width = '500px',
                footer = true,
                onConfirm,
                onCancel,
                confirmText = '确定',
                cancelText = '取消'
            } = options;

            // 关闭已存在的模态框
            this.close();

            const modal = document.createElement('div');
            modal.className = 'sh-modal';
            modal.innerHTML = `
                <div class="sh-modal-overlay"></div>
                <div class="sh-modal-container" style="max-width: ${width}">
                    <div class="sh-modal-header">
                        <h3>${title}</h3>
                        <button class="sh-modal-close">&times;</button>
                    </div>
                    <div class="sh-modal-body">${content}</div>
                    ${footer ? `
                        <div class="sh-modal-footer">
                            <button class="btn-secondary sh-modal-cancel">${cancelText}</button>
                            <button class="btn-primary sh-modal-confirm">${confirmText}</button>
                        </div>
                    ` : ''}
                </div>
            `;

            document.body.appendChild(modal);
            this.current = modal;

            // 触发动画
            setTimeout(() => modal.classList.add('sh-modal-show'), 10);

            // 绑定事件
            const closeBtn = modal.querySelector('.sh-modal-close');
            const cancelBtn = modal.querySelector('.sh-modal-cancel');
            const confirmBtn = modal.querySelector('.sh-modal-confirm');
            const overlay = modal.querySelector('.sh-modal-overlay');

            const handleClose = () => {
                if (onCancel) onCancel();
                this.close();
            };

            const handleConfirm = () => {
                if (onConfirm) {
                    const result = onConfirm();
                    // 如果返回false，不关闭模态框
                    if (result !== false) {
                        this.close();
                    }
                } else {
                    this.close();
                }
            };

            closeBtn?.addEventListener('click', handleClose);
            cancelBtn?.addEventListener('click', handleClose);
            confirmBtn?.addEventListener('click', handleConfirm);
            overlay?.addEventListener('click', handleClose);

            return modal;
        },

        close() {
            if (this.current) {
                this.current.classList.remove('sh-modal-show');
                setTimeout(() => {
                    if (this.current && this.current.parentNode) {
                        document.body.removeChild(this.current);
                    }
                    this.current = null;
                }, 300);
            }
        },

        confirm(options) {
            return new Promise((resolve, reject) => {
                this.open({
                    ...options,
                    onConfirm: () => resolve(true),
                    onCancel: () => reject(false)
                });
            });
        }
    },

    // Loading 加载
    loading: {
        instance: null,

        show(message = '加载中...') {
            this.hide(); // 先关闭已存在的

            const loading = document.createElement('div');
            loading.className = 'sh-loading';
            loading.innerHTML = `
                <div class="sh-loading-overlay"></div>
                <div class="sh-loading-content">
                    <div class="sh-loading-spinner"></div>
                    <div class="sh-loading-text">${message}</div>
                </div>
            `;

            document.body.appendChild(loading);
            this.instance = loading;

            setTimeout(() => loading.classList.add('sh-loading-show'), 10);
        },

        hide() {
            if (this.instance) {
                this.instance.classList.remove('sh-loading-show');
                setTimeout(() => {
                    if (this.instance && this.instance.parentNode) {
                        document.body.removeChild(this.instance);
                    }
                    this.instance = null;
                }, 300);
            }
        }
    },

    // HTTP 请求封装
    http: {
        async request(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
                }
            };

            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...(options.headers || {})
                }
            };

            try {
                const response = await fetch(url, mergedOptions);

                // Token 失效处理
                if (response.status === 401) {
                    SHAdmin.toast.error('登录已过期，请重新登录');
                    setTimeout(() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }, 1500);
                    throw new Error('Unauthorized');
                }

                const data = await response.json();

                if (data.code !== 200) {
                    throw new Error(data.msg || '请求失败');
                }

                return data;
            } catch (error) {
                console.error('HTTP Request Error:', error);
                throw error;
            }
        },

        get(url, params = {}) {
            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return this.request(fullUrl, { method: 'GET' });
        },

        post(url, data = {}) {
            return this.request(url, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        put(url, data = {}) {
            return this.request(url, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        delete(url) {
            return this.request(url, { method: 'DELETE' });
        }
    },

    // 表单验证
    validate: {
        rules: {
            required(value, message = '此字段为必填项') {
                if (!value || (typeof value === 'string' && !value.trim())) {
                    return message;
                }
                return null;
            },

            email(value, message = '请输入有效的邮箱地址') {
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return message;
                }
                return null;
            },

            phone(value, message = '请输入有效的手机号码') {
                if (value && !/^1[3-9]\d{9}$/.test(value)) {
                    return message;
                }
                return null;
            },

            minLength(value, length, message) {
                if (value && value.length < length) {
                    return message || `最少需要${length}个字符`;
                }
                return null;
            },

            maxLength(value, length, message) {
                if (value && value.length > length) {
                    return message || `最多允许${length}个字符`;
                }
                return null;
            }
        },

        validateForm(formData, rules) {
            const errors = {};

            for (const [field, fieldRules] of Object.entries(rules)) {
                const value = formData[field];

                for (const rule of fieldRules) {
                    const error = this.rules[rule.type](value, rule.message);
                    if (error) {
                        errors[field] = error;
                        break;
                    }
                }
            }

            return {
                valid: Object.keys(errors).length === 0,
                errors
            };
        }
    },

    // 分页组件
    pagination: {
        render(container, options) {
            const {
                total = 0,
                pageSize = 10,
                currentPage = 1,
                onChange
            } = options;

            const totalPages = Math.ceil(total / pageSize);

            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            let html = '<div class="sh-pagination">';

            // 上一页
            html += `<button class="sh-page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">上一页</button>`;

            // 页码
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);

            if (startPage > 1) {
                html += `<button class="sh-page-btn" data-page="1">1</button>`;
                if (startPage > 2) {
                    html += '<span class="sh-page-ellipsis">...</span>';
                }
            }

            for (let i = startPage; i <= endPage; i++) {
                html += `<button class="sh-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    html += '<span class="sh-page-ellipsis">...</span>';
                }
                html += `<button class="sh-page-btn" data-page="${totalPages}">${totalPages}</button>`;
            }

            // 下一页
            html += `<button class="sh-page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">下一页</button>`;

            html += `<span class="sh-page-info">共 ${total} 条</span>`;
            html += '</div>';

            container.innerHTML = html;

            // 绑定事件
            container.querySelectorAll('.sh-page-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.disabled) return;
                    const page = parseInt(this.dataset.page);
                    if (page && onChange) {
                        onChange(page);
                    }
                });
            });
        }
    }
};

// 导出到全局
window.SHAdmin = SHAdmin;
