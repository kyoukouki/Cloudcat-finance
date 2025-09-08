// 云喵Club财务管理系统 JavaScript

// 数据存储
let orders = JSON.parse(localStorage.getItem('yunmiao_orders') || '[]');
let customers = JSON.parse(localStorage.getItem('yunmiao_customers') || '[]');

// 页面切换功能
function showPage(pageId) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // 显示指定页面
    document.getElementById(pageId).classList.add('active');
    
    // 更新底部导航状态
    updateNavigation(pageId);
    
    // 根据页面加载相应数据
    switch(pageId) {
        case 'home-page':
            updateDashboard();
            break;
        case 'orders-page':
            loadOrdersList();
            break;
        case 'customers-page':
            loadCustomersList();
            break;
        case 'add-order-page':
            loadCustomerOptions();
            break;
        case 'stats-page':
            updateStatistics();
            break;
    }
}

// 更新底部导航状态
function updateNavigation(activePageId) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    // 根据页面设置对应的导航项为活跃状态
    const navMap = {
        'home-page': 0,
        'orders-page': 1,
        'add-order-page': 1,
        'customers-page': 2,
        'add-customer-page': 2,
        'stats-page': 3
    };
    
    const navIndex = navMap[activePageId];
    if (navIndex !== undefined) {
        navItems[navIndex].classList.add('active');
    }
}

// 更新首页仪表板
function updateDashboard() {
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    // 计算今日收入
    const todayIncome = orders
        .filter(order => new Date(order.date).toDateString() === today)
        .reduce((sum, order) => sum + order.actualIncome, 0);
    
    // 计算本月收入
    const monthIncome = orders
        .filter(order => {
            const orderDate = new Date(order.date);
            return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
        })
        .reduce((sum, order) => sum + order.actualIncome, 0);
    
    // 更新显示
    document.getElementById('today-income').textContent = `¥${todayIncome}`;
    document.getElementById('month-income').textContent = `¥${monthIncome}`;
    document.getElementById('total-orders').textContent = orders.length;
    document.getElementById('total-customers').textContent = customers.length;
}

// 保存数据到本地存储
function saveData() {
    localStorage.setItem('yunmiao_orders', JSON.stringify(orders));
    localStorage.setItem('yunmiao_customers', JSON.stringify(customers));
}

// 客户表单提交
document.getElementById('customer-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customer = {
        id: Date.now(),
        name: document.getElementById('customer-name').value,
        contact: document.getElementById('customer-contact').value,
        level: document.getElementById('customer-level').value,
        gamePreference: document.getElementById('game-preference').value,
        notes: document.getElementById('customer-notes').value,
        createDate: new Date().toISOString(),
        totalSpent: 0,
        orderCount: 0
    };
    
    customers.push(customer);
    saveData();
    
    // 清空表单
    this.reset();
    
    // 显示成功消息
    alert('客户添加成功！');
    
    // 返回客户列表页面
    showPage('customers-page');
});

// 保单表单提交
document.getElementById('order-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerId = parseInt(document.getElementById('customer-select').value);
    const serviceType = document.getElementById('service-type').value;
    const hours = parseFloat(document.getElementById('service-hours').value);
    const rate = parseFloat(document.getElementById('hourly-rate').value);
    const platformFee = parseFloat(document.getElementById('platform-fee').value) || 0;
    const notes = document.getElementById('order-notes').value;
    
    const totalAmount = hours * rate;
    const actualIncome = totalAmount - platformFee;
    
    const order = {
        id: Date.now(),
        customerId: customerId,
        serviceType: serviceType,
        hours: hours,
        rate: rate,
        totalAmount: totalAmount,
        platformFee: platformFee,
        actualIncome: actualIncome,
        notes: notes,
        date: new Date().toISOString(),
        status: '已完成'
    };
    
    orders.push(order);
    
    // 更新客户统计
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        customer.totalSpent += actualIncome;
        customer.orderCount += 1;
    }
    
    saveData();
    
    // 清空表单
    this.reset();
    
    // 显示成功消息
    alert('保单添加成功！');
    
    // 返回保单列表页面
    showPage('orders-page');
});

// 加载客户选项
function loadCustomerOptions() {
    const select = document.getElementById('customer-select');
    select.innerHTML = '<option value="">请选择客户</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (${customer.level})`;
        select.appendChild(option);
    });
}

// 加载保单列表
function loadOrdersList() {
    const container = document.getElementById('orders-list');
    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无保单记录</p>';
        return;
    }
    
    // 按日期倒序排列
    const sortedOrders = orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedOrders.forEach(order => {
        const customer = customers.find(c => c.id === order.customerId);
        const customerName = customer ? customer.name : '未知客户';
        
        const orderElement = document.createElement('div');
        orderElement.className = 'list-item';
        orderElement.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${customerName} - ${order.serviceType}</div>
                <div class="list-item-amount">¥${order.actualIncome}</div>
            </div>
            <div class="list-item-meta">
                ${new Date(order.date).toLocaleDateString()} | ${order.hours}小时 | ${order.rate}元/小时
                ${order.notes ? ' | ' + order.notes : ''}
            </div>
        `;
        
        // 点击查看详情
        orderElement.addEventListener('click', () => {
            showOrderDetail(order);
        });
        
        container.appendChild(orderElement);
    });
}

// 加载客户列表
function loadCustomersList() {
    const container = document.getElementById('customers-list');
    container.innerHTML = '';
    
    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">暂无客户记录</p>';
        return;
    }
    
    customers.forEach(customer => {
        const customerElement = document.createElement('div');
        customerElement.className = 'list-item';
        customerElement.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${customer.name} (${customer.level})</div>
                <div class="list-item-amount">¥${customer.totalSpent}</div>
            </div>
            <div class="list-item-meta">
                ${customer.contact} | ${customer.orderCount}单 | ${customer.gamePreference || '无偏好'}
            </div>
        `;
        
        // 点击查看详情
        customerElement.addEventListener('click', () => {
            showCustomerDetail(customer);
        });
        
        container.appendChild(customerElement);
    });
}

// 显示保单详情
function showOrderDetail(order) {
    const customer = customers.find(c => c.id === order.customerId);
    const customerName = customer ? customer.name : '未知客户';
    
    const detail = `
保单详情：

客户：${customerName}
服务类型：${order.serviceType}
服务时长：${order.hours}小时
收费标准：${order.rate}元/小时
总金额：¥${order.totalAmount}
平台抽成：¥${order.platformFee}
实际收入：¥${order.actualIncome}
日期：${new Date(order.date).toLocaleString()}
备注：${order.notes || '无'}
    `;
    
    alert(detail);
}

// 显示客户详情
function showCustomerDetail(customer) {
    const detail = `
客户详情：

姓名：${customer.name}
等级：${customer.level}
联系方式：${customer.contact}
游戏偏好：${customer.gamePreference || '无'}
总消费：¥${customer.totalSpent}
订单数量：${customer.orderCount}单
注册时间：${new Date(customer.createDate).toLocaleDateString()}
备注：${customer.notes || '无'}
    `;
    
    alert(detail);
}

// 更新统计页面
function updateStatistics() {
    const today = new Date();
    const todayStr = today.toDateString();
    
    // 获取本周开始日期
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    // 获取本月开始日期
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 计算各时期收入
    const todayIncome = orders
        .filter(order => new Date(order.date).toDateString() === todayStr)
        .reduce((sum, order) => sum + order.actualIncome, 0);
    
    const weekIncome = orders
        .filter(order => new Date(order.date) >= weekStart)
        .reduce((sum, order) => sum + order.actualIncome, 0);
    
    const monthIncome = orders
        .filter(order => new Date(order.date) >= monthStart)
        .reduce((sum, order) => sum + order.actualIncome, 0);
    
    const totalIncome = orders.reduce((sum, order) => sum + order.actualIncome, 0);
    
    // 更新显示
    document.getElementById('stats-today').textContent = `¥${todayIncome}`;
    document.getElementById('stats-week').textContent = `¥${weekIncome}`;
    document.getElementById('stats-month').textContent = `¥${monthIncome}`;
    document.getElementById('stats-total').textContent = `¥${totalIncome}`;
    
    // 显示收入明细
    loadIncomeDetails();
}

// 加载收入明细
function loadIncomeDetails() {
    const container = document.getElementById('income-details');
    container.innerHTML = '';
    
    // 按日期分组统计
    const dailyIncome = {};
    orders.forEach(order => {
        const date = new Date(order.date).toLocaleDateString();
        if (!dailyIncome[date]) {
            dailyIncome[date] = 0;
        }
        dailyIncome[date] += order.actualIncome;
    });
    
    // 按日期倒序显示最近7天
    const dates = Object.keys(dailyIncome).sort((a, b) => new Date(b) - new Date(a)).slice(0, 7);
    
    dates.forEach(date => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-header">
                <div class="list-item-title">${date}</div>
                <div class="list-item-amount">¥${dailyIncome[date]}</div>
            </div>
        `;
        container.appendChild(item);
    });
    
    if (dates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">暂无收入记录</p>';
    }
}

// 导出数据
function exportData() {
    const data = {
        orders: orders,
        customers: customers,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `云喵Club财务数据_${new Date().toLocaleDateString()}.json`;
    link.click();
    
    alert('数据导出成功！');
}

// 清空数据
function clearData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        orders = [];
        customers = [];
        saveData();
        updateDashboard();
        alert('数据已清空！');
        showPage('home-page');
    }
}

// 显示帮助
function showHelp() {
    const help = `
云喵Club财务系统使用帮助：

1. 添加客户：
   - 点击"添加客户"按钮
   - 填写客户基本信息
   - 选择客户等级

2. 创建保单：
   - 点击"新增保单"按钮
   - 选择客户和服务类型
   - 填写时长和收费标准
   - 系统自动计算收入

3. 查看统计：
   - 首页显示基本统计
   - 统计页面显示详细数据
   - 支持按时间查看收入

4. 数据管理：
   - 支持导出数据备份
   - 可以清空所有数据
   - 数据自动保存到本地

如有问题，请联系技术支持！
    `;
    
    alert(help);
}

// 显示关于信息
function showAbout() {
    const about = `
云喵Club财务管理系统 v1.0

专为云喵Club俱乐部陪玩师设计的财务管理工具

功能特色：
✨ 简单易用的界面设计
📋 完整的保单管理功能
👥 客户信息管理
📊 实时财务统计
💾 本地数据存储

开发团队：云喵Club技术部
版本：1.0.0
更新时间：2024年9月

感谢您的使用！🐱
    `;
    
    alert(about);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化首页数据
    updateDashboard();
    
    // 如果没有客户，显示提示
    if (customers.length === 0) {
        setTimeout(() => {
            if (confirm('检测到您还没有添加客户，是否现在添加第一个客户？')) {
                showPage('add-customer-page');
            }
        }, 1000);
    }
});

// 添加一些示例数据（仅用于演示）
function addSampleData() {
    if (customers.length === 0 && orders.length === 0) {
        // 添加示例客户
        const sampleCustomers = [
            {
                id: 1,
                name: '小明',
                contact: '13800138001',
                level: 'VIP',
                gamePreference: '王者荣耀',
                notes: '技术很好，经常约',
                createDate: new Date().toISOString(),
                totalSpent: 200,
                orderCount: 4
            },
            {
                id: 2,
                name: '小红',
                contact: '13800138002',
                level: '普通',
                gamePreference: '和平精英',
                notes: '新客户',
                createDate: new Date().toISOString(),
                totalSpent: 50,
                orderCount: 1
            }
        ];
        
        // 添加示例保单
        const sampleOrders = [
            {
                id: 1,
                customerId: 1,
                serviceType: '游戏陪玩',
                hours: 2,
                rate: 30,
                totalAmount: 60,
                platformFee: 10,
                actualIncome: 50,
                notes: '王者荣耀上分',
                date: new Date().toISOString(),
                status: '已完成'
            },
            {
                id: 2,
                customerId: 2,
                serviceType: '游戏陪玩',
                hours: 1,
                rate: 25,
                totalAmount: 25,
                platformFee: 5,
                actualIncome: 20,
                notes: '和平精英娱乐',
                date: new Date(Date.now() - 86400000).toISOString(), // 昨天
                status: '已完成'
            }
        ];
        
        customers = sampleCustomers;
        orders = sampleOrders;
        saveData();
        updateDashboard();
    }
}

// 如果是第一次使用，添加示例数据
if (localStorage.getItem('yunmiao_first_time') === null) {
    localStorage.setItem('yunmiao_first_time', 'false');
    addSampleData();
}

