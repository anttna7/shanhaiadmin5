// 检查登录状态
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    // 显示用户名
    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('username').textContent = username;
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
