// ===================== СПРАВОЧНИКИ (УНИКАЛЬНЫЕ ДАННЫЕ) =====================
const TEACHERS = [
  "Буровина М.В.",
  "Буровина Н.Е.",
  "Быков М.Ю.",
  "Галимзянова Л.Р.",
  "Галушкин А.В.",
  "Горина Е.Д.",
  "Гуревич А.В.",
  "Дьяченко И.В.",
  "Жиркова О.А.",
  "Журавлева Н.С.",
  "Крылова Е.Е.",
  "Куликов Н.А.",
  "Кузнецова Е.Е.",
  "Лапшин А.В.",
  "Лядова М.Н.",
  "Лачинов О.Л.",
  "Макаров А.Е.",
  "Мальцева С.А.",
  "Мастеров С.Ю.",
  "Мещерякова О.Н.",
  "Сидоров К.М.",
  "Халезова Т.Б.",
  "Воронков В.В."
];

const ROOMS = [
  "101",
  "102",
  "202",
  "206",
  "207",
  "210",
  "216",
  "223",
  "223/224",
  "224",
  "301",
  "302",
  "306",
  "307",
  "401",
  "402",
  "405",
  "407",
  "дист",
  "каб. 112",
  "каб. 207",
  "каб. 401",
  "с/зал"
];

const SUBJECTS = [
  "Обществознание",
  "География",
  "Русский язык",
  "Физическая культура",
  "Литература",
  "Биология",
  "Математика",
  "СМИСС",
  "ТДА",
  "ТиТЧМС",
  "Электротехника",
  "Инженерная графика",
  "ОППРС",
  "ИТВПД",
  "Экономика",
  "История",
  "Химия",
  "Физика",
  "ОБиЗР",
  "ОТС",
  "ТРУП для СсЧПУ",
  "ТРиТОУиМОАиМ",
  "Охрана труда",
  "Материаловедение",
  "Человеческий фактор",
  "МиС",
  "УП для АСУ и И",
  "Английский язык/Немецкий",
  "ДиТО",
  "Консультация по ОТС и СО",
  "Испытания и доводка",
  "ТИД на МСсПУ",
  "ТОА",
  "ТЭД и ДС",
  "ОРиУПО",
  "Консультация по Экономике",
  "Классный час",
  "ОТД по ПИДМ",
  "ТПВ",
  "ОБП",
  "Ремонт раб",
  "БЖД",
  "ПРИМИ",
  "Основы философии",
  "КНП",
  "ПО и УДПСП",
  "ДНП и РМиАО",
  "Компьютерная графика",
  "Экзамен по Экономике",
  "Подготовка к экзамену",
  "РиВУПИДМ",
  "ПОПД",
  "СОЗДПМИСС",
  "Консультация по ОТО и Рем"
];

// ===================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====================
const STORAGE_KEY = 'itk37_schedule_v2';
const DATA_STORAGE_KEY = 'itk37_schedule_data_v2';
let scheduleData = [];
let periodStart = '';
let periodEnd = '';
let isInitialized = false;

// ===================== ИНИЦИАЛИЗАЦИЯ =====================
document.addEventListener('DOMContentLoaded', initEditor);

function initEditor() {
    loadDataFromStorage();
    populateDropdowns();
    loadFromStorage();
    loadPeriodFromStorage();
    renderTable();
    updateStatusBar();
    isInitialized = true;
    showNotification('Данные загружены', 'success');
}

// ===================== РАБОТА СО СПРАВОЧНИКАМИ =====================
function loadDataFromStorage() {
    try {
        const stored = localStorage.getItem(DATA_STORAGE_KEY);
        if (!stored) return;

        const data = JSON.parse(stored);

        if (Array.isArray(data.teachers)) {
            TEACHERS.length = 0;
            data.teachers.forEach(t => TEACHERS.push(t));
        }

        if (Array.isArray(data.rooms)) {
            ROOMS.length = 0;
            data.rooms.forEach(r => ROOMS.push(r));
        }

        if (Array.isArray(data.subjects)) {
            SUBJECTS.length = 0;
            data.subjects.forEach(s => SUBJECTS.push(s));
        }

        console.log('✅ Справочники загружены из localStorage');
    } catch (e) {
        console.error('Ошибка загрузки справочников:', e);
    }
}

function saveDataToStorage() {
    if (!isInitialized) return;

    try {
        const data = {
            teachers: TEACHERS,
            rooms: ROOMS,
            subjects: SUBJECTS,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
        console.log('✅ Справочники сохранены');
    } catch (e) {
        console.error('Ошибка сохранения справочников:', e);
        showNotification('Ошибка сохранения справочников', 'error');
    }
}

function populateDropdowns() {
    populateDropdown('teacher', TEACHERS);
    populateDropdown('room', ROOMS);
    populateDropdown('subject', SUBJECTS);
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

    if (TEACHERS.includes(cleanName)) {
        showNotification('Преподаватель уже существует', 'warning');
        return;
    }

    TEACHERS.push(cleanName);
    populateDropdown('teacher', TEACHERS);
    saveDataToStorage();
    showNotification('Преподаватель добавлен', 'success');
}

function addNewRoom() {
    const room = prompt('Введите номер кабинета (напр. 301 или 223/224):');
    if (!room || room.trim() === '') return;

    const cleanRoom = room.trim();

    if (ROOMS.includes(cleanRoom)) {
        showNotification('Кабинет уже существует', 'warning');
        return;
    }

    ROOMS.push(cleanRoom);
    populateDropdown('room', ROOMS);
    saveDataToStorage();
    showNotification('Кабинет добавлен', 'success');
}

function addNewSubject() {
    const subject = prompt('Введите название предмета:');
    if (!subject || subject.trim() === '') return;

    const cleanSubject = subject.trim();

    if (SUBJECTS.includes(cleanSubject)) {
        showNotification('Предмет уже существует', 'warning');
        return;
    }

    SUBJECTS.push(cleanSubject);
    populateDropdown('subject', SUBJECTS);
    saveDataToStorage();
    showNotification('Предмет добавлен', 'success');
}

// ===================== РАБОТА С ХРАНИЛИЩЕМ РАСПИСАНИЯ =====================
function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            scheduleData = [];
            updateStorageStatus('⚠️ Данные отсутствуют (импортируйте из Excel или добавьте вручную)', 'warning');
            return;
        }

        const data = JSON.parse(stored);
        if (!data?.schedule || !Array.isArray(data.schedule)) throw new Error('Некорректная структура');

        scheduleData = data.schedule;
        updateStorageStatus(`✅ Загружено ${scheduleData.length} занятий от ${new Date(data.lastUpdated).toLocaleString('ru-RU')}`, 'success');
    } catch (e) {
        console.error('Ошибка загрузки:', e);
        scheduleData = [];
        updateStorageStatus(`❌ Ошибка данных: ${e.message}. Данные сброшены.`, 'error');
        localStorage.removeItem(STORAGE_KEY);
    }
}

function saveToStorage() {
    if (!isInitialized) return;

    try {
        const periodStr = periodStart && periodEnd
            ? `Период: ${formatDateForDisplay(periodStart)} – ${formatDateForDisplay(periodEnd)}`
            : 'Период не задан';

        const data = {
            period: periodStr,
            schedule: scheduleData,
            lastUpdated: new Date().toISOString(),
            source: 'editor',
            version: '2.0'
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateStorageStatus(`✅ Сохранено ${scheduleData.length} занятий (${new Date().toLocaleTimeString()})`, 'success');
        updateStatusBar();
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        showNotification(`Ошибка сохранения: ${e.message}`, 'error');
        updateStorageStatus('❌ Ошибка записи в localStorage', 'error');
    }
}

function loadPeriodFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const data = JSON.parse(stored);
        if (!data?.period) return;

        const match = data.period.match(/(\d{2})\.(\d{2})\.(\d{4})\s*–\s*(\d{2})\.(\d{2})\.(\d{4})/);
        if (match) {
            periodStart = `${match[3]}-${match[2]}-${match[1]}`;
            periodEnd = `${match[6]}-${match[5]}-${match[4]}`;
            document.getElementById('periodStart').value = periodStart;
            document.getElementById('periodEnd').value = periodEnd;
        }
    } catch (e) {
        console.warn('Не удалось загрузить период:', e);
    }
}

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

    periodStart = startInput;
    periodEnd = endInput;
    saveToStorage();
    showNotification('Период обновлён', 'success');
}

// ===================== ОТОБРАЖЕНИЕ ДАННЫХ =====================
function renderTable() {
    const tbody = document.getElementById('scheduleBody');
    const emptyState = document.getElementById('emptyState');

    if (scheduleData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = scheduleData.map((lesson, index) => `
        <tr data-index="${index}">
            <td>${lesson.day}</td>
            <td>${lesson.pair}</td>
            <td><strong>${lesson.group}</strong></td>
            <td>${lesson.subject}</td>
            <td>${lesson.teacher === 'Не указан' ? '<em>не указан</em>' : lesson.teacher}</td>
            <td>${lesson.room}</td>
            <td class="action-cell">
                <button class="btn-table btn-edit" title="Редактировать" onclick="openEditModal(${index})">
                    ✏️
                </button>
                <button class="btn-table btn-delete" title="Удалить" onclick="deleteLesson(${index})">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

function updateStatusBar() {
    document.getElementById('lessonsCount').textContent = scheduleData.length;

    const groups = new Set(scheduleData.map(l => l.group));
    document.getElementById('groupsCount').textContent = groups.size;

    const teachers = new Set(scheduleData.map(l => l.teacher).filter(t => t !== 'Не указан'));
    document.getElementById('teachersCount').textContent = teachers.size;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            document.getElementById('lastUpdated').textContent =
                new Date(data.lastUpdated).toLocaleString('ru-RU');
        } catch (e) {
            document.getElementById('lastUpdated').textContent = 'Ошибка даты';
        }
    }
}

function updateStorageStatus(message, type) {
    const el = document.getElementById('storageStatus').querySelector('span');
    el.textContent = message;
    el.style.color = type === 'error' ? '#dc3545' : (type === 'warning' ? '#856404' : '#157347');
}

// ===================== УПРАВЛЕНИЕ ЗАНЯТИЯМИ =====================
function openAddModal() {
    document.getElementById('modalTitle').textContent = '➕ Добавить занятие';
    document.getElementById('editIndex').value = '';
    document.getElementById('lessonForm').reset();

    // Устанавливаем значения по умолчанию
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

    // Валидация
    if (!lesson.group || !lesson.subject || !lesson.teacher || !lesson.room) {
        showNotification('Заполните все обязательные поля', 'error');
        return;
    }

    if (index === '') {
        // Добавление
        scheduleData.push(lesson);
        showNotification('Занятие добавлено', 'success');
    } else {
        // Редактирование
        scheduleData[parseInt(index)] = lesson;
        showNotification('Занятие обновлено', 'success');
    }

    saveToStorage();
    renderTable();
    closeModal();
}

function deleteLesson(index) {
    if (!confirm(`Удалить занятие "${scheduleData[index].subject}" для группы ${scheduleData[index].group}?`)) return;

    scheduleData.splice(index, 1);
    saveToStorage();
    renderTable();
    showNotification('Занятие удалено', 'success');
}

// ===================== ИМПОРТ / ЭКСПОРТ =====================
function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    showNotification('Начинаю импорт из Excel...', 'success');
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });

            const parsed = parseExcelData(jsonData);

            if (parsed.schedule.length === 0) {
                throw new Error('Не удалось извлечь занятия из файла');
            }

            if (parsed.periodStart && parsed.periodEnd) {
                periodStart = parsed.periodStart;
                periodEnd = parsed.periodEnd;
                document.getElementById('periodStart').value = periodStart;
                document.getElementById('periodEnd').value = periodEnd;
            }

            scheduleData = parsed.schedule;
            saveToStorage();
            renderTable();
            showNotification(`✅ Импортировано ${scheduleData.length} занятий из Excel!`, 'success');
        } catch (error) {
            console.error('Ошибка импорта Excel:', error);
            showNotification(`Ошибка импорта: ${error.message}`, 'error');
        } finally {
            event.target.value = '';
        }
    };

    reader.readAsArrayBuffer(file);
}

function parseExcelData(lines) {
    const schedule = [];
    let periodStart = '', periodEnd = '';

    for (const row of lines) {
        const lineStr = String(row.join(';'));
        const match = lineStr.match(/с (\d{2})\.(\d{2})\.(\d{4}) по (\d{2})\.(\d{2})\.(\d{4})/);
        if (match) {
            periodStart = `${match[3]}-${match[2]}-${match[1]}`;
            periodEnd = `${match[6]}-${match[5]}-${match[4]}`;
            break;
        }
    }

    let dataStartRow = -1;
    const daysOrder = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    let currentDay = '';

    for (let i = 0; i < lines.length; i++) {
        const row = lines[i];
        const firstCell = String(row[0] || '').toLowerCase().trim();

        const foundDay = daysOrder.find(day => firstCell.includes(day));
        if (foundDay) {
            currentDay = foundDay.charAt(0).toUpperCase() + foundDay.slice(1);
            continue;
        }

        const lessonNum = String(row[1] || '').trim();
        if (!lessonNum || isNaN(parseInt(lessonNum))) continue;

        for (let col = 2; col < row.length; col += 2) {
            const cellText = (String(row[col] || '') + ' ' + String(row[col + 1] || '')).trim();
            if (!cellText || cellText.toLowerCase().includes('классный час')) continue;

            const subject = cellText.split('/')[0].trim();
            if (subject) {
                schedule.push({
                    day: currentDay || 'Понедельник',
                    pair: getLessonNumber(lessonNum),
                    subject: subject,
                    teacher: 'Не указан',
                    room: '—',
                    group: `Группа_${col}`
                });
            }
        }
    }

    return { schedule, periodStart, periodEnd };
}

function getLessonNumber(numStr) {
    const n = parseInt(numStr);
    if (n <= 2) return '1-2 урок';
    if (n <= 4) return '3-4 урок';
    if (n <= 6) return '5-6 урок';
    if (n <= 8) return '7-8 урок';
    return '9-10 урок';
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
                const match = data.period.match(/(\d{2})\.(\d{2})\.(\d{4})\s*–\s*(\d{2})\.(\d{2})\.(\d{4})/);
                if (match) {
                    periodStart = `${match[3]}-${match[2]}-${match[1]}`;
                    periodEnd = `${match[6]}-${match[5]}-${match[4]}`;
                    document.getElementById('periodStart').value = periodStart;
                    document.getElementById('periodEnd').value = periodEnd;
                }
            }

            scheduleData = data.schedule;
            saveToStorage();
            renderTable();
            showNotification(`✅ Импортировано ${scheduleData.length} занятий из JSON!`, 'success');
        } catch (error) {
            console.error('Ошибка импорта JSON:', error);
            showNotification(`Ошибка импорта JSON: ${error.message}`, 'error');
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function exportToJSON() {
    if (scheduleData.length === 0) {
        showNotification('Нет данных для экспорта', 'warning');
        return;
    }

    const periodStr = periodStart && periodEnd
        ? `Период: ${formatDateForDisplay(periodStart)} – ${formatDateForDisplay(periodEnd)}`
        : 'Период не задан';

    const data = {
        period: periodStr,
        schedule: scheduleData,
        exportedAt: new Date().toISOString(),
        source: 'editor_export'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schedule_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);

    showNotification('Файл сохранён!', 'success');
}

function clearStorage() {
    if (!confirm('⚠️ ВНИМАНИЕ! Все данные будут УДАЛЕНЫ безвозвратно. Продолжить?')) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DATA_STORAGE_KEY);
    scheduleData = [];
    periodStart = '';
    periodEnd = '';
    document.getElementById('periodStart').value = '';
    document.getElementById('periodEnd').value = '';
    renderTable();
    updateStatusBar();
    updateStorageStatus('⚠️ Данные очищены. Импортируйте новые данные.', 'warning');
    showNotification('Данные удалены из localStorage', 'success');
}

// ===================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====================
function formatDateForDisplay(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}.${m}.${y}`;
}

function showNotification(message, type) {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification ${type} show`;

    setTimeout(() => {
        notif.classList.remove('show');
    }, 3500);
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
});
