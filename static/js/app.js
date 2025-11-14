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

    // 汉堡菜单切换
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');

    function toggleSidebar() {
        menuToggle.classList.toggle('active');
        sidebar.classList.toggle('sidebar-open');
        sidebarOverlay.classList.toggle('active');
    }

    function closeSidebar() {
        menuToggle.classList.remove('active');
        sidebar.classList.remove('sidebar-open');
        sidebarOverlay.classList.remove('active');
    }

    // 点击汉堡菜单按钮
    menuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
    });

    // 点击遮罩层关闭侧边栏
    sidebarOverlay.addEventListener('click', closeSidebar);

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

            // 在移动端，点击菜单项后关闭侧边栏
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        });
    });

    // 退出登录
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('确定要退出登录吗?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('tenantId');
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
        // 显示租户相关信息（仅平台管理员）
        if (isPlatformAdmin()) {
            document.getElementById('tenantCard').style.display = 'block';
            document.getElementById('quickAddTenant').style.display = 'inline-block';
        }

        // 显示当前用户信息
        const username = localStorage.getItem('username');
        const tenantId = localStorage.getItem('tenantId');
        const userType = tenantId === '0' ? '平台管理员' : '租户用户';
        document.getElementById('currentUserInfo').innerHTML = `
            <strong>${username}</strong>
            <span class="sh-badge sh-badge-${tenantId === '0' ? 'primary' : 'success'}">${userType}</span>
        `;

        // 并行加载所有统计数据
        await Promise.all([
            loadUserStats(),
            loadRoleStats(),
            loadDeptStats(),
            isPlatformAdmin() ? loadTenantStats() : Promise.resolve()
        ]);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        SHAdmin.toast.error('加载仪表板数据失败');
    }
}

// 加载用户统计
async function loadUserStats() {
    try {
        const response = await SHAdmin.http.get('/api/v1/sysUserList?pageIndex=1&pageSize=1');

        if (response.code === 200 && response.data) {
            const total = response.data.count || 0;
            document.getElementById('totalUsers').textContent = total;

            // 计算活跃用户数（状态为正常的用户）
            const activeResponse = await SHAdmin.http.get('/api/v1/sysUserList?pageIndex=1&pageSize=1&status=2');
            const activeCount = activeResponse.data?.count || 0;
            const activePercent = total > 0 ? Math.round((activeCount / total) * 100) : 0;

            document.getElementById('totalUsersChange').innerHTML = `
                活跃用户 ${activeCount} 人 (${activePercent}%)
            `;
        } else {
            throw new Error('获取用户统计失败');
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
        document.getElementById('totalUsers').innerHTML = '<span style="color: #f44336;">-</span>';
        document.getElementById('totalUsersChange').textContent = '加载失败';
    }
}

// 加载角色统计
async function loadRoleStats() {
    try {
        const response = await SHAdmin.http.get('/api/v1/roleList?pageIndex=1&pageSize=1');

        if (response.code === 200 && response.data) {
            const total = response.data.count || 0;
            document.getElementById('totalRoles').textContent = total;

            // 计算启用的角色数
            const activeResponse = await SHAdmin.http.get('/api/v1/roleList?pageIndex=1&pageSize=1&status=2');
            const activeCount = activeResponse.data?.count || 0;

            document.getElementById('totalRolesChange').innerHTML = `
                启用角色 ${activeCount} 个
            `;
        } else {
            throw new Error('获取角色统计失败');
        }
    } catch (error) {
        console.error('Error loading role stats:', error);
        document.getElementById('totalRoles').innerHTML = '<span style="color: #f44336;">-</span>';
        document.getElementById('totalRolesChange').textContent = '加载失败';
    }
}

// 加载部门统计
async function loadDeptStats() {
    try {
        const response = await SHAdmin.http.get('/api/v1/deptList');

        if (response.code === 200 && response.data) {
            const depts = Array.isArray(response.data) ? response.data : (response.data.list || []);
            const total = depts.length;
            document.getElementById('totalDepts').textContent = total;

            document.getElementById('totalDeptsChange').textContent = total > 0 ? '组织架构完善' : '暂无部门';
        } else {
            throw new Error('获取部门统计失败');
        }
    } catch (error) {
        console.error('Error loading dept stats:', error);
        document.getElementById('totalDepts').innerHTML = '<span style="color: #f44336;">-</span>';
        document.getElementById('totalDeptsChange').textContent = '加载失败';
    }
}

// 加载租户统计（仅平台管理员）
async function loadTenantStats() {
    try {
        const response = await SHAdmin.http.get('/api/v1/tenant?pageIndex=1&pageSize=1');

        if (response.code === 200 && response.data) {
            const total = response.data.count || 0;
            document.getElementById('totalTenants').textContent = total;

            // 计算活跃租户数
            const activeResponse = await SHAdmin.http.get('/api/v1/tenant?pageIndex=1&pageSize=1&status=2');
            const activeCount = activeResponse.data?.count || 0;

            document.getElementById('totalTenantsChange').innerHTML = `
                活跃租户 ${activeCount} 个
            `;
        } else {
            throw new Error('获取租户统计失败');
        }
    } catch (error) {
        console.error('Error loading tenant stats:', error);
        document.getElementById('totalTenants').innerHTML = '<span style="color: #f44336;">-</span>';
        document.getElementById('totalTenantsChange').textContent = '加载失败';
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

// ============================================
// 用户管理功能
// ============================================

// 用户管理状态
const userState = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    searchParams: {},
    rolesList: [] // 缓存角色列表
};

// 加载用户列表
async function loadUsers(page = 1) {
    userState.currentPage = page;
    const tbody = document.getElementById('usersTableBody');

    try {
        SHAdmin.loading.show('加载中...');

        const params = new URLSearchParams({
            pageIndex: page,
            pageSize: userState.pageSize,
            ...userState.searchParams
        });

        const response = await SHAdmin.http.get(`/api/v1/sysUserList?${params}`);

        if (response.code === 200 && response.data) {
            userState.total = response.data.count || 0;
            renderUsers(response.data.list || []);
            renderUserPagination();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="sh-empty-state">
                            <div class="sh-empty-state-icon">⚠️</div>
                            <div class="sh-empty-state-text">${response.msg || '加载失败'}</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
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

// 渲染用户列表
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (!users || users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
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
    users.forEach(user => {
        const statusBadge = user.status === '2'
            ? '<span class="sh-badge sh-badge-success">正常</span>'
            : '<span class="sh-badge sh-badge-error">禁用</span>';

        html += `
            <tr>
                <td>${user.userId || user.id}</td>
                <td><strong>${user.username}</strong></td>
                <td>${user.nickName || '-'}</td>
                <td>${user.email || '-'}</td>
                <td>${user.phone || '-'}</td>
                <td>${user.roleName || '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="edit" onclick="editUser(${user.userId || user.id})">编辑</button>
                    <button class="delete" onclick="deleteUser(${user.userId || user.id})">删除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 渲染用户分页
function renderUserPagination() {
    SHAdmin.pagination.render('userPagination', {
        currentPage: userState.currentPage,
        pageSize: userState.pageSize,
        total: userState.total,
        onPageChange: (page) => {
            loadUsers(page);
        }
    });
}

// 加载角色列表（用于下拉选择）
async function loadRolesForSelect() {
    try {
        const response = await SHAdmin.http.get('/api/v1/roleList?pageIndex=1&pageSize=100');
        if (response.code === 200 && response.data && response.data.list) {
            userState.rolesList = response.data.list;
            return response.data.list;
        }
        return [];
    } catch (error) {
        console.error('Error loading roles:', error);
        return [];
    }
}

// 打开用户创建/编辑模态框
async function openUserModal(userId = null) {
    const isEdit = userId !== null;
    let user = null;

    // 加载角色列表
    const roles = await loadRolesForSelect();
    if (roles.length === 0) {
        SHAdmin.toast.error('请先创建角色');
        return;
    }

    // 如果是编辑模式，先加载用户数据
    if (isEdit) {
        try {
            SHAdmin.loading.show('加载数据...');
            const response = await SHAdmin.http.get(`/api/v1/sysUser/${userId}`);
            SHAdmin.loading.hide();

            if (response.code === 200 && response.data) {
                user = response.data;
            } else {
                SHAdmin.toast.error(response.msg || '加载用户信息失败');
                return;
            }
        } catch (error) {
            SHAdmin.loading.hide();
            SHAdmin.toast.error('加载用户信息失败');
            return;
        }
    }

    // 生成角色选项
    const roleOptions = roles.map(role =>
        `<option value="${role.roleId}" ${user && user.roleId === role.roleId ? 'selected' : ''}>${role.roleName}</option>`
    ).join('');

    // 构建表单HTML
    const formHtml = `
        <form id="userForm">
            <div class="sh-form-group">
                <label>用户名 <span class="required">*</span></label>
                <input type="text" name="username" value="${user?.username || ''}"
                    placeholder="请输入用户名" required ${isEdit ? 'readonly' : ''}>
                ${isEdit ? '<small style="color: #999;">用户名创建后不可修改</small>' : ''}
            </div>

            ${!isEdit ? `
            <div class="sh-form-group">
                <label>密码 <span class="required">*</span></label>
                <input type="password" name="password" placeholder="请输入密码" required>
            </div>
            ` : ''}

            <div class="sh-form-group">
                <label>姓名 <span class="required">*</span></label>
                <input type="text" name="nickName" value="${user?.nickName || ''}"
                    placeholder="请输入姓名" required>
            </div>

            <div class="sh-form-group">
                <label>邮箱</label>
                <input type="email" name="email" value="${user?.email || ''}"
                    placeholder="请输入邮箱">
            </div>

            <div class="sh-form-group">
                <label>手机号</label>
                <input type="tel" name="phone" value="${user?.phone || ''}"
                    placeholder="请输入手机号">
            </div>

            <div class="sh-form-group">
                <label>角色 <span class="required">*</span></label>
                <select name="roleId" required>
                    <option value="">请选择角色</option>
                    ${roleOptions}
                </select>
            </div>

            <div class="sh-form-group">
                <label>部门ID</label>
                <input type="number" name="deptId" value="${user?.deptId || ''}"
                    placeholder="请输入部门ID">
            </div>

            <div class="sh-form-group">
                <label>岗位ID</label>
                <input type="number" name="postId" value="${user?.postId || ''}"
                    placeholder="请输入岗位ID">
            </div>

            <div class="sh-form-group">
                <label>状态 <span class="required">*</span></label>
                <select name="status" required>
                    <option value="2" ${!user || user.status === '2' ? 'selected' : ''}>正常</option>
                    <option value="1" ${user?.status === '1' ? 'selected' : ''}>禁用</option>
                </select>
            </div>

            <div class="sh-form-group">
                <label>备注</label>
                <textarea name="remark" placeholder="请输入备注">${user?.remark || ''}</textarea>
            </div>
        </form>
    `;

    // 打开模态框
    SHAdmin.modal.open({
        title: isEdit ? '编辑用户' : '新增用户',
        content: formHtml,
        width: '600px',
        onConfirm: async () => {
            const formData = new FormData(document.getElementById('userForm'));
            const data = Object.fromEntries(formData.entries());

            // 表单验证
            const validationRules = {
                username: { required: true, message: '请输入用户名' },
                nickName: { required: true, message: '请输入姓名' },
                roleId: { required: true, message: '请选择角色' },
                status: { required: true, message: '请选择状态' }
            };

            if (!isEdit) {
                validationRules.password = { required: true, minLength: 6, message: '密码不能少于6位' };
            }

            if (data.email) {
                validationRules.email = { email: true, message: '邮箱格式不正确' };
            }

            if (data.phone) {
                validationRules.phone = { phone: true, message: '手机号格式不正确' };
            }

            const validation = SHAdmin.validate.validateForm(data, validationRules);
            if (!validation.valid) {
                const firstError = Object.values(validation.errors)[0];
                SHAdmin.toast.error(firstError);
                return false;
            }

            // 提交数据
            try {
                SHAdmin.loading.show(isEdit ? '更新中...' : '创建中...');

                let response;
                if (isEdit) {
                    response = await SHAdmin.http.put(`/api/v1/sysUser/${userId}`, data);
                } else {
                    response = await SHAdmin.http.post('/api/v1/sysUser', data);
                }

                SHAdmin.loading.hide();

                if (response.code === 200) {
                    SHAdmin.toast.success(isEdit ? '更新成功' : '创建成功');
                    loadUsers(userState.currentPage);
                    return true;
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

// ============================================
// 角色管理功能
// ============================================

// 角色管理状态
const roleState = {
    currentPage: 1,
    pageSize: 10,
    total: 0,
    searchParams: {}
};

// 加载角色列表
async function loadRoles(page = 1) {
    roleState.currentPage = page;
    const tbody = document.getElementById('rolesTableBody');

    try {
        SHAdmin.loading.show('加载中...');

        const params = new URLSearchParams({
            pageIndex: page,
            pageSize: roleState.pageSize,
            ...roleState.searchParams
        });

        const response = await SHAdmin.http.get(`/api/v1/roleList?${params}`);

        if (response.code === 200 && response.data) {
            roleState.total = response.data.count || 0;
            renderRoles(response.data.list || []);
            renderRolePagination();
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="sh-empty-state">
                            <div class="sh-empty-state-icon">⚠️</div>
                            <div class="sh-empty-state-text">${response.msg || '加载失败'}</div>
                        </div>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading roles:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
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

// 渲染角色列表
function renderRoles(roles) {
    const tbody = document.getElementById('rolesTableBody');

    if (!roles || roles.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
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
    roles.forEach(role => {
        const statusBadge = role.status === '2'
            ? '<span class="sh-badge sh-badge-success">正常</span>'
            : '<span class="sh-badge sh-badge-error">禁用</span>';

        const createdAt = role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '-';

        html += `
            <tr>
                <td>${role.roleId || role.id}</td>
                <td><strong>${role.roleName}</strong></td>
                <td><code>${role.roleKey}</code></td>
                <td>${role.roleLevel || 0}</td>
                <td>${role.roleSort || 0}</td>
                <td>${statusBadge}</td>
                <td>${createdAt}</td>
                <td>
                    <button class="edit" onclick="editRole(${role.roleId || role.id})">编辑</button>
                    <button class="delete" onclick="deleteRole(${role.roleId || role.id})">删除</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// 渲染角色分页
function renderRolePagination() {
    SHAdmin.pagination.render('rolePagination', {
        currentPage: roleState.currentPage,
        pageSize: roleState.pageSize,
        total: roleState.total,
        onPageChange: (page) => {
            loadRoles(page);
        }
    });
}

// 打开角色创建/编辑模态框
async function openRoleModal(roleId = null) {
    const isEdit = roleId !== null;
    let role = null;

    // 如果是编辑模式，先加载角色数据
    if (isEdit) {
        try {
            SHAdmin.loading.show('加载数据...');
            const response = await SHAdmin.http.get(`/api/v1/role/${roleId}`);
            SHAdmin.loading.hide();

            if (response.code === 200 && response.data) {
                role = response.data;
            } else {
                SHAdmin.toast.error(response.msg || '加载角色信息失败');
                return;
            }
        } catch (error) {
            SHAdmin.loading.hide();
            SHAdmin.toast.error('加载角色信息失败');
            return;
        }
    }

    // 构建表单HTML
    const formHtml = `
        <form id="roleForm">
            <div class="sh-form-group">
                <label>角色名称 <span class="required">*</span></label>
                <input type="text" name="roleName" value="${role?.roleName || ''}"
                    placeholder="请输入角色名称" required>
            </div>

            <div class="sh-form-group">
                <label>角色标识 <span class="required">*</span></label>
                <input type="text" name="roleKey" value="${role?.roleKey || ''}"
                    placeholder="请输入角色标识（如：admin、user）" required
                    ${isEdit ? 'readonly' : ''}>
                ${isEdit ? '<small style="color: #999;">角色标识创建后不可修改</small>' : ''}
            </div>

            <div class="sh-form-group">
                <label>角色级别</label>
                <input type="number" name="roleLevel" value="${role?.roleLevel || 0}"
                    placeholder="请输入角色级别（数字越大权限越高）" min="0">
                <small style="color: #999;">用于权限控制，租户管理员级别为99</small>
            </div>

            <div class="sh-form-group">
                <label>排序</label>
                <input type="number" name="roleSort" value="${role?.roleSort || 0}"
                    placeholder="请输入排序值" min="0">
            </div>

            <div class="sh-form-group">
                <label>数据范围</label>
                <select name="dataScope">
                    <option value="1" ${!role || role.dataScope === '1' ? 'selected' : ''}>全部数据</option>
                    <option value="2" ${role?.dataScope === '2' ? 'selected' : ''}>自定义数据</option>
                    <option value="3" ${role?.dataScope === '3' ? 'selected' : ''}>本部门数据</option>
                    <option value="4" ${role?.dataScope === '4' ? 'selected' : ''}>本部门及以下数据</option>
                    <option value="5" ${role?.dataScope === '5' ? 'selected' : ''}>仅本人数据</option>
                </select>
            </div>

            <div class="sh-form-group">
                <label>状态 <span class="required">*</span></label>
                <select name="status" required>
                    <option value="2" ${!role || role.status === '2' ? 'selected' : ''}>正常</option>
                    <option value="1" ${role?.status === '1' ? 'selected' : ''}>禁用</option>
                </select>
            </div>

            <div class="sh-form-group">
                <label>备注</label>
                <textarea name="remark" placeholder="请输入备注">${role?.remark || ''}</textarea>
            </div>
        </form>
    `;

    // 打开模态框
    SHAdmin.modal.open({
        title: isEdit ? '编辑角色' : '新增角色',
        content: formHtml,
        width: '600px',
        onConfirm: async () => {
            const formData = new FormData(document.getElementById('roleForm'));
            const data = Object.fromEntries(formData.entries());

            // 表单验证
            const validationRules = {
                roleName: { required: true, message: '请输入角色名称' },
                roleKey: { required: true, message: '请输入角色标识' },
                status: { required: true, message: '请选择状态' }
            };

            const validation = SHAdmin.validate.validateForm(data, validationRules);
            if (!validation.valid) {
                const firstError = Object.values(validation.errors)[0];
                SHAdmin.toast.error(firstError);
                return false;
            }

            // 提交数据
            try {
                SHAdmin.loading.show(isEdit ? '更新中...' : '创建中...');

                let response;
                if (isEdit) {
                    response = await SHAdmin.http.put(`/api/v1/role/${roleId}`, data);
                } else {
                    response = await SHAdmin.http.post('/api/v1/role', data);
                }

                SHAdmin.loading.hide();

                if (response.code === 200) {
                    SHAdmin.toast.success(isEdit ? '更新成功' : '创建成功');
                    loadRoles(roleState.currentPage);
                    return true;
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

// 编辑用户
function editUser(userId) {
    openUserModal(userId);
}

// 删除用户
async function deleteUser(userId) {
    const confirmed = await SHAdmin.modal.confirm({
        title: '确认删除',
        content: '<p>确定要删除该用户吗？</p><p style="color: #f44336;">此操作不可恢复！</p>',
        confirmText: '确认删除',
        cancelText: '取消'
    });

    if (!confirmed) return;

    try {
        SHAdmin.loading.show('删除中...');
        const response = await SHAdmin.http.delete(`/api/v1/sysUser/${userId}`);
        SHAdmin.loading.hide();

        if (response.code === 200) {
            SHAdmin.toast.success('删除成功');
            loadUsers(userState.currentPage);
        } else {
            SHAdmin.toast.error(response.msg || '删除失败');
        }
    } catch (error) {
        SHAdmin.loading.hide();
        SHAdmin.toast.error('删除失败');
    }
}

// 用户搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('userSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();

            userState.searchParams = {};

            const username = document.getElementById('searchUsername').value.trim();
            const nickName = document.getElementById('searchNickName').value.trim();
            const status = document.getElementById('searchUserStatus').value;

            if (username) userState.searchParams.username = username;
            if (nickName) userState.searchParams.nickName = nickName;
            if (status) userState.searchParams.status = status;

            loadUsers(1);
        });
    }
});

// 重置用户搜索
function resetUserSearch() {
    document.getElementById('searchUsername').value = '';
    document.getElementById('searchNickName').value = '';
    document.getElementById('searchUserStatus').value = '';
    userState.searchParams = {};
    loadUsers(1);
}

// 编辑角色
function editRole(roleId) {
    openRoleModal(roleId);
}

// 删除角色
async function deleteRole(roleId) {
    const confirmed = await SHAdmin.modal.confirm({
        title: '确认删除',
        content: '<p>确定要删除该角色吗？</p><p style="color: #f44336;">删除角色会影响使用该角色的所有用户，此操作不可恢复！</p>',
        confirmText: '确认删除',
        cancelText: '取消'
    });

    if (!confirmed) return;

    try {
        SHAdmin.loading.show('删除中...');
        const response = await SHAdmin.http.delete(`/api/v1/role/${roleId}`);
        SHAdmin.loading.hide();

        if (response.code === 200) {
            SHAdmin.toast.success('删除成功');
            loadRoles(roleState.currentPage);
        } else {
            SHAdmin.toast.error(response.msg || '删除失败');
        }
    } catch (error) {
        SHAdmin.loading.hide();
        SHAdmin.toast.error('删除失败');
    }
}

// 角色搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('roleSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();

            roleState.searchParams = {};

            const roleName = document.getElementById('searchRoleName').value.trim();
            const roleKey = document.getElementById('searchRoleKey').value.trim();
            const status = document.getElementById('searchRoleStatus').value;

            if (roleName) roleState.searchParams.roleName = roleName;
            if (roleKey) roleState.searchParams.roleKey = roleKey;
            if (status) roleState.searchParams.status = status;

            loadRoles(1);
        });
    }
});

// 重置角色搜索
function resetRoleSearch() {
    document.getElementById('searchRoleName').value = '';
    document.getElementById('searchRoleKey').value = '';
    document.getElementById('searchRoleStatus').value = '';
    roleState.searchParams = {};
    loadRoles(1);
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
