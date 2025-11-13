// 检查登录状态
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// 检查是否为平台管理员
function isPlatformAdmin() {
    const tenantId = localStorage.getItem('tenantId');
    return tenantId === '0' || !tenantId;
}

// 解析JWT token获取用户信息
function parseJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    // 解析JWT token，提取租户信息
    const token = localStorage.getItem('token');
    const payload = parseJWT(token);
    if (payload && payload.tenantId !== undefined) {
        localStorage.setItem('tenantId', payload.tenantId.toString());
    }

    // 显示用户名
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('username').textContent = username;
    }

    // 根据权限显示/隐藏租户管理菜单
    if (isPlatformAdmin()) {
        document.getElementById('tenantMenuItem').style.display = 'block';
    }

    // 菜单导航
    const menuLinks = document.querySelectorAll('.menu a');
    const pages = document.querySelectorAll('.page');

    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // 移除所有active类
            menuLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            // 添加active类到当前元素
            this.classList.add('active');
            const targetId = this.getAttribute('href').substring(1);
            const targetPage = document.getElementById(targetId);
            if (targetPage) {
                targetPage.classList.add('active');

                // 加载对应页面数据
                loadPageData(targetId);
            }
        });
    });

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('确定要退出登录吗?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            window.location.href = '/login';
        }
    });

    // 加载仪表板数据
    loadDashboard();
});

// 获取请求头
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    };
}

// 加载仪表板数据
async function loadDashboard() {
    try {
        // 模拟数据，实际应该调用API
        document.getElementById('totalUsers').textContent = '156';
        document.getElementById('totalRoles').textContent = '8';
        document.getElementById('totalDepts').textContent = '12';
        document.getElementById('onlineUsers').textContent = '23';
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// 加载页面数据
async function loadPageData(pageId) {
    switch(pageId) {
        case 'tenants':
            loadTenants();
            break;
        case 'users':
            loadUsers();
            break;
        case 'roles':
            loadRoles();
            break;
        case 'departments':
            loadDepartments();
            break;
        default:
            break;
    }
}

// 加载用户列表
async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');

    try {
        const response = await fetch('/api/v1/sysUserList', {
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data && data.data.list) {
                renderUsers(data.data.list);
            } else {
                tbody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="6">加载失败</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6">加载失败</td></tr>';
    }
}

// 渲染用户列表
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">暂无数据</td></tr>';
        return;
    }

    let html = '';
    users.forEach(user => {
        html += `
            <tr>
                <td>${user.userId || user.id}</td>
                <td>${user.username}</td>
                <td>${user.nickName || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.status === '2' ? '正常' : '禁用'}</td>
                <td>
                    <button class="edit" onclick="editUser(${user.userId || user.id})">编辑</button>
                    <button class="delete" onclick="deleteUser(${user.userId || user.id})">删除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 加载角色列表
async function loadRoles() {
    const tbody = document.getElementById('rolesTableBody');

    try {
        const response = await fetch('/api/v1/roleList', {
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data && data.data.list) {
                renderRoles(data.data.list);
            } else {
                tbody.innerHTML = '<tr><td colspan="5">暂无数据</td></tr>';
            }
        } else {
            tbody.innerHTML = '<tr><td colspan="5">加载失败</td></tr>';
        }
    } catch (error) {
        console.error('Error loading roles:', error);
        tbody.innerHTML = '<tr><td colspan="5">加载失败</td></tr>';
    }
}

// 渲染角色列表
function renderRoles(roles) {
    const tbody = document.getElementById('rolesTableBody');

    if (roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">暂无数据</td></tr>';
        return;
    }

    let html = '';
    roles.forEach(role => {
        html += `
            <tr>
                <td>${role.roleId || role.id}</td>
                <td>${role.roleName}</td>
                <td>${role.roleKey}</td>
                <td>${role.status === '2' ? '正常' : '禁用'}</td>
                <td>
                    <button class="edit" onclick="editRole(${role.roleId || role.id})">编辑</button>
                    <button class="delete" onclick="deleteRole(${role.roleId || role.id})">删除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 加载部门列表
async function loadDepartments() {
    const deptTree = document.getElementById('deptTree');

    try {
        const response = await fetch('/api/v1/deptList', {
            headers: getHeaders()
        });

        if (response.ok) {
            const data = await response.json();
            if (data.code === 200 && data.data) {
                renderDepartments(data.data);
            } else {
                deptTree.innerHTML = '暂无数据';
            }
        } else {
            deptTree.innerHTML = '加载失败';
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        deptTree.innerHTML = '加载失败';
    }
}

// 渲染部门树
function renderDepartments(depts) {
    const deptTree = document.getElementById('deptTree');

    if (!depts || depts.length === 0) {
        deptTree.innerHTML = '暂无数据';
        return;
    }

    let html = '<ul>';
    depts.forEach(dept => {
        html += `<li>${dept.deptName}</li>`;
    });
    html += '</ul>';

    deptTree.innerHTML = html;
}

// 用户操作函数
function addUser() {
    alert('添加用户功能');
}

function editUser(id) {
    alert('编辑用户 ID: ' + id);
}

function deleteUser(id) {
    if (confirm('确定要删除该用户吗?')) {
        // 调用删除API
        alert('删除用户 ID: ' + id);
    }
}

// 角色操作函数
function addRole() {
    alert('添加角色功能');
}

function editRole(id) {
    alert('编辑角色 ID: ' + id);
}

function deleteRole(id) {
    if (confirm('确定要删除该角色吗?')) {
        // 调用删除API
        alert('删除角色 ID: ' + id);
    }
}

// 部门操作函数
function addDept() {
    alert('添加部门功能');
}

// ============================================
// 租户管理功能
// ============================================

// 租户管理状态
const tenantState = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    searchParams: {}
};

// 加载租户列表
async function loadTenants(page = 1) {
    if (!isPlatformAdmin()) {
        SHAdmin.toast.error('只有平台管理员可以管理租户');
        return;
    }

    tenantState.currentPage = page;
    const tbody = document.getElementById('tenantsTableBody');

    try {
        SHAdmin.loading.show('加载中...');

        const params = new URLSearchParams({
            pageIndex: page,
            pageSize: tenantState.pageSize,
            ...tenantState.searchParams
        });

        const response = await SHAdmin.http.get(`/api/v1/tenant?${params}`);

        if (response.code === 200 && response.data) {
            tenantState.total = response.data.count || 0;
            renderTenants(response.data.list || []);
            renderTenantPagination();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">
                        <div class="sh-empty-state">
                            <div class="sh-empty-state-icon">⚠️</div>
                            <div class="sh-empty-state-text">${response.msg || '加载失败'}</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading tenants:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="sh-empty-state">
                        <div class="sh-empty-state-icon">❌</div>
                        <div class="sh-empty-state-text">加载失败，请稍后重试</div>
                    </div>
                </td>
            </tr>
        `;
    } finally {
        SHAdmin.loading.hide();
    }
}

// 渲染租户列表
function renderTenants(tenants) {
    const tbody = document.getElementById('tenantsTableBody');

    if (!tenants || tenants.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="sh-empty-state">
                        <div class="sh-empty-state-icon">📋</div>
                        <div class="sh-empty-state-text">暂无数据</div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';
    tenants.forEach(tenant => {
        const statusBadge = tenant.status === '2'
            ? '<span class="sh-badge sh-badge-success">正常</span>'
            : '<span class="sh-badge sh-badge-error">禁用</span>';

        html += `
            <tr>
                <td>${tenant.tenantId}</td>
                <td>${tenant.tenantName}</td>
                <td><code>${tenant.tenantCode}</code></td>
                <td>${tenant.contactName || '-'}</td>
                <td>${tenant.contactPhone || '-'}</td>
                <td>${tenant.maxUsers}</td>
                <td>${tenant.expireTime || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="edit" onclick="editTenant(${tenant.tenantId})">编辑</button>
                    <button class="delete" onclick="deleteTenant(${tenant.tenantId})">删除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 渲染分页
function renderTenantPagination() {
    SHAdmin.pagination.render('tenantPagination', {
        currentPage: tenantState.currentPage,
        pageSize: tenantState.pageSize,
        total: tenantState.total,
        onPageChange: (page) => {
            loadTenants(page);
        }
    });
}

// 打开租户创建/编辑模态框
async function openTenantModal(tenantId = null) {
    const isEdit = tenantId !== null;
    let tenant = null;

    // 如果是编辑模式，先加载租户数据
    if (isEdit) {
        try {
            SHAdmin.loading.show('加载数据...');
            const response = await SHAdmin.http.get(`/api/v1/tenant/${tenantId}`);
            SHAdmin.loading.hide();

            if (response.code === 200 && response.data) {
                tenant = response.data;
            } else {
                SHAdmin.toast.error(response.msg || '加载租户信息失败');
                return;
            }
        } catch (error) {
            SHAdmin.loading.hide();
            SHAdmin.toast.error('加载租户信息失败');
            return;
        }
    }

    // 构建表单HTML
    const formHtml = `
        <form id="tenantForm">
            <div class="sh-form-group">
                <label>租户名称 <span class="required">*</span></label>
                <input type="text" name="tenantName" value="${tenant?.tenantName || ''}"
                    placeholder="请输入租户名称" required>
            </div>

            <div class="sh-form-group">
                <label>租户代码 <span class="required">*</span></label>
                <input type="text" name="tenantCode" value="${tenant?.tenantCode || ''}"
                    placeholder="请输入租户代码（小写字母和下划线）" required
                    ${isEdit ? 'readonly' : ''}>
                <small style="color: #999;">租户代码创建后不可修改</small>
            </div>

            <div class="sh-form-group">
                <label>联系人</label>
                <input type="text" name="contactName" value="${tenant?.contactName || ''}"
                    placeholder="请输入联系人姓名">
            </div>

            <div class="sh-form-group">
                <label>联系电话</label>
                <input type="tel" name="contactPhone" value="${tenant?.contactPhone || ''}"
                    placeholder="请输入联系电话">
            </div>

            <div class="sh-form-group">
                <label>联系邮箱</label>
                <input type="email" name="contactEmail" value="${tenant?.contactEmail || ''}"
                    placeholder="请输入联系邮箱">
            </div>

            <div class="sh-form-group">
                <label>最大用户数 <span class="required">*</span></label>
                <input type="number" name="maxUsers" value="${tenant?.maxUsers || 10}"
                    min="1" placeholder="请输入最大用户数" required>
            </div>

            <div class="sh-form-group">
                <label>到期时间</label>
                <input type="date" name="expireTime" value="${tenant?.expireTime || ''}">
            </div>

            <div class="sh-form-group">
                <label>状态 <span class="required">*</span></label>
                <select name="status" required>
                    <option value="2" ${!tenant || tenant.status === '2' ? 'selected' : ''}>正常</option>
                    <option value="1" ${tenant?.status === '1' ? 'selected' : ''}>禁用</option>
                </select>
            </div>

            <div class="sh-form-group">
                <label>备注</label>
                <textarea name="remark" placeholder="请输入备注">${tenant?.remark || ''}</textarea>
            </div>

            ${!isEdit ? `
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            <h4 style="margin-bottom: 15px; color: #667eea;">租户管理员信息</h4>

            <div class="sh-form-group">
                <label>管理员用户名 <span class="required">*</span></label>
                <input type="text" name="adminUsername" placeholder="请输入管理员用户名" required>
            </div>

            <div class="sh-form-group">
                <label>管理员密码 <span class="required">*</span></label>
                <input type="password" name="adminPassword" placeholder="请输入管理员密码" required>
            </div>

            <div class="sh-form-group">
                <label>管理员邮箱 <span class="required">*</span></label>
                <input type="email" name="adminEmail" placeholder="请输入管理员邮箱" required>
            </div>
            ` : ''}
        </form>
    `;

    // 打开模态框
    SHAdmin.modal.open({
        title: isEdit ? '编辑租户' : '新增租户',
        content: formHtml,
        width: '600px',
        onConfirm: async () => {
            const formData = new FormData(document.getElementById('tenantForm'));
            const data = Object.fromEntries(formData.entries());

            // 表单验证
            const validationRules = {
                tenantName: { required: true, message: '请输入租户名称' },
                tenantCode: { required: true, message: '请输入租户代码' },
                maxUsers: { required: true, message: '请输入最大用户数' },
                status: { required: true, message: '请选择状态' }
            };

            if (!isEdit) {
                validationRules.adminUsername = { required: true, message: '请输入管理员用户名' };
                validationRules.adminPassword = { required: true, message: '请输入管理员密码' };
                validationRules.adminEmail = { required: true, message: '请输入管理员邮箱' };
            }

            const validation = SHAdmin.validate.validateForm(data, validationRules);
            if (!validation.valid) {
                const firstError = Object.values(validation.errors)[0];
                SHAdmin.toast.error(firstError);
                return false; // 阻止关闭
            }

            // 提交数据
            try {
                SHAdmin.loading.show(isEdit ? '更新中...' : '创建中...');

                let response;
                if (isEdit) {
                    response = await SHAdmin.http.put(`/api/v1/tenant/${tenantId}`, data);
                } else {
                    response = await SHAdmin.http.post('/api/v1/tenant', data);
                }

                SHAdmin.loading.hide();

                if (response.code === 200) {
                    SHAdmin.toast.success(isEdit ? '更新成功' : '创建成功');
                    loadTenants(tenantState.currentPage);
                    return true; // 允许关闭
                } else {
                    SHAdmin.toast.error(response.msg || (isEdit ? '更新失败' : '创建失败'));
                    return false;
                }
            } catch (error) {
                SHAdmin.loading.hide();
                SHAdmin.toast.error(error.message || (isEdit ? '更新失败' : '创建失败'));
                return false;
            }
        }
    });
}

// 编辑租户
function editTenant(tenantId) {
    openTenantModal(tenantId);
}

// 删除租户
async function deleteTenant(tenantId) {
    const confirmed = await SHAdmin.modal.confirm({
        title: '确认删除',
        content: '<p>确定要删除该租户吗？</p><p style="color: #f44336;">警告：删除租户会同时删除租户下的所有用户和数据，此操作不可恢复！</p>',
        confirmText: '确认删除',
        cancelText: '取消'
    });

    if (!confirmed) return;

    try {
        SHAdmin.loading.show('删除中...');
        const response = await SHAdmin.http.delete(`/api/v1/tenant/${tenantId}`);
        SHAdmin.loading.hide();

        if (response.code === 200) {
            SHAdmin.toast.success('删除成功');
            loadTenants(tenantState.currentPage);
        } else {
            SHAdmin.toast.error(response.msg || '删除失败');
        }
    } catch (error) {
        SHAdmin.loading.hide();
        SHAdmin.toast.error('删除失败');
    }
}

// 租户搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('tenantSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();

            tenantState.searchParams = {};

            const tenantName = document.getElementById('searchTenantName').value.trim();
            const tenantCode = document.getElementById('searchTenantCode').value.trim();
            const status = document.getElementById('searchTenantStatus').value;

            if (tenantName) tenantState.searchParams.tenantName = tenantName;
            if (tenantCode) tenantState.searchParams.tenantCode = tenantCode;
            if (status) tenantState.searchParams.status = status;

            loadTenants(1);
        });
    }
});

// 重置租户搜索
function resetTenantSearch() {
    document.getElementById('searchTenantName').value = '';
    document.getElementById('searchTenantCode').value = '';
    document.getElementById('searchTenantStatus').value = '';
    tenantState.searchParams = {};
    loadTenants(1);
}
