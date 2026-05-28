const EXAM_TIME_SECONDS = 20 * 60;
let startTime = null;

const QUESTION_BANKS = {
  equipment: {
    subject1: MECHANICAL_QUESTIONS,
    subject2: PNEUMATIC_QUESTIONS,
    subject3: ELECTRICAL_QUESTIONS
  },
  general: {
    subject1: PTE_QUESTIONS,
    subject2: LABOR_QUESTIONS,
    subject3: TRAIN_CONTROL_QUESTIONS
  }
};

let currentExamGroup = 'equipment';
let QUESTION_BANK = QUESTION_BANKS[currentExamGroup];

const GROUP_UI = {
  equipment: {
    menuTitle: 'Тренажёр по оборудованию',
    menuSubtitle: 'Выбери предмет, экзамен по билетам или полное тестирование.',
    subjects: [
      {
        title: 'Механическое оборудование',
        text: 'Вопросы по механическому оборудованию.',
        icon: '⚙️',
        iconClass: 'mechanical'
      },
      {
        title: 'Пневматическое оборудование',
        text: 'Вопросы по пневматическому оборудованию.',
        icon: '💨',
        iconClass: 'pneumatic'
      },
      {
        title: 'Электрическое оборудование',
        text: 'Вопросы по электрическому оборудованию.',
        icon: '⚡',
        iconClass: 'electric'
      }
    ],
    examTitle: 'Экзамен по билетам',
    examText: '35 билетов по оборудованию. В каждом билете 3 вопроса.',
    fullTitle: 'Полное тестирование по оборудованию',
    fullText: 'Все вопросы по оборудованию в случайном порядке. Без таймера.'
  },
  general: {
    menuTitle: 'Общий экзамен',
    menuSubtitle: 'ПТЭ, охрана труда и управление поездом.',
    subjects: [
      {
        title: 'ПТЭ',
        text: 'Вопросы по правилам технической эксплуатации.',
        icon: '📘',
        iconClass: 'mechanical'
      },
      {
        title: 'Охрана труда',
        text: 'Вопросы по охране труда и безопасности.',
        icon: '🦺',
        iconClass: 'pneumatic'
      },
      {
        title: 'Управление поездом',
        text: 'Вопросы по управлению поездом.',
        icon: '🚇',
        iconClass: 'electric'
      }
    ],
    examTitle: 'Экзамен по билетам',
    examText: 'Билетный режим по ПТЭ, охране труда и управлению поездом.',
    fullTitle: 'Полное тестирование',
    fullText: 'Все вопросы общего экзамена в случайном порядке. Без таймера.'
  }
};

const MODE_NAMES = {
  subject1: 'Раздел 1',
  subject2: 'Раздел 2',
  subject3: 'Раздел 3',
  examTickets: '🎫 Экзамен по билетам',
  fullEquipment: '🧠 Полное тестирование'
};


const INTRO_CONFIG = {
  subject1: {
    icon: '⚙️',
    title: 'Механическое оборудование',
    button: 'Начать тест',
    rules: [
      'Вопросы идут в случайном порядке.',
      'Варианты ответов перемешиваются.',
      'На прохождение даётся 20 минут.',
      'После завершения показываются ошибки и развёрнутые объяснения.'
    ]
  },
  subject2: {
    icon: '💨',
    title: 'Пневматическое оборудование',
    button: 'Начать тест',
    rules: [
      'Вопросы идут в случайном порядке.',
      'Варианты ответов перемешиваются.',
      'На прохождение даётся 20 минут.',
      'После завершения показываются ошибки и развёрнутые объяснения.'
    ]
  },
  subject3: {
    icon: '⚡',
    title: 'Электрическое оборудование',
    button: 'Начать тест',
    rules: [
      'Вопросы идут в случайном порядке.',
      'Варианты ответов перемешиваются.',
      'На прохождение даётся 20 минут.',
      'После завершения показываются ошибки и развёрнутые объяснения.'
    ]
  },
  examTickets: {
    icon: '🎫',
    title: 'Экзамен по билетам',
    button: 'Начать экзамен',
    rules: [
      'Всего 35 билетов.',
      'В каждом билете сразу 3 вопроса.',
      'Допускается только 1 ошибка в билете.',
      'При 2 ошибках билет считается несданным.',
      'После несданного билета можно перейти к следующему.',
      'Таймер в этом режиме отсутствует.',
      'В конце показывается количество успешно сданных билетов.'
    ]
  },
  fullEquipment: {
    icon: '🧠',
    title: 'Полное тестирование по оборудованию',
    button: 'Начать тестирование',
    rules: [
      'В тест входят вопросы из механического, пневматического и электрического оборудования.',
      'Все вопросы идут в случайном порядке.',
      'Варианты ответов перемешиваются.',
      'Таймер в этом режиме отсутствует.',
      'После завершения показываются ошибки и развёрнутые объяснения.'
    ]
  }
};

let currentMode = null;
let currentQuestions = [];
let currentIndex = 0;
let correctCount = 0;
let selectedAnswer = null;
let userAnswers = [];
let timer = null;
let timeLeft = EXAM_TIME_SECONDS;
let resultReason = 'completed';
let timerEnabled = true;

let ticketExamTickets = [];
let ticketExamIndex = 0;
let ticketExamSuccessCount = 0;
let ticketExamAnswered = 0;
let ticketExamWrongCount = 0;
let ticketExamCurrentResults = [];
let ticketExamHistory = [];
let pendingIntroMode = null;



function setExamGroup(group, button) {
  currentExamGroup = group;
  QUESTION_BANK = QUESTION_BANKS[currentExamGroup];

  document.querySelectorAll('.exam-group-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  if (button) {
    button.classList.add('active');
  }

  updateMenuForGroup();
}

function updateMenuForGroup() {
  const config = GROUP_UI[currentExamGroup];

  document.getElementById('menuTitle').textContent = config.menuTitle;
  document.getElementById('menuSubtitle').textContent = config.menuSubtitle;

  config.subjects.forEach((subject, index) => {
    const number = index + 1;
    const icon = document.getElementById(`cardIcon${number}`);

    document.getElementById(`cardTitle${number}`).textContent = subject.title;
    document.getElementById(`cardText${number}`).textContent = subject.text;

    icon.textContent = subject.icon;
    icon.className = `card-icon ${subject.iconClass}`;
  });

  document.getElementById('examTicketsTitle').textContent = config.examTitle;
  document.getElementById('examTicketsText').textContent = config.examText;

  document.getElementById('fullTestTitle').textContent = config.fullTitle;
  document.getElementById('fullTestText').textContent = config.fullText;
}

function getModeDisplayName(mode) {
  if (mode === 'subject1') return GROUP_UI[currentExamGroup].subjects[0].icon + ' ' + GROUP_UI[currentExamGroup].subjects[0].title;
  if (mode === 'subject2') return GROUP_UI[currentExamGroup].subjects[1].icon + ' ' + GROUP_UI[currentExamGroup].subjects[1].title;
  if (mode === 'subject3') return GROUP_UI[currentExamGroup].subjects[2].icon + ' ' + GROUP_UI[currentExamGroup].subjects[2].title;
  if (mode === 'examTickets') return '🎫 ' + GROUP_UI[currentExamGroup].examTitle;
  if (mode === 'fullEquipment') return '🧠 ' + GROUP_UI[currentExamGroup].fullTitle;

  return MODE_NAMES[mode] || 'Режим';
}



function getIntroConfig(mode) {
  const ui = GROUP_UI[currentExamGroup];

  if (mode === 'subject1' || mode === 'subject2' || mode === 'subject3') {
    const subjectIndex = mode === 'subject1' ? 0 : mode === 'subject2' ? 1 : 2;
    const subject = ui.subjects[subjectIndex];

    return {
      icon: subject.icon,
      title: subject.title,
      button: 'Начать тест',
      rules: [
        'Вопросы идут в случайном порядке.',
        'Варианты ответов перемешиваются.',
        'На прохождение даётся 20 минут.',
        'После завершения показываются ошибки и развёрнутые объяснения.'
      ]
    };
  }

  if (mode === 'examTickets') {
    return {
      icon: '🎫',
      title: ui.examTitle,
      button: 'Начать экзамен',
      rules: [
        'В каждом билете сразу 3 вопроса.',
        'Допускается только 1 ошибка в билете.',
        'При 2 ошибках билет считается несданным.',
        'После несданного билета можно перейти к следующему.',
        'Таймер в этом режиме отсутствует.',
        'В конце показывается количество успешно сданных билетов.'
      ]
    };
  }

  if (mode === 'fullEquipment') {
    return {
      icon: '🧠',
      title: ui.fullTitle,
      button: 'Начать тестирование',
      rules: [
        'В тест входят все вопросы выбранной экзаменационной группы.',
        'Все вопросы идут в случайном порядке.',
        'Варианты ответов перемешиваются.',
        'Таймер в этом режиме отсутствует.',
        'После завершения показываются ошибки и развёрнутые объяснения.'
      ]
    };
  }

  return INTRO_CONFIG[mode];
}


function showIntro(mode) {
  pendingIntroMode = mode;

  const config = getIntroConfig(mode);

  if (!config) {
    startTest(mode);
    return;
  }

  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('testScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('introScreen').classList.remove('hidden');

  document.getElementById('introIcon').textContent = config.icon;
  document.getElementById('introTitle').textContent = config.title;

  const introRules = document.getElementById('introRules');

  introRules.innerHTML = config.rules
    .map(rule => `<div class="intro-rule">• ${escapeHtml(rule)}</div>`)
    .join('');

  const startButton = document.querySelector('.intro-controls .main-btn');

  if (startButton) {
    startButton.textContent = config.button;
  }
}

function startIntroMode() {
  if (!pendingIntroMode) return;

  document.getElementById('introScreen').classList.add('hidden');
  startTest(pendingIntroMode);
}


function startTest(mode) {
  currentMode = mode;
  currentQuestions = buildQuestionList(mode);
  currentIndex = 0;
  correctCount = 0;
  selectedAnswer = null;
  userAnswers = [];
  resultReason = 'completed';
  timerEnabled = mode !== 'fullEquipment' && mode !== 'examTickets';
  startTime = Date.now();

  document.getElementById('menuScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('testScreen').classList.remove('hidden');

  const timerText = document.getElementById('timerText');

  if (timerEnabled) {
    timerText.classList.remove('hidden');
    startTimer();
  } else {
    clearInterval(timer);
    timeLeft = 0;
    timerText.classList.add('hidden');
  }

  if (mode === 'examTickets') {
    startTicketExam();
    return;
  }

  renderQuestion();
}

function buildQuestionList(mode) {
  if (mode === 'subject1') {
    const fixedQuestion = QUESTION_BANK.subject1.find(question => question.fixedFirst);
    const otherQuestions = QUESTION_BANK.subject1.filter(question => !question.fixedFirst);

    if (fixedQuestion) {
      return [
        prepareQuestion(fixedQuestion),
        ...shuffleArray(otherQuestions).map(question => prepareQuestion(question))
      ];
    }

    return shuffleArray([...QUESTION_BANK.subject1]).map(question => prepareQuestion(question));
  }

  if (mode === 'fullEquipment') {
    const questions = [
      ...QUESTION_BANK.subject1,
      ...QUESTION_BANK.subject2,
      ...QUESTION_BANK.subject3
    ];

    return shuffleArray(questions).map(question => prepareQuestion(question));
  }

  if (mode === 'examTickets') {
    return [];
  }

  return shuffleArray([...(QUESTION_BANK[mode] || [])]).map(question => prepareQuestion(question));
}

function buildAllTickets() {
  const ticketsMap = {};

  [
    ...QUESTION_BANK.subject1,
    ...QUESTION_BANK.subject2,
    ...QUESTION_BANK.subject3
  ].forEach(question => {
    const ticketTitles = question.ticketTitles || [question.ticketTitle || 'Без билета'];

    ticketTitles.forEach(ticketTitle => {
      if (!ticketsMap[ticketTitle]) {
        ticketsMap[ticketTitle] = {
          ticketTitle,
          questions: []
        };
      }

      ticketsMap[ticketTitle].questions.push(question);
    });
  });

  return Object.values(ticketsMap).sort((a, b) => {
    const aNumber = Number(String(a.ticketTitle).replace(/\D/g, '')) || 0;
    const bNumber = Number(String(b.ticketTitle).replace(/\D/g, '')) || 0;

    return aNumber - bNumber;
  });
}

function prepareQuestion(question) {
  if (question.type === 'input-table') {
    return { ...question };
  }

  return shuffleAnswers(question);
}

function startTimer() {
  if (!timerEnabled) return;

  clearInterval(timer);
  timeLeft = EXAM_TIME_SECONDS;
  updateTimerText();

  timer = setInterval(() => {
    timeLeft--;
    updateTimerText();

    if (timeLeft <= 0) {
      clearInterval(timer);
      resultReason = 'time';
      showResult();
    }
  }, 1000);
}

function updateTimerText() {
  const timerText = document.getElementById('timerText');
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerText.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  timerText.classList.toggle('warning', timeLeft <= 5 * 60 && timeLeft > 60);
  timerText.classList.toggle('danger', timeLeft <= 60);
}

function startTicketExam() {
  ticketExamTickets = buildExamTicketsForMode();
  ticketExamIndex = 0;
  ticketExamSuccessCount = 0;
  ticketExamHistory = [];
  renderTicketExam();
}

function buildExamTicketsForMode() {
  const tickets = buildAllTickets()
    .filter(ticket => ticket.ticketTitle !== 'Без билета')
    .map(ticket => {
      return {
        ticketTitle: ticket.ticketTitle,
        questions: ticket.questions
          .slice(0, 3)
          .map(question => prepareQuestion(question))
      };
    })
    .filter(ticket => ticket.questions.length > 0);

  return tickets;
}

function renderTicketExam() {
  const ticket = ticketExamTickets[ticketExamIndex];

  if (!ticket) {
    showTicketExamResult();
    return;
  }

  ticketExamAnswered = 0;
  ticketExamWrongCount = 0;
  ticketExamCurrentResults = [];

  document.getElementById('modeName').textContent = getModeDisplayName(currentMode);
  document.getElementById('progressText').textContent =
    `Билет ${ticketExamIndex + 1} / ${ticketExamTickets.length}`;
  document.getElementById('scoreText').textContent =
    `Сдано: ${ticketExamSuccessCount}`;

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.disabled = true;
  nextBtn.textContent =
    ticketExamIndex === ticketExamTickets.length - 1
      ? 'Завершить экзамен'
      : 'Следующий билет';

  const questionText = document.getElementById('questionText');
  questionText.innerHTML = `
    <div class="ticket-exam-title">${escapeHtml(ticket.ticketTitle)}</div>
    <div class="ticket-exam-subtitle">
      В билете 3 вопроса. Можно ошибиться только 1 раз.
    </div>
    <div id="ticketStatus" class="ticket-status"></div>
  `;

  const answersList = document.getElementById('answersList');
  answersList.innerHTML = '';

  ticket.questions.forEach((question, questionIndex) => {
    const block = document.createElement('div');
    block.className = 'ticket-question-block';
    block.dataset.questionIndex = questionIndex;

    if (question.type === 'input-table') {
      block.innerHTML = `
        <div class="ticket-question-title">
          ${questionIndex + 1}. ${escapeHtml(question.question)}
        </div>
        ${renderInputTableForTicket(question.table, questionIndex)}
        <button class="main-btn table-check-btn" onclick="checkTicketInputTable(${questionIndex})">
          Проверить таблицу
        </button>
      `;
    } else {
      const answerButtons = question.answers.map((answer, answerIndex) => {
        return `
          <button class="answer-btn" onclick="selectTicketAnswer(${questionIndex}, ${answerIndex}, this)">
            ${escapeHtml(answer)}
          </button>
        `;
      }).join('');

      block.innerHTML = `
        <div class="ticket-question-title">
          ${questionIndex + 1}. ${escapeHtml(question.question)}
        </div>
        <div class="answers">${answerButtons}</div>
      `;
    }

    answersList.appendChild(block);
  });
}

function renderInputTableForTicket(table, questionIndex) {
  const headers = table.headers
    .map(header => `<th>${escapeHtml(header)}</th>`)
    .join('');

  const rows = table.rows
    .map((row, rowIndex) => {
      const cells = row.cells.map((cell, visualCellIndex) => {
        const colspan = cell.colspan || 1;
        const firstColIndex = getFirstColumnIndex(row.cells, visualCellIndex);

        return `
          <td colspan="${colspan}">
            <input
              class="table-input ticket-table-input"
              data-question="${questionIndex}"
              data-row="${rowIndex}"
              data-col="${firstColIndex}"
              placeholder="Введите ответ"
              title="${escapeHtml(cell.hint || '')}"
            />
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-wrapper">
      <table class="question-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function selectTicketAnswer(questionIndex, answerIndex, button) {
  const ticket = ticketExamTickets[ticketExamIndex];
  const question = ticket.questions[questionIndex];
  const block = button.closest('.ticket-question-block');

  if (block.classList.contains('answered')) return;

  block.classList.add('answered');

  const buttons = block.querySelectorAll('.answer-btn');

  buttons.forEach((btn, index) => {
    btn.disabled = true;

    if (index === question.correct) {
      btn.classList.add('correct');
    }

    if (index === answerIndex && index !== question.correct) {
      btn.classList.add('wrong');
    }
  });

  const isCorrect = answerIndex === question.correct;

  registerTicketAnswer({
    question: question.question,
    ticketTitle: ticket.ticketTitle,
    answers: question.answers,
    correct: question.correct,
    selected: answerIndex,
    explanation: question.explanation || '',
    isCorrect
  });
}

function checkTicketInputTable(questionIndex) {
  const ticket = ticketExamTickets[ticketExamIndex];
  const question = ticket.questions[questionIndex];
  const block = document.querySelector(`.ticket-question-block[data-question-index="${questionIndex}"]`);

  if (!block || block.classList.contains('answered')) return;

  const inputs = block.querySelectorAll('.ticket-table-input');

  let correctCells = 0;
  let totalCells = 0;

  inputs.forEach(input => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);

    const userValue = normalizeAnswer(input.value);
    const correctValue = normalizeAnswer(question.table.rows[row].values[col]);

    totalCells++;

    if (userValue === correctValue) {
      correctCells++;
      input.classList.add('table-correct');
      input.classList.remove('table-wrong');
    } else {
      input.classList.add('table-wrong');
      input.classList.remove('table-correct');
    }

    input.disabled = true;
  });

  const isCorrect = correctCells === totalCells;

  const checkBtn = block.querySelector('.table-check-btn');

  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.textContent = `Проверено: ${correctCells} / ${totalCells}`;
  }

  block.classList.add('answered');

  registerTicketAnswer({
    question: question.question,
    ticketTitle: ticket.ticketTitle,
    type: 'input-table',
    table: question.table,
    correctCells,
    totalCells,
    selected: isCorrect ? 0 : -1,
    correct: 0,
    explanation: '',
    isCorrect
  });
}

function registerTicketAnswer(result) {
  ticketExamAnswered++;

  if (!result.isCorrect) {
    ticketExamWrongCount++;
  }

  ticketExamCurrentResults.push(result);

  updateTicketStatus();

  if (ticketExamWrongCount >= 2) {
    failCurrentTicket();
    return;
  }

  const ticket = ticketExamTickets[ticketExamIndex];

  if (ticketExamAnswered >= ticket.questions.length) {
    passCurrentTicket();
  }
}

function updateTicketStatus() {
  const status = document.getElementById('ticketStatus');

  if (!status) return;

  status.textContent =
    `Ошибок: ${ticketExamWrongCount} / 2 · Отвечено: ${ticketExamAnswered} / ${ticketExamTickets[ticketExamIndex].questions.length}`;

  status.classList.toggle('ticket-status-danger', ticketExamWrongCount >= 2);
}

function failCurrentTicket() {
  const ticket = ticketExamTickets[ticketExamIndex];

  disableCurrentTicketInputs();

  ticketExamHistory.push({
    ticketTitle: ticket.ticketTitle,
    passed: false,
    wrongCount: ticketExamWrongCount,
    results: ticketExamCurrentResults
  });

  showTicketStatusMessage('Экзамен завален', false);
  document.getElementById('nextBtn').disabled = false;
}

function passCurrentTicket() {
  const ticket = ticketExamTickets[ticketExamIndex];

  ticketExamSuccessCount++;

  ticketExamHistory.push({
    ticketTitle: ticket.ticketTitle,
    passed: true,
    wrongCount: ticketExamWrongCount,
    results: ticketExamCurrentResults
  });

  showTicketStatusMessage('Билет сдан', true);
  document.getElementById('scoreText').textContent =
    `Сдано: ${ticketExamSuccessCount}`;
  document.getElementById('nextBtn').disabled = false;
}

function showTicketStatusMessage(message, passed) {
  const status = document.getElementById('ticketStatus');

  if (!status) return;

  status.textContent = message;
  status.classList.toggle('ticket-status-success', passed);
  status.classList.toggle('ticket-status-danger', !passed);
}

function disableCurrentTicketInputs() {
  const blocks = document.querySelectorAll('.ticket-question-block');

  blocks.forEach(block => {
    block.classList.add('answered');

    block.querySelectorAll('button').forEach(button => {
      button.disabled = true;
    });

    block.querySelectorAll('input').forEach(input => {
      input.disabled = true;
    });
  });
}

function showTicketExamResult() {
  clearInterval(timer);

  document.getElementById('testScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');

  const totalTickets = ticketExamTickets.length;
  const failedTickets = totalTickets - ticketExamSuccessCount;

  document.getElementById('finalScore').textContent =
    `${ticketExamSuccessCount} / ${totalTickets}`;

  document.getElementById('finalText').innerHTML =
    `Успешно пройдено билетов: ${ticketExamSuccessCount}<br>Завалено билетов: ${failedTickets}<br>Режим без таймера`;

  renderTicketExamMistakes();
}

function renderTicketExamMistakes() {
  const mistakesList = document.getElementById('mistakesList');
  mistakesList.innerHTML = '';

  const failed = ticketExamHistory.filter(ticket => !ticket.passed);

  if (failed.length === 0) {
    mistakesList.innerHTML =
      '<div class="mistake-card">Все билеты сданы успешно.</div>';
    return;
  }

  failed.forEach(ticket => {
    const card = document.createElement('div');
    card.className = 'mistake-card';

    const wrongAnswers = ticket.results
      .filter(result => !result.isCorrect)
      .map(result => {
        if (result.type === 'input-table') {
          return `
            <div class="ticket-result-error">
              <strong>${escapeHtml(result.question)}</strong><br>
              Заполнено верно: <b>${result.correctCells} / ${result.totalCells}</b><br>
              ${renderCorrectTable(result.table)}
            </div>
          `;
        }

        return `
          <div class="ticket-result-error">
            <strong>${escapeHtml(result.question)}</strong><br>
            Ваш ответ: <b>${escapeHtml(result.answers[result.selected])}</b><br>
            Правильный ответ: <b>${escapeHtml(result.answers[result.correct])}</b><br>
            Развёрнутое объяснение:<br>
            ${escapeHtml(result.explanation || 'Объяснение для этого вопроса пока не добавлено.')}
          </div>
        `;
      }).join('<br>');

    card.innerHTML = `
      <strong>${escapeHtml(ticket.ticketTitle)}</strong><br>
      Ошибок: ${ticket.wrongCount}<br><br>
      ${wrongAnswers}
    `;

    mistakesList.appendChild(card);
  });
}

function renderQuestion() {
  const question = currentQuestions[currentIndex];
  selectedAnswer = null;

  document.getElementById('modeName').textContent = getModeDisplayName(currentMode);

  document.getElementById('progressText').textContent =
    `Вопрос ${currentIndex + 1} / ${currentQuestions.length}`;

  document.getElementById('scoreText').textContent =
    `Верно: ${correctCount}`;

  const nextBtn = document.getElementById('nextBtn');
  nextBtn.disabled = true;
  nextBtn.textContent =
    currentIndex === currentQuestions.length - 1
      ? 'Завершить тест'
      : 'Следующий вопрос';

  const questionText = document.getElementById('questionText');
  questionText.textContent = question.question;

  const answersList = document.getElementById('answersList');
  answersList.innerHTML = '';

  if (question.type === 'input-table') {
    answersList.innerHTML = renderInputTable(question.table);

    const checkBtn = document.createElement('button');
    checkBtn.className = 'main-btn table-check-btn';
    checkBtn.textContent = 'Проверить таблицу';
    checkBtn.onclick = () => checkInputTable(question);

    answersList.appendChild(checkBtn);
    return;
  }

  question.answers.forEach((answer, index) => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = answer;
    btn.onclick = () => selectAnswer(index);
    answersList.appendChild(btn);
  });
}

function renderInputTable(table) {
  const headers = table.headers
    .map(header => `<th>${escapeHtml(header)}</th>`)
    .join('');

  const rows = table.rows
    .map((row, rowIndex) => {
      const cells = row.cells.map((cell, visualCellIndex) => {
        const colspan = cell.colspan || 1;
        const firstColIndex = getFirstColumnIndex(row.cells, visualCellIndex);

        return `
          <td colspan="${colspan}">
            <input
              class="table-input"
              data-row="${rowIndex}"
              data-col="${firstColIndex}"
              data-colspan="${colspan}"
              placeholder="Введите ответ"
              title="${escapeHtml(cell.hint || '')}"
            />
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-wrapper">
      <table class="question-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function getFirstColumnIndex(cells, visualCellIndex) {
  let index = 0;

  for (let i = 0; i < visualCellIndex; i++) {
    index += cells[i].colspan || 1;
  }

  return index;
}

function checkInputTable(question) {
  const inputs = document.querySelectorAll('.table-input');

  let correctCells = 0;
  let totalCells = 0;

  inputs.forEach(input => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);

    const userValue = normalizeAnswer(input.value);
    const correctValue = normalizeAnswer(question.table.rows[row].values[col]);

    totalCells++;

    if (userValue === correctValue) {
      correctCells++;
      input.classList.add('table-correct');
      input.classList.remove('table-wrong');
    } else {
      input.classList.add('table-wrong');
      input.classList.remove('table-correct');
    }

    input.disabled = true;
  });

  const isCorrect = correctCells === totalCells;

  if (isCorrect) {
    correctCount++;
  }

  userAnswers.push({
    question: question.question,
    ticketTitle: question.ticketTitle || '',
    type: 'input-table',
    table: question.table,
    correctCells,
    totalCells,
    selected: isCorrect ? 0 : -1,
    correct: 0,
    explanation: question.explanation || ''
  });

  document.getElementById('scoreText').textContent = `Верно: ${correctCount}`;
  document.getElementById('nextBtn').disabled = false;

  const checkBtn = document.querySelector('.table-check-btn');
  if (checkBtn) {
    checkBtn.disabled = true;
    checkBtn.textContent = `Проверено: ${correctCells} / ${totalCells}`;
  }
}

function normalizeAnswer(value) {
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\./g, '')
    .replace(/ё/g, 'е')
    .trim();
}

function shuffleAnswers(question) {
  const answers = question.answers.map((answer, index) => ({
    text: answer,
    isCorrect: index === question.correct
  }));

  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }

  return {
    ...question,
    answers: answers.map(answer => answer.text),
    correct: answers.findIndex(answer => answer.isCorrect)
  };
}

function selectAnswer(answerIndex) {
  if (selectedAnswer !== null) return;

  selectedAnswer = answerIndex;

  const question = currentQuestions[currentIndex];
  const buttons = document.querySelectorAll('.answer-btn');

  buttons.forEach((btn, index) => {
    if (index === question.correct) {
      btn.classList.add('correct');
    }

    if (index === answerIndex && index !== question.correct) {
      btn.classList.add('wrong');
    }
  });

  if (answerIndex === question.correct) {
    correctCount++;
  }

  userAnswers.push({
    question: question.question,
    ticketTitle: question.ticketTitle || '',
    answers: question.answers,
    correct: question.correct,
    selected: answerIndex,
    explanation: question.explanation || ''
  });

  document.getElementById('scoreText').textContent = `Верно: ${correctCount}`;
  document.getElementById('nextBtn').disabled = false;
}

function nextQuestion() {
  if (currentMode === 'examTickets') {
    ticketExamIndex++;

    if (ticketExamIndex < ticketExamTickets.length) {
      renderTicketExam();
    } else {
      showTicketExamResult();
    }

    return;
  }

  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    resultReason = 'completed';
    showResult();
  }
}

function showResult() {
  clearInterval(timer);

  document.getElementById('testScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');

  const total = currentQuestions.length;
  const percent = Math.round((correctCount / total) * 100);

  const elapsedSeconds = Math.min(
    EXAM_TIME_SECONDS,
    Math.floor((Date.now() - startTime) / 1000)
  );

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingSeconds = elapsedSeconds % 60;

  const formattedTime =
    `${String(elapsedMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;

  document.getElementById('finalScore').textContent = `${correctCount} / ${total}`;

  if (!timerEnabled) {
    document.getElementById('finalText').innerHTML =
      `Правильных ответов: ${percent}%<br>Режим без таймера`;
  } else if (resultReason === 'time') {
    document.getElementById('finalText').innerHTML =
      `Время вышло.<br>Правильных ответов: ${percent}%<br>Время прохождения: ${formattedTime}`;
  } else {
    document.getElementById('finalText').innerHTML =
      `Правильных ответов: ${percent}%<br>Время прохождения: ${formattedTime}`;
  }

  renderMistakes();
}

function renderMistakes() {
  const mistakesList = document.getElementById('mistakesList');
  mistakesList.innerHTML = '';

  const mistakes = userAnswers.filter(item => item.selected !== item.correct);

  if (mistakes.length === 0) {
    mistakesList.innerHTML =
      '<div class="mistake-card">Ошибок нет. Отличный результат!</div>';
    return;
  }

  mistakes.forEach(item => {
    const card = document.createElement('div');
    card.className = 'mistake-card';

    if (item.type === 'input-table') {
      card.innerHTML = `
        <strong>${escapeHtml(item.question)}</strong><br><br>
        Заполнено верно: <b>${item.correctCells} / ${item.totalCells}</b><br><br>
        <span>Правильный вариант таблицы:</span><br>
        ${renderCorrectTable(item.table)}
      `;

      mistakesList.appendChild(card);
      return;
    }

    card.innerHTML = `
      <strong>${escapeHtml(item.question)}</strong><br><br>

      <span>Ваш ответ:</span><br>
      <b>${escapeHtml(item.answers[item.selected])}</b><br><br>

      <span>Правильный ответ:</span><br>
      <b>${escapeHtml(item.answers[item.correct])}</b><br><br>

      <span>Развёрнутое объяснение:</span><br>
      ${escapeHtml(item.explanation || 'Объяснение для этого вопроса пока не добавлено.')}
    `;

    mistakesList.appendChild(card);
  });
}

function renderCorrectTable(table) {
  const headers = table.headers
    .map(header => `<th>${escapeHtml(header)}</th>`)
    .join('');

  const rows = table.rows
    .map(row => {
      const cells = row.cells.map(cell => {
        const colspan = cell.colspan || 1;
        const hint = cell.hint
          ? `<div class="table-hint">${escapeHtml(cell.hint)}</div>`
          : '';

        return `
          <td colspan="${colspan}">
            ${escapeHtml(cell.value)}
            ${hint}
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td>${escapeHtml(row.label)}</td>
          ${cells}
        </tr>
      `;
    })
    .join('');

  return `
    <div class="table-wrapper">
      <table class="question-table correct-table">
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function goMenu() {
  clearInterval(timer);
  ticketExamTickets = [];
  ticketExamIndex = 0;
  ticketExamSuccessCount = 0;
  ticketExamAnswered = 0;
  ticketExamWrongCount = 0;
  ticketExamCurrentResults = [];
  ticketExamHistory = [];

  pendingIntroMode = null;

  document.getElementById('introScreen').classList.add('hidden');
  document.getElementById('testScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('menuScreen').classList.remove('hidden');
}

function restartLastTest() {
  if (currentMode) {
    startTest(currentMode);
  }
}

function setViewMode(mode, button) {
  document.body.classList.toggle('mobile-view', mode === 'mobile');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  button.classList.add('active');
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


document.addEventListener('DOMContentLoaded', updateMenuForGroup);
