// 全局变量
let currentGoal = null;
let deadline = null;
let countdownInterval = null;
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let checkinData = JSON.parse(localStorage.getItem('checkinData')) || {};
let currentLanguage = localStorage.getItem('language') || 'zh';
let visitorCount = parseInt(localStorage.getItem('visitorCount')) || 1234;
let milestones = JSON.parse(localStorage.getItem('milestones')) || [];

// 积分系统
let userPoints = parseInt(localStorage.getItem('userPoints')) || 0;
let lastLoginDate = localStorage.getItem('lastLoginDate') || null;
let isRegistered = localStorage.getItem('isRegistered') === 'true';
let referralCount = parseInt(localStorage.getItem('referralCount')) || 0;

// 积分规则配置
const POINT_RULES = {
    REGISTRATION: 10,      // 注册奖励
    DAILY_LOGIN: 15,       // 每日首次登录
    TASK_COMPLETION: 3,    // 完成每日清单一条
    MILESTONE_COMPLETION: 20, // 完成里程碑
    REFERRAL: 18          // 推荐好友
};

// 多目标管理系统
let learningGoals = JSON.parse(localStorage.getItem('learningGoals')) || [];
let currentGoalId = localStorage.getItem('currentGoalId') || null;

// 预设类别
const PRESET_CATEGORIES = {
    STUDY: { name: '学习', color: '#4CAF50', icon: '📚' },
    WORK: { name: '工作', color: '#2196F3', icon: '💼' },
    HEALTH: { name: '健康', color: '#FF9800', icon: '🏃' },
    HOBBY: { name: '兴趣', color: '#9C27B0', icon: '🎨' },
    SKILL: { name: '技能', color: '#F44336', icon: '🛠️' },
    LANGUAGE: { name: '语言', color: '#00BCD4', icon: '🗣️' },
    FITNESS: { name: '健身', color: '#8BC34A', icon: '💪' },
    READING: { name: '阅读', color: '#795548', icon: '📖' }
};

// 优先级配置
const PRIORITY_LEVELS = {
    HIGH: { name: '高优先级', value: 3, color: '#F44336', icon: '🔥' },
    MEDIUM: { name: '中优先级', value: 2, color: '#FF9800', icon: '⚡' },
    LOW: { name: '低优先级', value: 1, color: '#4CAF50', icon: '📌' }
};

// 颜色管理
const GOAL_COLORS = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#00BCD4', '#8BC34A', '#795548', '#607D8B', '#E91E63',
    '#3F51B5', '#009688', '#CDDC39', '#FF5722', '#9E9E9E'
];

// DOM 元素
const goalInput = document.getElementById('goalInput');
const deadlineInput = document.getElementById('deadlineInput');
const setGoalBtn = document.getElementById('setGoalBtn');
const currentGoalDiv = document.getElementById('currentGoal');
const goalText = document.getElementById('goalText');
const goalDeadline = document.getElementById('goalDeadline');
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const checkinBtn = document.getElementById('checkinBtn');
const checkinStatus = document.getElementById('checkinStatus');
const exportBtn = document.getElementById('exportBtn');
const langBtn = document.getElementById('langBtn');
const loginTrigger = document.getElementById('loginTrigger');
const authPanel = document.getElementById('authPanel');
const authClose = document.getElementById('authClose');
const visitorCountElement = document.getElementById('visitorCount');
const milestoneInput = document.getElementById('milestoneInput');
const milestoneDate = document.getElementById('milestoneDate');
const addMilestoneBtn = document.getElementById('addMilestoneBtn');
const milestoneList = document.getElementById('milestoneList');
const exportIcsBtn = document.getElementById('exportIcsBtn');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const progressPathSvg = document.querySelector('.progress-path-svg');
const characterElement = document.getElementById('character');
let milestonesContainer = document.getElementById('milestonesContainer');
const encouragementBubble = document.getElementById('encouragementBubble');
const bubbleText = document.getElementById('bubbleText');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadGoal();
    loadTasks();
    loadMilestones();
    updateProgress();
    generateCalendar();
    updateCheckinStatus();
    initializeLanguage();
    initializeAuth();
    updateVisitorCount();
    initializeMilestones();
    initializeExport();
    initializeProgressPath();
    initializePointsSystem(); // 初始化积分系统
    initializeMultiGoalSystem(); // 初始化多目标系统
    
    // 设置今天的日期为默认截止日期
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 7); // 默认一周后
    if (deadlineInput) {
        deadlineInput.value = tomorrow.toISOString().split('T')[0];
    }
});

// 设置学习目标 - 检查元素是否存在
if (setGoalBtn) {
    setGoalBtn.addEventListener('click', function() {
        const goal = goalInput.value.trim();
        const deadlineValue = deadlineInput.value;
    
    if (!goal || !deadlineValue) {
        alert('请输入学习目标和截止日期！');
        return;
    }
    
    currentGoal = goal;
    deadline = new Date(deadlineValue);
    
    // 保存到本地存储
    localStorage.setItem('currentGoal', currentGoal);
    localStorage.setItem('deadline', deadline.toISOString());
    
    displayGoal();
    startCountdown();
    
    goalInput.value = '';
    });
}

// 显示当前目标
function displayGoal() {
    if (currentGoal && deadline) {
        goalText.textContent = currentGoal;
        const deadlineLabel = currentLanguage === 'zh' ? '截止日期: ' : 'Deadline: ';
        const dateFormat = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';
        goalDeadline.textContent = `${deadlineLabel}${deadline.toLocaleDateString(dateFormat)}`;
        currentGoalDiv.style.display = 'block';
    }
}

// 加载保存的目标
function loadGoal() {
    const savedGoal = localStorage.getItem('currentGoal');
    const savedDeadline = localStorage.getItem('deadline');
    
    if (savedGoal && savedDeadline) {
        currentGoal = savedGoal;
        deadline = new Date(savedDeadline);
        displayGoal();
        startCountdown();
    }
}

// 多目标倒计时功能
function startCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}

function updateCountdown() {
    const currentGoal = getCurrentGoal();
    
    // 如果没有当前目标，显示最高优先级目标的倒计时
    let targetGoal = currentGoal;
    if (!targetGoal && learningGoals.length > 0) {
        const sortedGoals = getGoalsByPriority();
        targetGoal = sortedGoals[0];
    }
    
    if (!targetGoal || !targetGoal.deadline) {
        // 没有目标时显示空状态
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        updateCountdownDisplay(null);
        return;
    }
    
    const now = new Date().getTime();
    const deadlineTime = new Date(targetGoal.deadline).getTime();
    const distance = deadlineTime - now;
    
    if (distance < 0) {
        document.getElementById('days').textContent = '0';
        document.getElementById('hours').textContent = '0';
        document.getElementById('minutes').textContent = '0';
        document.getElementById('seconds').textContent = '0';
        updateCountdownDisplay(targetGoal, true);
        return;
    }
    
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // 优化大数字显示
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    daysElement.textContent = days.toLocaleString();
    hoursElement.textContent = hours.toString().padStart(2, '0');
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = seconds.toString().padStart(2, '0');
    
    // 动态调整字体大小
    if (days >= 1000) {
        daysElement.style.fontSize = 'clamp(1.2rem, 3vw, 1.6rem)';
    } else if (days >= 100) {
        daysElement.style.fontSize = 'clamp(1.4rem, 3.5vw, 1.8rem)';
    } else {
        daysElement.style.fontSize = 'clamp(1.5rem, 4vw, 2rem)';
    }
    
    // 更新倒计时显示样式
    updateCountdownDisplay(targetGoal, false);
}

function updateCountdownDisplay(goal, isExpired = false) {
    const countdownSection = document.querySelector('.countdown-section');
    const countdownDisplay = document.querySelector('.countdown-display');
    
    if (!goal) {
        // 没有目标时的显示
        countdownSection.style.setProperty('--countdown-color', '#6c757d');
        if (countdownDisplay) {
            countdownDisplay.style.opacity = '0.5';
        }
        return;
    }
    
    // 设置目标颜色
    countdownSection.style.setProperty('--countdown-color', goal.color);
    
    if (countdownDisplay) {
        countdownDisplay.style.opacity = isExpired ? '0.6' : '1';
    }
    
    // 更新倒计时标题显示目标信息
    const countdownTitle = countdownSection.querySelector('h2');
    if (countdownTitle) {
        const category = PRESET_CATEGORIES[goal.category];
        const priority = PRIORITY_LEVELS[goal.priority];
        const titleText = currentLanguage === 'zh' ? '倒计时' : 'Countdown';
        
        countdownTitle.innerHTML = `
            <i class="fas fa-clock"></i> 
            <span data-zh="倒计时" data-en="Countdown">${titleText}</span>
            <div class="countdown-goal-info">
                <span class="goal-name" style="color: ${goal.color}">${goal.title}</span>
                <span class="goal-priority" style="color: ${priority.color}">${priority.icon} ${priority.name}</span>
                ${category ? `<span class="goal-category">${category.icon} ${category.name}</span>` : ''}
            </div>
        `;
    }
}

// 任务管理
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

function addTask() {
    const taskText = taskInput.value.trim();
    if (!taskText) return;
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        date: new Date().toDateString()
    };
    
    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
}

function renderTasks() {
    const today = new Date().toDateString();
    const todayTasks = tasks.filter(task => task.date === today);
    
    taskList.innerHTML = '';
    
    todayTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                   onchange="toggleTask(${task.id})">
            <span class="task-text">${task.text}</span>
            <button class="task-delete" onclick="deleteTask(${task.id})">删除</button>
        `;
        
        taskList.appendChild(li);
    });
}

function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        
        // 如果任务从未完成变为完成，给予积分奖励
        if (!wasCompleted && task.completed) {
            awardPoints(POINT_RULES.TASK_COMPLETION, '完成任务');
        }
        
        saveTasks();
        renderTasks();
        updateProgress();
    }
}

function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderTasks();
    updateProgress();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    renderTasks();
}

// 打卡功能
checkinBtn.addEventListener('click', function() {
    const today = new Date().toDateString();
    
    if (checkinData[today]) {
        const alertText = currentLanguage === 'zh' ? '今天已经打卡了！' : 'Already checked in today!';
    alert(alertText);
        return;
    }
    
    checkinData[today] = {
        date: today,
        timestamp: new Date().toISOString(),
        tasksCompleted: tasks.filter(t => t.date === today && t.completed).length,
        totalTasks: tasks.filter(t => t.date === today).length
    };
    
    localStorage.setItem('checkinData', JSON.stringify(checkinData));
    updateCheckinStatus();
    updateProgress();
    generateCalendar();
    
    // 添加打卡成功的视觉反馈
    const successText = currentLanguage === 'zh' ? '打卡成功！' : 'Check-in Success!';
    const originalText = currentLanguage === 'zh' ? '今日打卡' : 'Daily Check-in';
    
    checkinBtn.textContent = successText;
    checkinBtn.style.background = '#28a745';
    setTimeout(() => {
        checkinBtn.textContent = originalText;
        checkinBtn.style.background = '';
    }, 2000);
});

function updateCheckinStatus() {
    const today = new Date().toDateString();
    
    if (checkinData[today]) {
        checkinBtn.disabled = true;
        checkinBtn.style.opacity = '0.6';
    } else {
        checkinBtn.disabled = false;
        checkinBtn.style.opacity = '1';
    }
    
    updateCheckinStatusText();
}

// 进度分析
function updateProgress() {
    const totalDaysElement = document.getElementById('totalDays');
    const checkedDaysElement = document.getElementById('checkedDays');
    const completionRateElement = document.getElementById('completionRate');
    const progressFill = document.getElementById('progressFill');
    
    // 获取当前目标
    const currentGoal = getCurrentGoal();
    
    if (!currentGoal) {
        totalDaysElement.textContent = '0';
        checkedDaysElement.textContent = '0';
        completionRateElement.textContent = '0%';
        progressFill.style.width = '0%';
        updateProgressByCategory();
        return;
    }
    
    const startDate = new Date(currentGoal.startDate || new Date().toISOString());
    const deadline = new Date(currentGoal.deadline);
    const now = new Date();
    const totalDays = Math.ceil((deadline - startDate) / (1000 * 60 * 60 * 24));
    
    // 计算当前目标的打卡天数
    const goalCheckedDays = Object.keys(checkinData).filter(date => {
        const checkDate = new Date(date);
        return checkDate >= startDate && checkDate <= deadline;
    }).length;
    
    const completionRate = totalDays > 0 ? Math.round((goalCheckedDays / totalDays) * 100) : 0;
    
    totalDaysElement.textContent = totalDays;
    checkedDaysElement.textContent = goalCheckedDays;
    completionRateElement.textContent = `${completionRate}%`;
    
    // 使用目标颜色更新进度条
    progressFill.style.width = `${completionRate}%`;
    progressFill.style.background = `linear-gradient(90deg, ${currentGoal.color}, ${currentGoal.color}aa)`;
    
    // 更新分类进度显示
    updateProgressByCategory();
    
    // 更新进度路径
    updateProgressPath();
}

// 按类别和优先级显示进度分析
function updateProgressByCategory() {
    const progressContainer = document.querySelector('.progress-analysis');
    if (!progressContainer) return;
    
    // 创建或更新分类进度显示区域
    let categoryProgressDiv = document.getElementById('categoryProgress');
    if (!categoryProgressDiv) {
        categoryProgressDiv = document.createElement('div');
        categoryProgressDiv.id = 'categoryProgress';
        categoryProgressDiv.className = 'category-progress';
        progressContainer.appendChild(categoryProgressDiv);
    }
    
    // 按优先级排序目标
    const sortedGoals = getGoalsByPriority();
    
    if (sortedGoals.length === 0) {
        categoryProgressDiv.innerHTML = '<p class="no-goals">暂无学习目标</p>';
        return;
    }
    
    let html = '<h4>目标进度分析</h4>';
    
    // 按优先级分组显示
    const priorityGroups = {
        HIGH: sortedGoals.filter(g => g.priority === 'HIGH'),
        MEDIUM: sortedGoals.filter(g => g.priority === 'MEDIUM'),
        LOW: sortedGoals.filter(g => g.priority === 'LOW')
    };
    
    Object.entries(priorityGroups).forEach(([priority, goals]) => {
        if (goals.length === 0) return;
        
        const priorityInfo = PRIORITY_LEVELS[priority];
        html += `
            <div class="priority-group" data-priority="${priority}">
                <h5 class="priority-header" style="color: ${priorityInfo.color}">
                    ${priorityInfo.icon} ${priorityInfo.name}
                </h5>
                <div class="goals-progress">
        `;
        
        goals.forEach(goal => {
            const progress = calculateGoalProgress(goal);
            const category = PRESET_CATEGORIES[goal.category] || { name: goal.category, color: goal.color, icon: '📋' };
            
            html += `
                <div class="goal-progress-item" data-goal-id="${goal.id}">
                    <div class="goal-info">
                        <span class="goal-icon" style="color: ${category.color}">${category.icon}</span>
                        <span class="goal-title">${goal.title}</span>
                        <span class="goal-category" style="background: ${category.color}20; color: ${category.color}">
                            ${category.name}
                        </span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" 
                                 style="width: ${progress.percentage}%; background: ${goal.color}"></div>
                        </div>
                        <span class="progress-text">${progress.percentage}%</span>
                    </div>
                    <div class="goal-stats">
                        <span class="stat-item">${progress.completedDays}/${progress.totalDays} 天</span>
                        <span class="stat-item">${progress.remainingDays} 天剩余</span>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    categoryProgressDiv.innerHTML = html;
}

// 计算单个目标的进度
function calculateGoalProgress(goal) {
    const startDate = new Date(goal.startDate || goal.createdAt);
    const deadline = new Date(goal.deadline);
    const now = new Date();
    
    const totalDays = Math.ceil((deadline - startDate) / (1000 * 60 * 60 * 24));
    const passedDays = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
    
    // 计算该目标相关的打卡天数
    const completedDays = Object.keys(checkinData).filter(date => {
        const checkDate = new Date(date);
        return checkDate >= startDate && checkDate <= deadline;
    }).length;
    
    const percentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    return {
        totalDays,
        completedDays,
        remainingDays,
        percentage,
        isExpired: now > deadline
    };
}

// 日历功能
function generateCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    
    // 添加星期标题
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-header';
        dayElement.textContent = day;
        calendar.appendChild(dayElement);
    });
    
    // 获取当前月份信息
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = firstDay.getDay();
    
    // 添加空白日期
    for (let i = 0; i < startDate; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day';
        calendar.appendChild(emptyDay);
    }
    
    // 获取所有目标用于日期标记
    const allGoals = learningGoals || [];
    
    // 添加月份日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;
        
        const currentDate = new Date(year, month, day);
        const dateString = currentDate.toDateString();
        
        // 检查是否已打卡
        if (checkinData[dateString]) {
            dayElement.classList.add('checked');
            
            // 为打卡日期添加目标相关的颜色标记
            const activeGoalsOnDate = getActiveGoalsOnDate(currentDate);
            if (activeGoalsOnDate.length > 0) {
                // 按优先级排序，使用最高优先级目标的颜色
                const sortedGoals = activeGoalsOnDate.sort((a, b) => {
                    const priorityA = PRIORITY_LEVELS[a.priority]?.value || 0;
                    const priorityB = PRIORITY_LEVELS[b.priority]?.value || 0;
                    return priorityB - priorityA;
                });
                
                const primaryGoal = sortedGoals[0];
                dayElement.style.setProperty('--goal-color', primaryGoal.color);
                dayElement.classList.add('has-goal');
                
                // 如果有多个目标，添加多目标标记
                if (activeGoalsOnDate.length > 1) {
                    dayElement.classList.add('multi-goals');
                    
                    // 创建目标指示器
                    const goalIndicators = document.createElement('div');
                    goalIndicators.className = 'goal-indicators';
                    
                    activeGoalsOnDate.slice(0, 3).forEach(goal => {
                        const indicator = document.createElement('div');
                        indicator.className = 'goal-indicator';
                        indicator.style.backgroundColor = goal.color;
                        indicator.title = goal.title;
                        goalIndicators.appendChild(indicator);
                    });
                    
                    if (activeGoalsOnDate.length > 3) {
                        const moreIndicator = document.createElement('div');
                        moreIndicator.className = 'goal-indicator more';
                        moreIndicator.textContent = `+${activeGoalsOnDate.length - 3}`;
                        moreIndicator.title = `还有${activeGoalsOnDate.length - 3}个目标`;
                        goalIndicators.appendChild(moreIndicator);
                    }
                    
                    dayElement.appendChild(goalIndicators);
                }
                
                // 添加目标信息到tooltip
                const goalTitles = activeGoalsOnDate.map(g => g.title).join(', ');
                dayElement.title = `已打卡 - 目标: ${goalTitles}`;
            }
        } else {
            // 未打卡但有活跃目标的日期
            const activeGoalsOnDate = getActiveGoalsOnDate(currentDate);
            if (activeGoalsOnDate.length > 0) {
                dayElement.classList.add('has-pending-goals');
                const goalTitles = activeGoalsOnDate.map(g => g.title).join(', ');
                dayElement.title = `待打卡 - 目标: ${goalTitles}`;
            }
        }
        
        // 标记今天
        if (day === now.getDate() && month === now.getMonth() && year === now.getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // 添加点击事件显示当日目标详情
        dayElement.addEventListener('click', () => showDayGoalDetails(currentDate, activeGoalsOnDate || []));
        
        calendar.appendChild(dayElement);
    }
}

// 获取指定日期的活跃目标
function getActiveGoalsOnDate(date) {
    return learningGoals.filter(goal => {
        const goalStart = new Date(goal.startDate || goal.createdAt);
        const goalEnd = new Date(goal.deadline);
        return date >= goalStart && date <= goalEnd;
    });
}

// 显示当日目标详情
function showDayGoalDetails(date, goals) {
    if (goals.length === 0) return;
    
    const dateStr = date.toLocaleDateString('zh-CN');
    const isCheckedIn = checkinData[date.toDateString()];
    
    let content = `<h4>${dateStr}</h4>`;
    content += `<p class="checkin-status ${isCheckedIn ? 'checked' : 'unchecked'}">`;
    content += isCheckedIn ? '✅ 已打卡' : '⏰ 待打卡';
    content += '</p>';
    
    if (goals.length > 0) {
        content += '<div class="day-goals">';
        goals.forEach(goal => {
            const category = PRESET_CATEGORIES[goal.category] || { name: goal.category, icon: '📋' };
            const priority = PRIORITY_LEVELS[goal.priority] || PRIORITY_LEVELS.MEDIUM;
            
            content += `
                <div class="day-goal-item" style="border-left: 4px solid ${goal.color}">
                    <div class="goal-header">
                        <span class="goal-icon">${category.icon}</span>
                        <span class="goal-title">${goal.title}</span>
                        <span class="priority-badge" style="background: ${priority.color}20; color: ${priority.color}">
                            ${priority.icon} ${priority.name}
                        </span>
                    </div>
                    <div class="goal-category" style="color: ${goal.color}">${category.name}</div>
                </div>
            `;
        });
        content += '</div>';
    }
    
    // 创建模态框显示详情
    showModal('日期详情', content);
}

// 通用模态框函数
function showModal(title, content) {
    // 移除已存在的模态框
    const existingModal = document.querySelector('.day-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'day-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">${content}</div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 添加关闭事件
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());
    
    // 显示动画
    setTimeout(() => modal.classList.add('show'), 10);
}

// 里程碑功能
function initializeMilestones() {
    addMilestoneBtn.addEventListener('click', addMilestone);
    milestoneInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addMilestone();
        }
    });
    
    // 设置默认日期为今天
    const today = new Date();
    milestoneDate.value = today.toISOString().split('T')[0];
}

function addMilestone() {
    const title = milestoneInput.value.trim();
    const date = milestoneDate.value;
    
    if (!title || !date) {
        const alertText = currentLanguage === 'zh' ? '请填写里程碑标题和日期！' : 'Please fill in milestone title and date!';
        alert(alertText);
        return;
    }
    
    const milestone = {
        id: Date.now(),
        title: title,
        date: date,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    milestones.push(milestone);
    saveMilestones();
    renderMilestones();
    
    milestoneInput.value = '';
    milestoneDate.value = new Date().toISOString().split('T')[0];
}

function renderMilestones() {
    milestoneList.innerHTML = '';
    
    // 按日期排序
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedMilestones.forEach(milestone => {
        const milestoneElement = document.createElement('div');
        milestoneElement.className = `milestone-item ${milestone.completed ? 'completed' : ''}`;
        
        const formattedDate = new Date(milestone.date).toLocaleDateString(
            currentLanguage === 'zh' ? 'zh-CN' : 'en-US'
        );
        
        const toggleText = milestone.completed 
            ? (currentLanguage === 'zh' ? '已完成' : 'Completed')
            : (currentLanguage === 'zh' ? '标记完成' : 'Mark Done');
            
        const deleteText = currentLanguage === 'zh' ? '删除' : 'Delete';
        
        milestoneElement.innerHTML = `
            <div class="milestone-content">
                <div class="milestone-title">${milestone.title}</div>
                <div class="milestone-date-display">${formattedDate}</div>
            </div>
            <div class="milestone-actions">
                <button class="milestone-toggle ${milestone.completed ? 'completed' : ''}" 
                        onclick="toggleMilestone(${milestone.id})">
                    ${toggleText}
                </button>
                <button class="milestone-delete" onclick="deleteMilestone(${milestone.id})">
                    ${deleteText}
                </button>
            </div>
        `;
        
        milestoneList.appendChild(milestoneElement);
    });
    
    // 更新进度路径
    updateProgressPath();
}

function createMilestoneMarker(milestone, index, x, y) {
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    marker.classList.add('milestone-marker');
    marker.setAttribute('transform', `translate(${x}, ${y})`);
    
    // 标牌阴影
    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    shadow.setAttribute('x', '-27');
    shadow.setAttribute('y', '-13');
    shadow.setAttribute('width', '54');
    shadow.setAttribute('height', '26');
    shadow.setAttribute('rx', '10');
    shadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
    shadow.setAttribute('filter', 'blur(2px)');
    
    // 标牌背景渐变
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', '-25');
    background.setAttribute('y', '-15');
    background.setAttribute('width', '50');
    background.setAttribute('height', '24');
    background.setAttribute('rx', '8');
    
    if (milestone.completed) {
        background.setAttribute('fill', 'url(#completedGradient)');
        background.setAttribute('stroke', '#2e7d32');
    } else {
        background.setAttribute('fill', 'url(#pendingGradient)');
        background.setAttribute('stroke', '#f57c00');
    }
    background.setAttribute('stroke-width', '2');
    
    // 标牌装饰边框
    const border = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    border.setAttribute('x', '-23');
    border.setAttribute('y', '-13');
    border.setAttribute('width', '46');
    border.setAttribute('height', '20');
    border.setAttribute('rx', '6');
    border.setAttribute('fill', 'none');
    border.setAttribute('stroke', 'rgba(255,255,255,0.5)');
    border.setAttribute('stroke-width', '1');
    
    // 里程碑图标
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    if (milestone.completed) {
        // 完成图标（勾号）
        const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        checkPath.setAttribute('d', 'M -18,-8 L -15,-5 L -12,-8');
        checkPath.setAttribute('stroke', '#fff');
        checkPath.setAttribute('stroke-width', '2');
        checkPath.setAttribute('fill', 'none');
        checkPath.setAttribute('stroke-linecap', 'round');
        icon.appendChild(checkPath);
    } else {
        // 未完成图标（旗帜）
        const flagPole = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        flagPole.setAttribute('x1', '-18');
        flagPole.setAttribute('y1', '-10');
        flagPole.setAttribute('x2', '-18');
        flagPole.setAttribute('y2', '-2');
        flagPole.setAttribute('stroke', '#fff');
        flagPole.setAttribute('stroke-width', '1.5');
        
        const flag = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        flag.setAttribute('points', '-18,-10 -12,-8 -18,-6');
        flag.setAttribute('fill', '#fff');
        flag.setAttribute('opacity', '0.9');
        
        icon.appendChild(flagPole);
        icon.appendChild(flag);
    }
    
    // 标牌文字
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '3');
    text.setAttribute('y', '-5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '9');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.textContent = milestone.title.length > 5 ? milestone.title.substring(0, 5) + '...' : milestone.title;
    
    // 里程碑序号
    const number = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    number.setAttribute('cx', '18');
    number.setAttribute('cy', '-10');
    number.setAttribute('r', '6');
    number.setAttribute('fill', milestone.completed ? '#2e7d32' : '#f57c00');
    number.setAttribute('stroke', '#fff');
    number.setAttribute('stroke-width', '1');
    
    const numberText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    numberText.setAttribute('x', '18');
    numberText.setAttribute('y', '-7');
    numberText.setAttribute('text-anchor', 'middle');
    numberText.setAttribute('fill', '#fff');
    numberText.setAttribute('font-size', '8');
    numberText.setAttribute('font-weight', 'bold');
    numberText.textContent = index + 1;
    
    // 悬浮效果
    marker.addEventListener('mouseenter', () => {
        marker.style.transform = `translate(${x}px, ${y}px) scale(1.1)`;
        marker.style.transition = 'transform 0.3s ease';
    });
    
    marker.addEventListener('mouseleave', () => {
        marker.style.transform = `translate(${x}px, ${y}px) scale(1)`;
    });
    
    // 点击显示详情
    marker.addEventListener('click', () => {
        showMilestoneDetails(milestone, x, y);
    });
    
    marker.appendChild(shadow);
    marker.appendChild(background);
    marker.appendChild(border);
    marker.appendChild(icon);
    marker.appendChild(text);
    marker.appendChild(number);
    marker.appendChild(numberText);
    
    return marker;
}

function toggleMilestone(milestoneId) {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (milestone) {
        const wasCompleted = milestone.completed;
        milestone.completed = !milestone.completed;
        
        // 如果里程碑从未完成变为完成，给予积分奖励
        if (!wasCompleted && milestone.completed) {
            awardPoints(POINT_RULES.MILESTONE_COMPLETION, '完成里程碑');
        }
        
        saveMilestones();
        renderMilestones();
        updateProgressPath();
    }
}

function deleteMilestone(milestoneId) {
    const confirmText = currentLanguage === 'zh' ? '确定要删除这个里程碑吗？' : 'Are you sure you want to delete this milestone?';
    if (confirm(confirmText)) {
        milestones = milestones.filter(m => m.id !== milestoneId);
        saveMilestones();
        renderMilestones();
    }
}

function saveMilestones() {
    localStorage.setItem('milestones', JSON.stringify(milestones));
}

function loadMilestones() {
    renderMilestones();
    updateProgressPath();
}

// 进度路径可视化相关变量（更新现有变量）
let progressParticles;
let particleSystem = [];
let animationFrame = null;
let pathLength = 0;
let character = null;
let progressPath = null;
let pathSvg = null;
let encourageBubble = null;

// 积分系统管理函数
function initializePointsSystem() {
    // 检查每日登录奖励
    checkDailyLoginReward();
    // 更新积分显示
    updatePointsDisplay();
    // 检查注册奖励
    if (!isRegistered) {
        // 首次访问，给予注册奖励
        awardPoints(POINT_RULES.REGISTRATION, '注册奖励');
        isRegistered = true;
        localStorage.setItem('isRegistered', 'true');
    }
}

function awardPoints(points, reason) {
    userPoints += points;
    localStorage.setItem('userPoints', userPoints.toString());
    updatePointsDisplay();
    showPointsNotification(points, reason);
}

function checkDailyLoginReward() {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
        if (lastLoginDate !== null) {
            // 不是第一次访问，给予每日登录奖励
            awardPoints(POINT_RULES.DAILY_LOGIN, '每日登录奖励');
        }
        lastLoginDate = today;
        localStorage.setItem('lastLoginDate', today);
    }
}

function updatePointsDisplay() {
    const pointsElement = document.getElementById('userPoints');
    if (pointsElement) {
        pointsElement.textContent = userPoints;
    }
}

function showPointsNotification(points, reason) {
    // 创建积分通知
    const notification = document.createElement('div');
    notification.className = 'points-notification';
    notification.innerHTML = `
        <div class="points-content">
            <span class="points-icon">🎉</span>
            <span class="points-text">+${points} 积分</span>
            <span class="points-reason">${reason}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 3秒后移除
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

function addReferralPoints() {
    referralCount++;
    localStorage.setItem('referralCount', referralCount.toString());
    awardPoints(POINT_RULES.REFERRAL, '推荐好友奖励');
}

// 多目标管理函数
function createLearningGoal(title, deadline, category, priority, customTags = [], color = null) {
    const goalId = 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const assignedColor = color || getNextAvailableColor();
    
    const newGoal = {
        id: goalId,
        title: title,
        deadline: deadline,
        category: category,
        priority: priority,
        customTags: customTags,
        color: assignedColor,
        createdAt: new Date().toISOString(),
        tasks: [],
        milestones: [],
        progress: 0,
        isActive: true
    };
    
    learningGoals.push(newGoal);
    saveLearningGoals();
    
    // 如果是第一个目标，设为当前目标
    if (!currentGoalId) {
        setCurrentGoal(goalId);
    }
    
    return newGoal;
}

function getNextAvailableColor() {
    const usedColors = learningGoals.map(goal => goal.color);
    const availableColors = GOAL_COLORS.filter(color => !usedColors.includes(color));
    return availableColors.length > 0 ? availableColors[0] : GOAL_COLORS[learningGoals.length % GOAL_COLORS.length];
}

function setCurrentGoal(goalId) {
    currentGoalId = goalId;
    localStorage.setItem('currentGoalId', goalId);
    updateCurrentGoalDisplay();
    renderGoalSelector();
}

function getCurrentGoal() {
    return learningGoals.find(goal => goal.id === currentGoalId) || null;
}

function saveLearningGoals() {
    localStorage.setItem('learningGoals', JSON.stringify(learningGoals));
}

function loadLearningGoals() {
    learningGoals = JSON.parse(localStorage.getItem('learningGoals')) || [];
    currentGoalId = localStorage.getItem('currentGoalId') || null;
    
    // 如果没有当前目标但有目标列表，设置第一个为当前目标
    if (!currentGoalId && learningGoals.length > 0) {
        setCurrentGoal(learningGoals[0].id);
    }
}

function deleteGoal(goalId) {
    const goalIndex = learningGoals.findIndex(goal => goal.id === goalId);
    if (goalIndex !== -1) {
        learningGoals.splice(goalIndex, 1);
        saveLearningGoals();
        
        // 如果删除的是当前目标，切换到其他目标
        if (currentGoalId === goalId) {
            currentGoalId = learningGoals.length > 0 ? learningGoals[0].id : null;
            localStorage.setItem('currentGoalId', currentGoalId || '');
        }
        
        updateCurrentGoalDisplay();
        renderGoalSelector();
    }
}

function updateGoalPriority(goalId, newPriority) {
    const goal = learningGoals.find(g => g.id === goalId);
    if (goal) {
        goal.priority = newPriority;
        saveLearningGoals();
        renderGoalSelector();
    }
}

function getGoalsByPriority() {
    return learningGoals.sort((a, b) => {
        const priorityA = PRIORITY_LEVELS[a.priority]?.value || 0;
        const priorityB = PRIORITY_LEVELS[b.priority]?.value || 0;
        return priorityB - priorityA; // 高优先级在前
    });
}

// 多目标系统初始化和界面渲染
function initializeMultiGoalSystem() {
    loadLearningGoals();
    setupGoalFormEvents();
    renderCategoryOptions();
    renderColorPicker();
    renderGoalSelector();
    updateCurrentGoalDisplay();
}

function setupGoalFormEvents() {
    const addGoalBtn = document.getElementById('addGoalBtn');
    const newGoalForm = document.getElementById('newGoalForm');
    const createGoalBtn = document.getElementById('createGoalBtn');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', () => {
            newGoalForm.style.display = newGoalForm.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    if (createGoalBtn) {
        createGoalBtn.addEventListener('click', handleCreateGoal);
    }
    
    if (cancelGoalBtn) {
        cancelGoalBtn.addEventListener('click', () => {
            newGoalForm.style.display = 'none';
            clearGoalForm();
        });
    }
}

function handleCreateGoal() {
    const titleInput = document.getElementById('goalTitleInput');
    const deadlineInput = document.getElementById('goalDeadlineInput');
    const categorySelect = document.getElementById('goalCategorySelect');
    const prioritySelect = document.getElementById('goalPrioritySelect');
    const tagsInput = document.getElementById('customTagsInput');
    const selectedColor = document.querySelector('.color-option.selected');
    
    const title = titleInput.value.trim();
    const deadline = deadlineInput.value;
    const category = categorySelect.value;
    const priority = prioritySelect.value;
    const customTags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    const color = selectedColor ? selectedColor.dataset.color : null;
    
    if (!title || !deadline) {
        alert(currentLanguage === 'zh' ? '请填写目标标题和截止日期' : 'Please fill in goal title and deadline');
        return;
    }
    
    createLearningGoal(title, deadline, category, priority, customTags, color);
    
    // 清空表单并隐藏
    clearGoalForm();
    document.getElementById('newGoalForm').style.display = 'none';
    
    // 更新界面
    renderGoalSelector();
    updateCurrentGoalDisplay();
}

function clearGoalForm() {
    document.getElementById('goalTitleInput').value = '';
    document.getElementById('goalDeadlineInput').value = '';
    document.getElementById('goalCategorySelect').value = '';
    document.getElementById('goalPrioritySelect').value = 'MEDIUM';
    document.getElementById('customTagsInput').value = '';
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function renderCategoryOptions() {
    const categorySelect = document.getElementById('goalCategorySelect');
    if (!categorySelect) return;
    
    // 清空现有选项（保留默认选项）
    const defaultOption = categorySelect.querySelector('option[value=""]');
    categorySelect.innerHTML = '';
    categorySelect.appendChild(defaultOption);
    
    // 添加预设类别
    Object.entries(PRESET_CATEGORIES).forEach(([key, category]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${category.icon} ${category.name}`;
        categorySelect.appendChild(option);
    });
}

function renderColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    if (!colorPicker) return;
    
    colorPicker.innerHTML = '';
    
    GOAL_COLORS.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;
        
        colorOption.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });
            colorOption.classList.add('selected');
        });
        
        colorPicker.appendChild(colorOption);
    });
}

function renderGoalSelector() {
    const goalSelector = document.getElementById('goalSelector');
    if (!goalSelector) return;
    
    goalSelector.innerHTML = '';
    
    if (learningGoals.length === 0) {
        goalSelector.innerHTML = `
            <div class="no-goals-message">
                <p data-zh="还没有学习目标，点击上方按钮创建第一个目标吧！" data-en="No learning goals yet, click the button above to create your first goal!">还没有学习目标，点击上方按钮创建第一个目标吧！</p>
            </div>
        `;
        return;
    }
    
    const sortedGoals = getGoalsByPriority();
    
    sortedGoals.forEach(goal => {
        const goalCard = document.createElement('div');
        goalCard.className = `goal-card ${goal.id === currentGoalId ? 'active' : ''}`;
        goalCard.style.setProperty('--goal-color', goal.color);
        
        const category = PRESET_CATEGORIES[goal.category];
        const priority = PRIORITY_LEVELS[goal.priority];
        
        goalCard.innerHTML = `
            <div class="goal-card-header">
                <h4 class="goal-title">${goal.title}</h4>
                <div class="goal-priority" style="background-color: ${priority.color}20; color: ${priority.color}">
                    <span>${priority.icon}</span>
                    <span>${priority.name}</span>
                </div>
            </div>
            <div class="goal-meta">
                <div class="goal-category">
                    <span>${category ? category.icon : '📋'}</span>
                    <span>${category ? category.name : '其他'}</span>
                </div>
                <div class="goal-deadline">${new Date(goal.deadline).toLocaleDateString()}</div>
            </div>
        `;
        
        goalCard.addEventListener('click', () => {
            setCurrentGoal(goal.id);
        });
        
        goalSelector.appendChild(goalCard);
    });
}

function updateCurrentGoalDisplay() {
    const currentGoalContent = document.getElementById('currentGoalContent');
    if (!currentGoalContent) return;
    
    const currentGoal = getCurrentGoal();
    
    if (!currentGoal) {
        currentGoalContent.innerHTML = `
            <p data-zh="请选择或创建一个学习目标" data-en="Please select or create a learning goal">请选择或创建一个学习目标</p>
        `;
        return;
    }
    
    const category = PRESET_CATEGORIES[currentGoal.category];
    const priority = PRIORITY_LEVELS[currentGoal.priority];
    
    // 设置当前目标颜色CSS变量
    document.documentElement.style.setProperty('--current-goal-color', currentGoal.color);
    
    currentGoalContent.innerHTML = `
        <div class="current-goal-header">
            <h3 class="current-goal-title">${currentGoal.title}</h3>
            <div class="goal-actions">
                <button class="goal-action-btn" onclick="editGoal('${currentGoal.id}')" title="编辑目标">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="goal-action-btn" onclick="deleteGoal('${currentGoal.id}')" title="删除目标">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="goal-details">
            <div class="goal-info-row">
                <span><i class="fas fa-calendar"></i> 截止日期: ${new Date(currentGoal.deadline).toLocaleDateString()}</span>
                <span><i class="fas fa-tag"></i> ${category ? category.icon + ' ' + category.name : '其他'}</span>
                <span style="color: ${priority.color}">${priority.icon} ${priority.name}</span>
            </div>
            ${currentGoal.customTags.length > 0 ? `
                <div class="goal-tags">
                    ${currentGoal.customTags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// 进度路径可视化功能
function initializeProgressPath() {
    pathSvg = document.querySelector('.progress-path-svg');
    character = document.getElementById('character');
    progressPath = document.getElementById('progressPath');
    milestonesContainer = document.getElementById('milestonesContainer');
    encourageBubble = document.getElementById('encouragementBubble');
    progressParticles = document.getElementById('progressParticles');
    
    if (progressPath) {
        pathLength = progressPath.getTotalLength();
        initializeParticleSystem();
        updateCharacterPosition();
        renderMilestoneMarkers();
        startAnimationLoop();
    }
    
    updateProgressPath();
    
    // 监听任务和里程碑变化
    const observer = new MutationObserver(() => {
        updateProgressPath();
    });
    
    observer.observe(document.getElementById('taskList'), { childList: true, subtree: true });
    observer.observe(document.getElementById('milestoneList'), { childList: true, subtree: true });
}

// 粒子系统初始化
function initializeParticleSystem() {
    particleSystem = [];
    if (progressParticles) {
        progressParticles.innerHTML = '';
    }
}

// 创建进度粒子
function createProgressParticle(x, y) {
    if (!progressParticles) return;
    
    const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    particle.setAttribute('cx', x);
    particle.setAttribute('cy', y);
    particle.setAttribute('r', Math.random() * 2 + 1);
    particle.setAttribute('fill', `hsl(${Math.random() * 60 + 120}, 70%, 60%)`);
    particle.setAttribute('opacity', '0.8');
    particle.classList.add('progress-particle');
    
    progressParticles.appendChild(particle);
    
    // 粒子生命周期
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 2000);
}

// 动画循环
function startAnimationLoop() {
    function animate() {
        // 在进度路径上随机生成粒子
        if (Math.random() < 0.1) {
            const progress = getOverallProgress();
            if (progress > 0 && progressPath) {
                const distance = (progress / 100) * pathLength;
                const point = progressPath.getPointAtLength(distance * 0.8); // 稍微滞后
                createProgressParticle(
                    point.x + (Math.random() - 0.5) * 10,
                    point.y + (Math.random() - 0.5) * 10
                );
            }
        }
        
        animationFrame = requestAnimationFrame(animate);
    }
    animate();
}

// 获取总体进度（包含里程碑权重）
function getOverallProgress() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter(milestone => milestone.completed).length;
    
    // 任务权重70%，里程碑权重30%
    const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 70 : 0;
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 30 : 0;
    
    return Math.min(100, taskProgress + milestoneProgress);
}

function updateProgressPath() {
    // 确保DOM元素已加载
    if (!character) {
        character = document.getElementById('character');
    }
    if (!progressPath) {
        progressPath = document.getElementById('progressPath');
        if (progressPath) {
            pathLength = progressPath.getTotalLength();
        }
    }
    if (!progressParticles) {
        progressParticles = document.getElementById('progressParticles');
    }
    
    updateCharacterPosition();
    renderMilestoneMarkers();
    updateProgressLine();
    
    // 触发进度更新事件
    const progressEvent = new CustomEvent('progressUpdated', {
        detail: { progress: getOverallProgress() }
    });
    document.dispatchEvent(progressEvent);
}

function updateCharacterPosition() {
    if (!character || !progressPath || pathLength === 0) return;
    
    const progress = getOverallProgress();
    const normalizedProgress = Math.max(0, Math.min(100, progress));
    const distance = (normalizedProgress / 100) * pathLength;
    
    try {
        const point = progressPath.getPointAtLength(distance);
        
        // 计算路径切线角度用于小人偶朝向
        const lookAheadDistance = Math.min(distance + 10, pathLength);
        const nextPoint = progressPath.getPointAtLength(lookAheadDistance);
        const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * 180 / Math.PI;
        
        // 平滑角度变化，避免突然翻转
        const normalizedAngle = ((angle % 360) + 360) % 360;
        const displayAngle = normalizedAngle > 180 ? normalizedAngle - 360 : normalizedAngle;
        
        // 更新小人偶位置和朝向
        character.style.transition = 'transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        character.setAttribute('transform', `translate(${point.x}, ${point.y}) rotate(${displayAngle})`);
        
        // 更新进度路径显示（平滑动画）
        const dashArray = `${distance} ${pathLength - distance}`;
        progressPath.style.transition = 'stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)';
        progressPath.setAttribute('stroke-dasharray', dashArray);
        
        // 添加进度粒子效果（基于实际进度）
        if (normalizedProgress > 0 && Math.random() < 0.2) {
            createProgressParticle(
                point.x + (Math.random() - 0.5) * 12,
                point.y + (Math.random() - 0.5) * 12
            );
        }
        
        // 检查是否接近里程碑
        checkMilestoneProximity(point.x, point.y);
        
        // 更新进度显示文本
        updateProgressDisplay(normalizedProgress, point.x, point.y);
        
    } catch (error) {
        console.warn('更新小人偶位置时出错:', error);
    }
}

// 更新进度显示
function updateProgressDisplay(progress, x, y) {
    // 可以在这里添加进度百分比显示
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `学习进度: ${progress.toFixed(1)}%`;
    }
}

function calculatePathY(x) {
    // 根据SVG路径 "M 50 200 Q 200 150 350 180 Q 500 210 650 160 Q 750 140 750 140" 计算Y坐标
    if (x <= 200) {
        // 第一段曲线：从(50,200)到(200,150)
        const t = (x - 50) / 150;
        return 200 + t * (150 - 200);
    } else if (x <= 350) {
        // 第二段曲线：从(200,150)到(350,180)
        const t = (x - 200) / 150;
        return 150 + t * (180 - 150);
    } else if (x <= 500) {
        // 第三段曲线：从(350,180)到(500,210)
        const t = (x - 350) / 150;
        return 180 + t * (210 - 180);
    } else if (x <= 650) {
        // 第四段曲线：从(500,210)到(650,160)
        const t = (x - 500) / 150;
        return 210 + t * (160 - 210);
    } else {
        // 最后一段：从(650,160)到(750,140)
        const t = (x - 650) / 100;
        return 160 + t * (140 - 160);
    }
}

function renderMilestoneMarkers() {
    if (!milestonesContainer) return;
    
    milestonesContainer.innerHTML = '';
    
    milestones.forEach((milestone, index) => {
        // 根据里程碑在列表中的位置计算路径上的位置
        const totalMilestones = milestones.length;
        const progress = totalMilestones > 0 ? (index + 1) / (totalMilestones + 1) : 0;
        const totalPathLength = 700;
        const x = 50 + (totalPathLength * progress);
        const y = calculatePathY(x);
        
        const milestoneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        milestoneGroup.setAttribute('class', `milestone-marker ${milestone.completed ? 'milestone-completed' : ''}`);
        milestoneGroup.setAttribute('transform', `translate(${x}, ${y})`);
        milestoneGroup.setAttribute('data-milestone-id', milestone.id);
        
        // 标牌杆子
        const pole = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        pole.setAttribute('class', 'milestone-pole');
        pole.setAttribute('x1', '0');
        pole.setAttribute('y1', '0');
        pole.setAttribute('x2', '0');
        pole.setAttribute('y2', '-40');
        milestoneGroup.appendChild(pole);
        
        // 标牌背景
        const sign = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        sign.setAttribute('class', 'milestone-sign');
        sign.setAttribute('x', '-25');
        sign.setAttribute('y', '-55');
        sign.setAttribute('width', '50');
        sign.setAttribute('height', '20');
        sign.setAttribute('rx', '3');
        milestoneGroup.appendChild(sign);
        
        // 标牌文字
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'milestone-text');
        text.setAttribute('x', '0');
        text.setAttribute('y', '-45');
        text.textContent = milestone.title.length > 6 ? milestone.title.substring(0, 6) + '...' : milestone.title;
        milestoneGroup.appendChild(text);
        
        // 添加点击事件
        milestoneGroup.style.cursor = 'pointer';
        milestoneGroup.addEventListener('click', () => {
            showMilestoneDetails(milestone);
        });
        
        milestonesContainer.appendChild(milestoneGroup);
    });
}

function updateProgressLine() {
    const progressPath = document.getElementById('progressPath');
    if (!progressPath) return;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
    
    // 更新进度线的stroke-dasharray
    const totalPathLength = 1000; // SVG路径的大致长度
    const completedLength = totalPathLength * progress;
    const remainingLength = totalPathLength - completedLength;
    
    progressPath.setAttribute('stroke-dasharray', `${completedLength} ${remainingLength}`);
}

function checkMilestoneProximity(characterX, characterY) {
    if (!progressPath || pathLength === 0) return;
    
    milestones.forEach((milestone, index) => {
        const totalMilestones = milestones.length;
        const milestoneProgress = totalMilestones > 0 ? (index + 1) / (totalMilestones + 1) : 0;
        const milestoneDistance = milestoneProgress * pathLength;
        const milestonePoint = progressPath.getPointAtLength(milestoneDistance);
        
        // 检查小人偶是否接近里程碑（距离小于50像素）
        const distance = Math.sqrt(
            Math.pow(characterX - milestonePoint.x, 2) + 
            Math.pow(characterY - milestonePoint.y, 2)
        );
        
        const currentProgress = getOverallProgress() / 100;
        
        if (distance < 50 && !milestone.completed && currentProgress < milestoneProgress) {
            showEncouragementBubble(characterX, characterY, milestone);
        }
    });
}

// 保持向后兼容
function checkNearbyMilestones(characterX, characterY, progress) {
    checkMilestoneProximity(characterX, characterY);
}

function showEncouragementBubble(x, y, milestone) {
    if (!encouragementBubble || !bubbleText) return;
    
    const messages = {
        zh: [
            `加油！马上到${milestone.title}了！`,
            `坚持住！${milestone.title}就在前方！`,
            `努力！${milestone.title}等着你！`,
            `继续前进！${milestone.title}近在咫尺！`
        ],
        en: [
            `Keep going! ${milestone.title} is near!`,
            `Almost there! ${milestone.title} awaits!`,
            `Push forward! ${milestone.title} is close!`,
            `Don't give up! ${milestone.title} is ahead!`
        ]
    };
    
    const messageList = messages[currentLanguage] || messages.zh;
    const randomMessage = messageList[Math.floor(Math.random() * messageList.length)];
    
    bubbleText.textContent = randomMessage;
    encouragementBubble.setAttribute('transform', `translate(${x}, ${y})`);
    encouragementBubble.style.display = 'block';
    
    // 3秒后隐藏气泡
    setTimeout(() => {
        encouragementBubble.style.display = 'none';
    }, 3000);
}

function showMilestoneDetails(milestone) {
    const formattedDate = new Date(milestone.date).toLocaleDateString(
        currentLanguage === 'zh' ? 'zh-CN' : 'en-US'
    );
    
    const statusText = milestone.completed 
        ? (currentLanguage === 'zh' ? '已完成' : 'Completed')
        : (currentLanguage === 'zh' ? '进行中' : 'In Progress');
    
    const message = currentLanguage === 'zh' 
        ? `里程碑：${milestone.title}\n日期：${formattedDate}\n状态：${statusText}`
        : `Milestone: ${milestone.title}\nDate: ${formattedDate}\nStatus: ${statusText}`;
    
    alert(message);
}

// 多格式导出功能
function initializeExport() {
    exportJsonBtn.addEventListener('click', exportJSON);
    exportIcsBtn.addEventListener('click', exportICS);
    exportPdfBtn.addEventListener('click', exportPDF);
}

function exportJSON() {
    const data = {
        goal: currentGoal,
        deadline: deadline,
        checkinData: checkinData,
        tasks: tasks,
        milestones: milestones,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `学习计划_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    const alertText = currentLanguage === 'zh' ? 'JSON数据已导出！' : 'JSON data exported!';
    alert(alertText);
}

function exportICS() {
    let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Just Do it//Learning Plan//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
    ];
    
    // 添加学习目标截止日期
    if (currentGoal && deadline) {
        const goalEvent = [
            'BEGIN:VEVENT',
            `UID:goal-${Date.now()}@justdoit.com`,
            `DTSTART:${formatDateForICS(deadline)}`,
            `DTEND:${formatDateForICS(deadline)}`,
            `SUMMARY:${currentGoal} - 截止日期`,
            `DESCRIPTION:学习目标截止日期`,
            'STATUS:CONFIRMED',
            'END:VEVENT'
        ];
        icsContent = icsContent.concat(goalEvent);
    }
    
    // 添加里程碑
    milestones.forEach(milestone => {
        const milestoneEvent = [
            'BEGIN:VEVENT',
            `UID:milestone-${milestone.id}@justdoit.com`,
            `DTSTART:${formatDateForICS(new Date(milestone.date))}`,
            `DTEND:${formatDateForICS(new Date(milestone.date))}`,
            `SUMMARY:里程碑: ${milestone.title}`,
            `DESCRIPTION:学习计划里程碑`,
            `STATUS:${milestone.completed ? 'COMPLETED' : 'CONFIRMED'}`,
            'END:VEVENT'
        ];
        icsContent = icsContent.concat(milestoneEvent);
    });
    
    // 添加打卡记录
    Object.keys(checkinData).forEach(dateStr => {
        if (checkinData[dateStr]) {
            const checkinEvent = [
                'BEGIN:VEVENT',
                `UID:checkin-${dateStr}@justdoit.com`,
                `DTSTART:${formatDateForICS(new Date(dateStr))}`,
                `DTEND:${formatDateForICS(new Date(dateStr))}`,
                'SUMMARY:学习打卡',
                'DESCRIPTION:每日学习打卡记录',
                'STATUS:COMPLETED',
                'END:VEVENT'
            ];
            icsContent = icsContent.concat(checkinEvent);
        }
    });
    
    icsContent.push('END:VCALENDAR');
    
    const icsBlob = new Blob([icsContent.join('\r\n')], {type: 'text/calendar'});
    const url = URL.createObjectURL(icsBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `学习计划_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    const alertText = currentLanguage === 'zh' ? 'ICS日历文件已导出！可导入到Outlook、Google日历等' : 'ICS calendar file exported! Can be imported to Outlook, Google Calendar, etc.';
    alert(alertText);
}

function exportPDF() {
    // 创建PDF内容
    const pdfContent = generatePDFContent();
    
    // 使用浏览器打印功能生成PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
    
    const alertText = currentLanguage === 'zh' ? '请在打印对话框中选择"另存为PDF"' : 'Please select "Save as PDF" in the print dialog';
    alert(alertText);
}

function formatDateForICS(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function generatePDFContent() {
    const title = currentLanguage === 'zh' ? '学习计划报告' : 'Learning Plan Report';
    const goalLabel = currentLanguage === 'zh' ? '学习目标' : 'Learning Goal';
    const deadlineLabel = currentLanguage === 'zh' ? '截止日期' : 'Deadline';
    const tasksLabel = currentLanguage === 'zh' ? '任务清单' : 'Task List';
    const milestonesLabel = currentLanguage === 'zh' ? '里程碑' : 'Milestones';
    const progressLabel = currentLanguage === 'zh' ? '进度统计' : 'Progress Statistics';
    const completedLabel = currentLanguage === 'zh' ? '已完成' : 'Completed';
    const pendingLabel = currentLanguage === 'zh' ? '待完成' : 'Pending';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
                h2 { color: #555; margin-top: 30px; }
                .goal-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .task-item, .milestone-item { padding: 10px; margin: 5px 0; border-left: 4px solid #007bff; background: #f8f9fa; }
                .completed { border-left-color: #28a745; }
                .stats { display: flex; gap: 20px; margin: 20px 0; }
                .stat-box { padding: 15px; background: #e9ecef; border-radius: 8px; text-align: center; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p>生成时间: ${new Date().toLocaleString()}</p>
            
            ${currentGoal ? `
                <div class="goal-info">
                    <h2>${goalLabel}</h2>
                    <p><strong>${currentGoal}</strong></p>
                    ${deadline ? `<p>${deadlineLabel}: ${deadline.toLocaleDateString()}</p>` : ''}
                </div>
            ` : ''}
            
            <h2>${tasksLabel}</h2>
            ${tasks.map(task => `
                <div class="task-item ${task.completed ? 'completed' : ''}">
                    ${task.text} ${task.completed ? `(${completedLabel})` : `(${pendingLabel})`}
                </div>
            `).join('')}
            
            <h2>${milestonesLabel}</h2>
            ${milestones.map(milestone => `
                <div class="milestone-item ${milestone.completed ? 'completed' : ''}">
                    <strong>${milestone.title}</strong> - ${new Date(milestone.date).toLocaleDateString()}
                    ${milestone.completed ? ` (${completedLabel})` : ` (${pendingLabel})`}
                </div>
            `).join('')}
            
            <h2>${progressLabel}</h2>
            <div class="stats">
                <div class="stat-box">
                    <h3>${tasks.filter(t => t.completed).length}</h3>
                    <p>${completedLabel}任务</p>
                </div>
                <div class="stat-box">
                    <h3>${tasks.filter(t => !t.completed).length}</h3>
                    <p>${pendingLabel}任务</p>
                </div>
                <div class="stat-box">
                    <h3>${milestones.filter(m => m.completed).length}</h3>
                    <p>${completedLabel}里程碑</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// 保存目标开始日期
function saveGoalStartDate() {
    if (!localStorage.getItem('goalStartDate')) {
        localStorage.setItem('goalStartDate', new Date().toISOString());
    }
}

// 在设置目标时保存开始日期
if (setGoalBtn) {
    setGoalBtn.addEventListener('click', saveGoalStartDate);
}

// 数据恢复功能（可选）
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.goal) currentGoal = data.goal;
            if (data.deadline) deadline = new Date(data.deadline);
            if (data.checkinData) checkinData = data.checkinData;
            if (data.tasks) tasks = data.tasks;
            
            // 保存到本地存储
            localStorage.setItem('currentGoal', currentGoal || '');
            localStorage.setItem('deadline', deadline ? deadline.toISOString() : '');
            localStorage.setItem('checkinData', JSON.stringify(checkinData));
            localStorage.setItem('tasks', JSON.stringify(tasks));
            
            // 刷新界面
            location.reload();
        } catch (error) {
            const alertText = currentLanguage === 'zh' ? '导入失败，文件格式不正确！' : 'Import failed, incorrect file format!';
            alert(alertText);
        }
    };
    reader.readAsText(file);
}

// 添加导入按钮（可选功能）
const importInput = document.createElement('input');
importInput.type = 'file';
importInput.accept = '.json';
importInput.style.display = 'none';
importInput.addEventListener('change', importData);
document.body.appendChild(importInput);

// 语言切换功能
function initializeLanguage() {
    updateLanguage();
    
    langBtn.addEventListener('click', function() {
        currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
        localStorage.setItem('language', currentLanguage);
        updateLanguage();
    });
}

function updateLanguage() {
    const elements = document.querySelectorAll('[data-zh][data-en]');
    elements.forEach(element => {
        if (element.tagName === 'INPUT') {
            element.placeholder = element.getAttribute(`data-placeholder-${currentLanguage}`);
        } else {
            element.textContent = element.getAttribute(`data-${currentLanguage}`);
        }
    });
    
    langBtn.textContent = currentLanguage === 'zh' ? 'EN' : '中文';
    
    // 更新打卡状态文本
    updateCheckinStatusText();
}

function updateCheckinStatusText() {
    const today = new Date().toDateString();
    
    if (checkinData[today]) {
        checkinStatus.textContent = currentLanguage === 'zh' ? '今日已打卡 ✓' : 'Checked in today ✓';
        checkinStatus.style.color = '#28a745';
    } else {
        checkinStatus.textContent = currentLanguage === 'zh' ? '今日未打卡' : 'Not checked in today';
        checkinStatus.style.color = '#dc3545';
    }
}

// 登录注册功能
function initializeAuth() {
    loginTrigger.addEventListener('click', function() {
        authPanel.classList.add('active');
    });
    
    authClose.addEventListener('click', function() {
        authPanel.classList.remove('active');
    });
    
    // 点击面板外部关闭
    document.addEventListener('click', function(e) {
        if (!authPanel.contains(e.target) && !loginTrigger.contains(e.target)) {
            authPanel.classList.remove('active');
        }
    });
    
    // 表单提交处理
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelector('input[type="password"]').value;
        
        // 模拟登录
        if (email && password) {
            alert(currentLanguage === 'zh' ? '登录成功！' : 'Login successful!');
            authPanel.classList.remove('active');
            loginTrigger.textContent = currentLanguage === 'zh' ? '已登录' : 'Logged in';
            loginTrigger.style.background = 'rgba(40, 167, 69, 0.8)';
        }
    });
    
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value;
        const email = this.querySelector('input[type="email"]').value;
        const password = this.querySelectorAll('input[type="password"]')[0].value;
        const confirmPassword = this.querySelectorAll('input[type="password"]')[1].value;
        
        if (password !== confirmPassword) {
            alert(currentLanguage === 'zh' ? '密码不匹配！' : 'Passwords do not match!');
            return;
        }
        
        // 模拟注册
        if (username && email && password) {
            alert(currentLanguage === 'zh' ? '注册成功！' : 'Registration successful!');
            switchAuthTab('login');
        }
    });
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.querySelector('[data-tab="login"]').classList.add('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        document.querySelector('[data-tab="register"]').classList.add('active');
    }
}

// 访问量统计
function updateVisitorCount() {
    // 增加访问量
    visitorCount++;
    localStorage.setItem('visitorCount', visitorCount);
    
    // 格式化显示数字
    visitorCountElement.textContent = visitorCount.toLocaleString();
    
    // 每10秒随机增加1-3个访问量
    setInterval(() => {
        visitorCount += Math.floor(Math.random() * 3) + 1;
        localStorage.setItem('visitorCount', visitorCount);
        visitorCountElement.textContent = visitorCount.toLocaleString();
    }, 10000);
}

// 添加标签切换事件监听
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        switchAuthTab(this.getAttribute('data-tab'));
    });
});