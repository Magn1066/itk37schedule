const XLS_FILE = 'schedule.xls';

let scheduleData = [];
let groups = new Set();
let teachers = new Set();
let groupColumns = {};

// =============== УПРАВЛЕНИЕ ХРАНИЛИЩЕМ ===============
const STORAGE_KEY = 'itk37_schedule_v2';

function saveScheduleToStorage(periodStr, schedule) {
    try {
        const data = {
            period: periodStr,
            schedule: schedule,
            lastUpdated: new Date().toISOString(),
            source: 'excel'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        console.log('✅ Данные сохранены в localStorage');
    } catch (e) {
        console.error('❌ Ошибка сохранения в localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return false;

        const data = JSON.parse(stored);
        if (!data?.schedule || !Array.isArray(data.schedule)) {
            console.warn('⚠️ Некорректные данные в localStorage');
            return false;
        }

        scheduleData = data.schedule;
        document.getElementById('dateHeader').textContent =
            `${data.period} (Данные от ${new Date(data.lastUpdated).toLocaleString('ru-RU')})`;

        groups = new Set();
        teachers = new Set();
        scheduleData.forEach(item => {
            if (item.group) groups.add(item.group);
            if (item.teacher && item.teacher !== 'Не указан') teachers.add(item.teacher);
        });

        fillSelect('groupSelect', Array.from(groups).sort());
        fillSelect('teacherSelect', Array.from(teachers).sort());
        document.getElementById('groupSection').style.display = 'block';
        switchView('group');

        console.log(`✅ Загружено из localStorage (${scheduleData.length} занятий)`);
        return true;
    } catch (e) {
        console.error('❌ Ошибка загрузки из localStorage:', e);
        return false;
    }
}

async function loadXLS() {
    try {
        const response = await fetch(XLS_FILE + '?t=' + Date.now());
        if (!response.ok) throw new Error(`Не удалось найти или загрузить файл расписания (${XLS_FILE}).`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1, defval: "" });
        const lines = worksheet;

        for (const row of lines) {
            const lineStr = String(row.join(';'));
            if (lineStr.includes('РАСПИСАНИЕ ЗАНЯТИЙ')) {
                const match = lineStr.match(/с (\d{2}\.\d{2}\.\d{4}) по (\d{2}\.\d{2}\.\d{4})/);
                if (match) {
                    document.getElementById('dateHeader').textContent = `Период: ${match[1]} – ${match[2]}`;
                }
                break;
            }
        }

        let headers = null;
        let dataStartRow = -1;
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
                    groups.add(groupName);
                    groupColumns[groupName] = idx;
                }
            }
        });

        parseScheduleData(lines, dataStartRow);

        const periodText = document.getElementById('dateHeader').textContent;
        saveScheduleToStorage(periodText, scheduleData);

        fillSelect('groupSelect', Array.from(groups).sort());
        fillSelect('teacherSelect', Array.from(teachers).sort());

        document.getElementById('groupSection').style.display = 'block';
        document.getElementById('dateHeader').textContent += " (Данные загружены)";
        switchView('group');

    } catch (error) {
        console.error('Ошибка при загрузке расписания:', error);
        alert(`Произошла ошибка: ${error.message}`);
        document.getElementById('dateHeader').textContent = `Ошибка загрузки: ${error.message}`;
    }
}

function parseScheduleData(lines, startRow) {
    const daysOrder = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    let currentDay = '';
    let lastLessonRowWas8 = false;

    for (let i = startRow; i < lines.length; i++) {
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
                const isDuplicate = subjectRaw.indexOf('/') === -1 && scheduleData.some(item =>
                    item.day === currentDay && item.group === groupName && item.pair === pair
                );

                if (!isDuplicate) {
                    scheduleData.push({
                        day: currentDay, pair: pair, subject: subject || '—', room: room, group: groupName, teacher: teacher || 'Не указан'
                    });
                    if (teacher && teacher !== 'Не указан') teachers.add(teacher);
                }
            });
        }
    }
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

        subject = subject.replace(/,$/, '').trim();

        return { subject: subject || '—', teacher: teacher || 'Не указан', room };
    }

    rawParts.forEach(part => {
        const cleanedPart = part.trim();
        if (cleanedPart) {
            lessons.push(parsePart(cleanedPart));
        }
    });

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

function fillSelect(id, items) {
    const select = document.getElementById(id);
    select.innerHTML = '<option value="">-- Выберите --</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

let currentView = 'group';
function switchView(view) {
    currentView = view;
    if (groups.size > 0) {
        document.getElementById('groupSection').style.display = view === 'group' ? 'block' : 'none';
        document.getElementById('teacherSection').style.display = view === 'teacher' ? 'block' : 'none';
    }
    document.getElementById('schedule').style.display = 'none';
    document.getElementById('tabGroup').classList.toggle('active', view === 'group');
    document.getElementById('tabTeacher').classList.toggle('active', view === 'teacher');
}

function loadSchedule() {
    const group = document.getElementById('groupSelect').value;
    const teacher = document.getElementById('teacherSelect').value;

    if ((currentView === 'group' && !group) || (currentView === 'teacher' && !teacher)) {
        document.getElementById('schedule').style.display = 'none';
        return;
    }

    const filtered = currentView === 'group' ?
        scheduleData.filter(l => l.group === group) :
        scheduleData.filter(l => l.teacher === teacher);

    const resultTitle = document.getElementById('resultTitle');
    if (currentView === 'group') {
        resultTitle.textContent = `Расписание для группы: ${group}`;
    } else {
        const teacherGroups = [...new Set(filtered.map(l => l.group))].sort().join(', ');
        resultTitle.innerHTML = `Расписание для преподавателя: ${teacher}<br><small style="font-size:0.8em; color: #fff;">Группы: ${teacherGroups}</small>`;
    }

    const content = document.getElementById('scheduleContent');
    content.innerHTML = '';

    const daysOrder = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    let hasLessons = false;

    daysOrder.forEach(dayKey => {
        const dayLessons = filtered.filter(l => l.day === dayKey);
        if (dayLessons.length > 0) {
            hasLessons = true;
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            const title = document.createElement('h3');
            title.textContent = dayKey;
            dayEl.appendChild(title);

            const sorted = dayLessons.sort((a, b) => {
                const numA = parseInt(a.pair.split('-')[0]);
                const numB = parseInt(b.pair.split('-')[0]);
                return numA - numB;
            });

            sorted.forEach(lesson => {
                const lessonEl = document.createElement('div');
                lessonEl.className = 'lesson';
                const teacherInfo = lesson.teacher === 'Не указан' ? '<em>не указан</em>' : lesson.teacher;

                if (currentView === 'group') {
                    lessonEl.innerHTML = `<span class="time">${lesson.pair}:</span> ${lesson.subject}<br><small><strong>Преподаватель:</strong> ${teacherInfo} | <strong>Аудитория:</strong> ${lesson.room}</small>`;
                } else {
                    lessonEl.innerHTML = `<span class="time">${lesson.pair}:</span> ${lesson.subject}<br><small><strong>Группа:</strong> ${lesson.group} | <strong>Аудитория:</strong> ${lesson.room}</small>`;
                }
                dayEl.appendChild(lessonEl);
            });
            content.appendChild(dayEl);
        }
    });

    if (!hasLessons) {
        content.innerHTML = '<p class="empty">Для выбранного варианта занятий нет.</p>';
    }
    document.getElementById('schedule').style.display = 'block';
}

window.onload = function() {
    if (!loadFromStorage()) {
        console.log('ℹ️ Данные в localStorage отсутствуют. Загружаем из Excel...');
        loadXLS();
    }
};