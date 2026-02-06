// ===================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====================
const DATA_FILE = 'data.json';
let scheduleData = [];
let period = { start: '', end: '' };
let teachers = [];
let rooms = [];
let subjects = [];
let isInitialized = false;
let filteredData = [];
let currentWeek = 1; // Текущая неделя для отображения

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
        room: document.getElementById('filterRoom').value.toLowerCase(),
        week: document.getElementById('filterWeek').value
    };
    
    filteredData = scheduleData.filter(lesson => {
        if (filters.day && lesson.day !== filters.day) return false;
        if (filters.group && !lesson.group.toLowerCase().includes(filters.group)) return false;
        if (filters.subject && !lesson.subject.toLowerCase().includes(filters.subject)) return false;
        if (filters.teacher && !lesson.teacher.toLowerCase().includes(filters.teacher)) return false;
        if (filters.room && !lesson.room.toLowerCase().includes(filters.room)) return false;
        if (filters.week && lesson.week != filters.week) return false;
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
                <td>${lesson.week || '1'}</td>
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
        
        // Проверяем только для одной недели
        if (newLesson.week && lesson.week && newLesson.week !== lesson.week) return;
        
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
    
    // Группируем по дню, группе и неделе
    const grouped = {};
    scheduleData.forEach((lesson, index) => {
        const key = `${lesson.day}_${lesson.group}_${lesson.week || '1'}`;
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
                    message: `Нарушение порядка: ${current.group}, ${current.day} (неделя ${current.week || '1'}) - ${current.pair} после ${next.pair}`,
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
    document.getElementById('week').value = currentWeek;
    
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
    document.getElementById('week').value = lesson.week || '1';
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
        room: document.getElementById('room').value || '—',
        week: document.getElementById('week').value || '1'
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

// ===================== ИМПОРТ ИЗ EXCEL =====================
function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showNotification('Начинаю импорт из Excel...', 'success');
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
            
            // Парсим данные с использованием оригинальной логики
            const parsed = await parseExcelSchedule(jsonData);
            
            if (parsed.schedule.length === 0) {
                throw new Error('Не удалось извлечь занятия из файла');
            }
            
            // Обновляем период если найден
            if (parsed.periodStart && parsed.periodEnd) {
                period.start = parsed.periodStart;
                period.end = parsed.periodEnd;
                document.getElementById('periodStart').value = period.start;
                document.getElementById('periodEnd').value = period.end;
            }
            
            // Добавляем занятия с меткой текущей недели
            parsed.schedule.forEach(lesson => {
                lesson.week = currentWeek;
            });
            
            // Добавляем к существующим данным (не заменяем!)
            scheduleData.push(...parsed.schedule);
            
            renderTable();
            showNotification(`✅ Импортировано ${parsed.schedule.length} занятий из Excel!`, 'success');
        } catch (error) {
            console.error('Ошибка импорта Excel:', error);
            showNotification(`Ошибка импорта: ${error.message}`, 'error');
        } finally {
            event.target.value = '';
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// ===================== ПОЛНЫЙ ПАРСИНГ EXCEL (оригинальная логика) =====================
async function parseExcelSchedule(lines) {
    const schedule = [];
    const teachersSet = new Set();
    const groupsSet = new Set();
    let periodStart = '', periodEnd = '';
    
    // === 1. Извлечение дат ===
    for (const row of lines) {
        const lineStr = String(row.join(';'));
        if (lineStr.includes('РАСПИСАНИЕ ЗАНЯТИЙ')) {
            const match = lineStr.match(/с (\d{2})\.(\d{2})\.(\d{4}) по (\d{2})\.(\d{2})\.(\d{4})/);
            if (match) {
                periodStart = `${match[3]}-${match[2]}-${match[1]}`;
                periodEnd = `${match[6]}-${match[5]}-${match[4]}`;
            }
            break;
        }
    }
    
    // === 2. Поиск заголовков групп ===
    let headers = null;
    let dataStartRow = -1;
    let groupColumns = {};
    
    for (let i = 0; i < lines.length; i++) {
        if (String(lines[i][0]).includes('ДНИ НЕДЕЛИ')) {
            headers = lines[i];
            dataStartRow = i + 1;
            break;
        }
    }
    
    if (!headers || dataStartRow === -1) {
        throw new Error('Не удалось найти строку с заголовками "ДНИ НЕДЕЛИ".');
    }
    
    headers.forEach((cell, idx) => {
        const cleanCell = String(cell).trim().replace(/"/g, '');
        if (cleanCell.toLowerCase().startsWith('группа')) {
            const groupName = cleanCell.replace(/Группа\s+№?\s*/i, '').trim();
            if (groupName) {
                groupsSet.add(groupName);
                groupColumns[groupName] = idx;
            }
        }
    });
    
    // === 3. Чтение данных расписания ===
    const daysOrder = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    let currentDay = '';
    let lastLessonRowWas8 = false;
    
    for (let i = dataStartRow; i < lines.length; i++) {
        const row = lines[i];
        const firstCell = String(row[0] || '').toLowerCase().trim();
        
        if (firstCell.includes('сокращения') || firstCell.includes('рем. раб')) {
            break;
        }
        
        const foundDay = daysOrder.find(day => firstCell.includes(day));
        if (foundDay) {
            currentDay = foundDay.charAt(0).toUpperCase() + foundDay.slice(1);
            lastLessonRowWas8 = false;
        }
        
        const lessonNum = String(row[1] || '').trim();
        const n = parseInt(lessonNum);
        
        let pair = null;
        
        if (currentDay && !isNaN(n) && n >= 1) {
            pair = getLessonNumber(n);
            lastLessonRowWas8 = (n === 8);
        } else if (currentDay && lastLessonRowWas8) {
            let hasSubject = false;
            for (const colIdx of Object.values(groupColumns)) {
                const subjectRaw = (String(row[colIdx] || '') + ' ' + String(row[colIdx + 1] || '')).trim();
                if (subjectRaw && !subjectRaw.toLowerCase().includes('классный час')) {
                    hasSubject = true;
                    break;
                }
            }
            
            if (hasSubject) {
                pair = '9-10 урок';
            }
            lastLessonRowWas8 = false;
        }
        
        if (!pair) continue;
        
        for (const groupName of Object.keys(groupColumns)) {
            const colIdx = groupColumns[groupName];
            const subjectRaw = (String(row[colIdx] || '') + ' ' + String(row[colIdx + 1] || '')).trim();
            
            if (!subjectRaw || subjectRaw.toLowerCase().includes('классный час')) continue;
            
            const lessons = parseSubjectCell(subjectRaw);
            
            lessons.forEach(lesson => {
                const { subject, teacher, room } = lesson;
                const isDuplicate = subjectRaw.indexOf('/') === -1 && schedule.some(item =>
                    item.day === currentDay && item.group === groupName && item.pair === pair
                );
                
                if (!isDuplicate) {
                    schedule.push({
                        day: currentDay,
                        pair: pair,
                        subject: subject || '—',
                        room: room,
                        group: groupName,
                        teacher: teacher || 'Не указан'
                    });
                    if (teacher && teacher !== 'Не указан') teachersSet.add(teacher);
                }
            });
        }
    }
    
    return { schedule, periodStart, periodEnd, teachers: Array.from(teachersSet) };
}

function getLessonNumber(num) {
    const n = parseInt(num);
    if (isNaN(n)) return null;
    if (n <= 2) return '1-2 урок';
    if (n <= 4) return '3-4 урок';
    if (n <= 6) return '5-6 урок';
    if (n <= 8) return '7-8 урок';
    return null;
}

function parseSubjectCell(cellText) {
    const cleanText = cellText.replace(/\s+/g, ' ').trim();
    const rawParts = cleanText.split('/');
    const lessons = [];
    
    const parsePart = (text) => {
        let subject = text.replace(/\s+/g, ' ').trim();
        let teacher = '';
        let room = '—';
        let match = null;
        
        // 1. ПОИСК АУДИТОРИИ
        const roomPrefixRegex = /(.*)\s*((каб\.|ауд\.|маст\.)\s*(\d{1,3}[а-я]?))$/i;
        const roomNumOnlyRegex = /(.*)\s*(\d{3,}[а-я]?)$/i;
        
        let roomMatch = subject.match(roomPrefixRegex);
        
        if (roomMatch) {
            room = roomMatch[2].trim();
            subject = roomMatch[1].trim();
        } else {
            roomMatch = subject.match(roomNumOnlyRegex);
            if (roomMatch) {
                room = roomMatch[2].trim();
                subject = roomMatch[1].trim();
            }
        }
        
        // 2. ПОИСК ПРЕПОДАВАТЕЛЯ
        const regexTwoInitials = /([А-ЯЁ][а-яё]+)\s+([А-ЯЁ]\.?\s*[А-ЯЁ]\.?)/;
        const regexOneInitial = /([А-ЯЁ][а-яё]+)\s+([А-ЯЁ]\.?)/;
        
        let teacherMatch = subject.match(regexTwoInitials);
        
        if (teacherMatch) {
            match = teacherMatch;
        } else {
            teacherMatch = subject.match(regexOneInitial);
            if (teacherMatch) {
                match = teacherMatch;
            }
        }
        
        if (match) {
            subject = subject.replace(match[0], '').trim();
            
            let rawInitials = match[2].trim();
            let surname = match[1];
            
            rawInitials = rawInitials.replace(/\s+/g, '');
            rawInitials = rawInitials.replace(/([А-ЯЁ])(?!\.)/g, '$1.');
            
            if (rawInitials.length > 3) {
                rawInitials = rawInitials.replace(/([А-ЯЁ]\.)([А-ЯЁ]\.)/, '$1 $2');
            }
            
            teacher = `${surname} ${rawInitials}`;
        }
        
        // 3. Очистка предмета
        subject = subject.replace(/,$/, '').trim();
        
        return { subject: subject || '—', teacher: teacher || 'Не указан', room };
    };
    
    // 4. Обрабатываем каждую часть
    rawParts.forEach(part => {
        const cleanedPart = part.trim();
        if (cleanedPart) {
            lessons.push(parsePart(cleanedPart));
        }
    });
    
    // 5. Пост-обработка: дублирование предмета
    if (lessons.length > 1) {
        const primarySubject = lessons[0].subject;
        lessons.forEach(lesson => {
            if (lesson.subject === '—' && primarySubject !== '—') {
                lesson.subject = primarySubject;
            }
        });
    }
    
    if (lessons.length === 0) {
        return [{ subject: '—', teacher: 'Не указан', room: '—' }];
    }
    
    return lessons;
}

// ===================== ЭКСПОРТ В EXCEL =====================
function exportToExcel() {
    if (scheduleData.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }
    
    try {
        // Создаём структуру данных для Excel
        const excelData = createExcelStructure();
        
        // Создаём книгу Excel
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Расписание");
        
        // Сохраняем файл
        const fileName = `schedule_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showNotification('Excel файл сохранён!', 'success');
    } catch (error) {
        console.error('Ошибка экспорта в Excel:', error);
        showNotification(`Ошибка экспорта: ${error.message}`, 'error');
    }
}

function createExcelStructure() {
    const data = [];
    
    // Заголовок
    data.push(['РАСПИСАНИЕ ЗАНЯТИЙ']);
    data.push([`с ${formatDate(period.start)} по ${formatDate(period.end)}`]);
    data.push([]);
    
    // Заголовки дней
    const headers = ['ДНИ НЕДЕЛИ', '№ урока'];
    const groups = [...new Set(scheduleData.map(l => l.group))].sort();
    
    groups.forEach(group => {
        headers.push(`Группа № ${group}`);
        headers.push(''); // Пустая колонка для аудитории
    });
    
    data.push(headers);
    
    // Данные по дням
    const daysOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    
    daysOrder.forEach(day => {
        // Группируем занятия по паре
        const dayLessons = scheduleData.filter(l => l.day === day);
        const pairs = [...new Set(dayLessons.map(l => l.pair))].sort((a, b) => {
            return parseInt(a) - parseInt(b);
        });
        
        // Добавляем день
        data.push([day, '']);
        
        // Добавляем занятия для каждой пары
        pairs.forEach(pair => {
            const row = ['', pair.split('-')[0]]; // Номер урока
            
            groups.forEach(group => {
                const lessons = dayLessons.filter(l => l.pair === pair && l.group === group);
                
                if (lessons.length > 0) {
                    const lesson = lessons[0];
                    const subjectText = `${lesson.subject} ${lesson.teacher !== 'Не указан' ? lesson.teacher : ''}`;
                    row.push(subjectText);
                    row.push(lesson.room);
                } else {
                    row.push('');
                    row.push('');
                }
            });
            
            data.push(row);
        });
    });
    
    return data;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
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
            message += `  • ${item.lesson.group}, ${item.lesson.day} (неделя ${item.lesson.week || '1'}), ${item.lesson.pair}\n`;
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

// ===================== ЭКСПОРТ/ИМПОРТ JSON =====================
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
            
            // Добавляем к существующим данным
            scheduleData.push(...data.schedule);
            renderTable();
            showNotification(`✅ Импортировано ${data.schedule.length} занятий!`, 'success');
        } catch (error) {
            console.error('Ошибка импорта JSON:', error);
            showNotification(`Ошибка импорта JSON: ${error.message}`, 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// ===================== УПРАВЛЕНИЕ НЕДЕЛЯМИ =====================
function changeWeek(weekNum) {
    currentWeek = weekNum;
    document.getElementById('currentWeek').textContent = weekNum;
    filterTable(); // Применяем фильтр по неделе
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
