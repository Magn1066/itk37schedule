// ===================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====================
const DATA_FILE = 'data.json';
let scheduleData = [];
let period = { start: '', end: '' };
let teachers = [];
let rooms = [];
let subjects = [];
let isInitialized = false;
let filteredData = [];

// ===================== ИНИЦИАЛИЗАЦИЯ =====================
document.addEventListener('DOMContentLoaded', initEditor);

async function initEditor() {
    try {
        await loadData();
        populateDropdowns();
        renderTable();
        updateStatusBar();
        isInitialized = true;
        showNotification('Данные загружены', 'success');
    } catch (error) {
        console.error('Ошибка инициализации:', error);
        showNotification(`Ошибка загрузки: ${error.message}`, 'error');
    }
}

// ===================== ЗАГРУЗКА ДАННЫХ ИЗ ФАЙЛА =====================
async function loadData() {
    try {
        const response = await fetch(DATA_FILE + '?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`Не удалось загрузить ${DATA_FILE}. Убедитесь, что файл существует.`);
        }

        const data = await response.json();

        // Загружаем расписание
        scheduleData = data.schedule || [];
        filteredData = [...scheduleData];

        // Загружаем период
        if (data.period) {
            period.start = data.period.start || '';
            period.end = data.period.end || '';
            document.getElementById('periodStart').value = period.start;
            document.getElementById('periodEnd').value = period.end;
        }

        // Загружаем справочники
        if (Array.isArray(data.teachers)) teachers = data.teachers;
        if (Array.isArray(data.rooms)) rooms = data.rooms;
        if (Array.isArray(data.subjects)) subjects = data.subjects;

        console.log(`✅ Загружено ${scheduleData.length} занятий`);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        throw error;
    }
}

// ===================== СОХРАНЕНИЕ ДАННЫХ =====================
function saveData() {
    if (!isInitialized) return;

    const data = {
        period: {
            start: period.start,
            end: period.end
        },
        schedule: scheduleData,
        teachers: teachers,
        rooms: rooms,
        subjects: subjects,
        lastUpdated: new Date().toISOString(),
        version: '2.0'
    };

    // Создаём файл для скачивания
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);

    showNotification('Файл сохранён! Закоммитьте его в репозиторий.', 'success');
}

// ===================== РАБОТА СО СПРАВОЧНИКАМИ =====================
function populateDropdowns() {
    populateDropdown('teacher', teachers);
    populateDropdown('room', rooms);
    populateDropdown('subject', subjects);
}

function populateDropdown(id, items) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите --</option>';
    items.sort().forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

// ===================== ДОБАВЛЕНИЕ НОВЫХ ЭЛЕМЕНТОВ =====================
function addNewTeacher() {
    const name = prompt('Введите ФИО преподавателя (напр. Иванов А.И.):');
    if (!name || name.trim() === '') return;

    const cleanName = name.trim();

    if (teachers.includes(cleanName)) {
        showNotification('Преподаватель уже существует', 'warning');
        return;
    }

    teachers.push(cleanName);
    populateDropdown('teacher', teachers);
    showNotification('Преподаватель добавлен (сохраните файл)', 'success');
}

function addNewRoom() {
    const room = prompt('Введите номер кабинета (напр. 301 или 223/224):');
    if (!room || room.trim() === '') return;

    const cleanRoom = room.trim();

    if (rooms.includes(cleanRoom)) {
        showNotification('Кабинет уже существует', 'warning');
        return;
    }

    rooms.push(cleanRoom);
    populateDropdown('room', rooms);
    showNotification('Кабинет добавлен (сохраните файл)', 'success');
}

function addNewSubject() {
    const subject = prompt('Введите название предмета:');
    if (!subject || subject.trim() === '') return;

    const cleanSubject = subject.trim();

    if (subjects.includes(cleanSubject)) {
        showNotification('Предмет уже существует', 'warning');
        return;
    }

    subjects.push(cleanSubject);
    populateDropdown('subject', subjects);
    showNotification('Предмет добавлен (сохраните файл)', 'success');
}

// ===================== ОБНОВЛЕНИЕ ПЕРИОДА =====================
function updatePeriod() {
    const startInput = document.getElementById('periodStart').value;
    const endInput = document.getElementById('periodEnd').value;

    if (!startInput || !endInput) {
        showNotification('Укажите обе даты периода', 'warning');
        return;
    }

    if (new Date(startInput) > new Date(endInput)) {
        showNotification('Дата начала не может быть позже даты окончания', 'error');
        return;
    }

    period.start = startInput;
    period.end = endInput;
    showNotification('Период обновлён (сохраните файл)', 'success');
}

// ===================== СОРТИРОВКА И ФИЛЬТРАЦИЯ =====================
function sortTable(column) {
    const tbody = document.getElementById('scheduleBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Определяем направление сортировки
    const sortState = tbody.dataset.sortState || '{}';
    const state = JSON.parse(sortState);
    const direction = state[column] === 'asc' ? 'desc' : 'asc';
    state[column] = direction;
    tbody.dataset.sortState = JSON.stringify(state);

    // Сортируем
    rows.sort((a, b) => {
        const aValue = a.cells[column].textContent.trim();
        const bValue = b.cells[column].textContent.trim();

        if (column === 1) { // Сортировка по паре (1-2 урок, 3-4 урок...)
            const aNum = parseInt(aValue) || 0;
            const bNum = parseInt(bValue) || 0;
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        return direction === 'asc'
            ? aValue.localeCompare(bValue, 'ru')
            : bValue.localeCompare(aValue, 'ru');
    });

    // Перерисовываем таблицу
    rows.forEach(row => tbody.appendChild(row));

    // Обновляем индикаторы сортировки
    updateSortIndicators(column, direction);
}

function updateSortIndicators(column, direction) {
    const headers = document.querySelectorAll('#scheduleTable th');
    headers.forEach((th, index) => {
        th.textContent = th.textContent.replace(' ▲', '').replace(' ▼', '');
        if (index === column) {
            th.textContent += direction === 'asc' ? ' ▲' : ' ▼';
        }
    });
}

function filterTable() {
    const filters = {
        day: document.getElementById('filterDay').value,
        group: document.getElementById('filterGroup').value.toLowerCase(),
        subject: document.getElementById('filterSubject').value.toLowerCase(),
        teacher: document.getElementById('filterTeacher').value.toLowerCase(),
        room: document.getElementById('filterRoom').value.toLowerCase()
    };

    filteredData = scheduleData.filter(lesson => {
        if (filters.day && lesson.day !== filters.day) return false;
        if (filters.group && !lesson.group.toLowerCase().includes(filters.group)) return false;
        if (filters.subject && !lesson.subject.toLowerCase().includes(filters.subject)) return false;
        if (filters.teacher && !lesson.teacher.toLowerCase().includes(filters.teacher)) return false;
        if (filters.room && !lesson.room.toLowerCase().includes(filters.room)) return false;
        return true;
    });

    renderTable();
    updateStatusBar();
}

// ===================== ОТОБРАЖЕНИЕ ДАННЫХ =====================
function renderTable() {
    const tbody = document.getElementById('scheduleBody');
    const emptyState = document.getElementById('emptyState');
    const dataToShow = filteredData.length > 0 ? filteredData : scheduleData;

    if (dataToShow.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = dataToShow.map((lesson, index) => {
        const originalIndex = scheduleData.findIndex(l =>
            l.day === lesson.day &&
            l.pair === lesson.pair &&
            l.group === lesson.group &&
            l.subject === lesson.subject
        );

        return `
            <tr data-index="${originalIndex}">
                <td>${lesson.day}</td>
                <td>${lesson.pair}</td>
                <td><strong>${lesson.group}</strong></td>
                <td>${lesson.subject}</td>
                <td>${lesson.teacher === 'Не указан' ? '<em>не указан</em>' : lesson.teacher}</td>
                <td>${lesson.room}</td>
                <td class="action-cell">
                    <button class="btn-table btn-edit" title="Редактировать" onclick="openEditModal(${originalIndex})">
                        ✏️
                    </button>
                    <button class="btn-table btn-delete" title="Удалить" onclick="deleteLesson(${originalIndex})">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStatusBar() {
    document.getElementById('lessonsCount').textContent = scheduleData.length;
    document.getElementById('filteredCount').textContent = filteredData.length;

    const groups = new Set(scheduleData.map(l => l.group));
    document.getElementById('groupsCount').textContent = groups.size;

    const teachersSet = new Set(scheduleData.map(l => l.teacher).filter(t => t !== 'Не указан'));
    document.getElementById('teachersCount').textContent = teachersSet.size;

    document.getElementById('lastUpdated').textContent = new Date().toLocaleString('ru-RU');
}

// ===================== ВАЛИДАЦИЯ КОНФЛИКТОВ =====================
function validateConflicts(newLesson, excludeIndex = -1) {
    const conflicts = [];

    scheduleData.forEach((lesson, index) => {
        if (index === excludeIndex) return;

        // Конфликт по кабинету и времени
        if (lesson.day === newLesson.day &&
            lesson.pair === newLesson.pair &&
            lesson.room === newLesson.room &&
            lesson.room !== '—' && lesson.room !== 'дист') {
            conflicts.push({
                type: 'room',
                message: `Конфликт: кабинет ${lesson.room} занят парой "${lesson.subject}" группы ${lesson.group}`
            });
        }

        // Конфликт по преподавателю и времени
        if (lesson.day === newLesson.day &&
            lesson.pair === newLesson.pair &&
            lesson.teacher === newLesson.teacher &&
            lesson.teacher !== 'Не указан') {
            conflicts.push({
                type: 'teacher',
                message: `Конфликт: преподаватель ${lesson.teacher} занят парой "${lesson.subject}" группы ${lesson.group}`
            });
        }

        // Конфликт по группе и времени
        if (lesson.day === newLesson.day &&
            lesson.pair === newLesson.pair &&
            lesson.group === newLesson.group) {
            conflicts.push({
                type: 'group',
                message: `Конфликт: группа ${lesson.group} уже имеет пару "${lesson.subject}" в это время`
            });
        }
    });

    return conflicts;
}

function checkScheduleOrder() {
    const issues = [];

    // Группируем по дню и группе
    const grouped = {};
    scheduleData.forEach((lesson, index) => {
        const key = `${lesson.day}_${lesson.group}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push({ ...lesson, index });
    });

    // Проверяем порядок пар
    Object.values(grouped).forEach(lessons => {
        lessons.sort((a, b) => {
            const aNum = parseInt(a.pair) || 0;
            const bNum = parseInt(b.pair) || 0;
            return aNum - bNum;
        });

        for (let i = 0; i < lessons.length - 1; i++) {
            const current = lessons[i];
            const next = lessons[i + 1];

            const currentNum = parseInt(current.pair) || 0;
            const nextNum = parseInt(next.pair) || 0;

            if (currentNum > nextNum) {
                issues.push({
                    type: 'order',
                    message: `Нарушение порядка: ${current.group}, ${current.day} - ${current.pair} после ${next.pair}`,
                    index: current.index
                });
            }
        }
    });

    return issues;
}

// ===================== УПРАВЛЕНИЕ ЗАНЯТИЯМИ =====================
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Добавить занятие';
    document.getElementById('editIndex').value = '';
    document.getElementById('lessonForm').reset();

    document.getElementById('teacher').value = '';
    document.getElementById('room').value = '';
    document.getElementById('subject').value = '';

    document.getElementById('lessonModal').style.display = 'flex';
}

function openEditModal(index) {
    const lesson = scheduleData[index];
    document.getElementById('modalTitle').textContent = '✏️ Редактировать занятие';
    document.getElementById('editIndex').value = index;
    document.getElementById('day').value = lesson.day;
    document.getElementById('pair').value = lesson.pair;
    document.getElementById('group').value = lesson.group;
    document.getElementById('subject').value = lesson.subject;
    document.getElementById('teacher').value = lesson.teacher;
    document.getElementById('room').value = lesson.room;
    document.getElementById('lessonModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('lessonModal').style.display = 'none';
}

function saveLesson(event) {
    event.preventDefault();

    const index = document.getElementById('editIndex').value;
    const lesson = {
        day: document.getElementById('day').value.trim(),
        pair: document.getElementById('pair').value.trim(),
        group: document.getElementById('group').value.trim(),
        subject: document.getElementById('subject').value,
        teacher: document.getElementById('teacher').value || 'Не указан',
        room: document.getElementById('room').value || '—'
    };

    // Валидация обязательных полей
    if (!lesson.group || !lesson.subject || !lesson.teacher || !lesson.room) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }

    // Проверка конфликтов
    const conflicts = validateConflicts(lesson, index === '' ? -1 : parseInt(index));
    if (conflicts.length > 0) {
        const messages = conflicts.map(c => c.message).join('\n');
        if (!confirm(`Обнаружены конфликты:\n${messages}\n\nПродолжить сохранение?`)) {
            return;
        }
    }

    if (index === '') {
        // Добавление
        scheduleData.push(lesson);
        showNotification('Занятие добавлено (сохраните файл)', 'success');
    } else {
        // Редактирование
        scheduleData[parseInt(index)] = lesson;
        showNotification('Занятие обновлено (сохраните файл)', 'success');
    }

    renderTable();
    closeModal();
}

function deleteLesson(index) {
    if (!confirm(`Удалить занятие "${scheduleData[index].subject}" для группы ${scheduleData[index].group}?`)) return;

    scheduleData.splice(index, 1);
    renderTable();
    showNotification('Занятие удалено (сохраните файл)', 'success');
}

// ===================== ПРОВЕРКА РАСПИСАНИЯ =====================
function checkSchedule() {
    const issues = checkScheduleOrder();
    const conflicts = [];

    scheduleData.forEach((lesson, index) => {
        const lessonConflicts = validateConflicts(lesson, index);
        if (lessonConflicts.length > 0) {
            conflicts.push({
                lesson: lesson,
                conflicts: lessonConflicts
            });
        }
    });

    if (issues.length === 0 && conflicts.length === 0) {
        showNotification('✅ Расписание в порядке! Нет конфликтов и нарушений порядка.', 'success');
        return;
    }

    let message = '⚠️ Обнаружены проблемы:\n\n';

    if (issues.length > 0) {
        message += `Нарушения порядка (${issues.length}):\n`;
        issues.forEach(issue => {
            message += `  • ${issue.message}\n`;
        });
        message += '\n';
    }

    if (conflicts.length > 0) {
        message += `Конфликты (${conflicts.length}):\n`;
        conflicts.slice(0, 10).forEach(item => {
            message += `  • ${item.lesson.group}, ${item.lesson.day}, ${item.lesson.pair}\n`;
            item.conflicts.forEach(c => {
                message += `    - ${c.message}\n`;
            });
        });
        if (conflicts.length > 10) {
            message += `  ... и ещё ${conflicts.length - 10} конфликтов\n`;
        }
    }

    alert(message);
    showNotification(`Найдено ${issues.length + conflicts.length} проблем`, 'warning');
}

// ===================== ЭКСПОРТ/ИМПОРТ =====================
function exportToJSON() {
    if (scheduleData.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }

    const data = {
        period: period,
        schedule: scheduleData,
        exportedAt: new Date().toISOString(),
        source: 'editor_manual_export'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);

    showNotification('Резервная копия сохранена!', 'success');
}

function handleJSONImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.schedule || !Array.isArray(data.schedule)) {
                throw new Error('Некорректный формат JSON');
            }

            if (data.period) {
                period.start = data.period.start || period.start;
                period.end = data.period.end || period.end;
                document.getElementById('periodStart').value = period.start;
                document.getElementById('periodEnd').value = period.end;
            }

            scheduleData = data.schedule;
            renderTable();
            showNotification(`✅ Импортировано ${scheduleData.length} занятий!`, 'success');
        } catch (error) {
            console.error('Ошибка импорта JSON:', error);
            showNotification(`Ошибка импорта JSON: ${error.message}`, 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// ===================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====================
function showNotification(message, type) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type} show`;

    setTimeout(() => {
        notif.classList.remove('show');
    }, 4000);
}

// Закрытие модалки по клику вне контента
document.getElementById('lessonModal').addEventListener('click', (e) => {
    if (e.target.id === 'lessonModal') closeModal();
});

// Горячие клавиши
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('lessonModal').style.display === 'flex') {
        closeModal();
    }
    if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openAddModal();
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveData();
    }
});
