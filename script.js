const EXAM_TIME_SECONDS = 20 * 60;
let startTime = null;

const QUESTION_BANK = {
  subject1: MECHANICAL_QUESTIONS,
  subject2: PNEUMATIC_QUESTIONS,

  subject3: ELECTRICAL_QUESTIONS
};

const MODE_NAMES = {
  subject1: '⚙️ Механическое оборудование',
  subject2: '💨 Пневматическое оборудование',
  subject3: '⚡ Электрическое оборудование',
  examRandom: '🎲 Экзамен в перемешку',
  examTickets: '🎫 Экзамен по билетам',
  fullEquipment: '🧠 Полное тестирование по оборудованию'
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

function startTest(mode) {
  currentMode = mode;
  currentQuestions = buildQuestionList(mode);
  currentIndex = 0;
  correctCount = 0;
  selectedAnswer = null;
  userAnswers = [];
  resultReason = 'completed';
  timerEnabled = mode !== 'fullEquipment';
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

  renderQuestion();
}

function buildQuestionList(mode) {
  if (mode === 'subject1') {
    const fixedQuestion = QUESTION_BANK.subject1.find(question => question.fixedFirst);
    const otherQuestions = QUESTION_BANK.subject1.filter(question => !question.fixedFirst);

    return [
      prepareQuestion(fixedQuestion),
      ...shuffleArray(otherQuestions).map(question => prepareQuestion(question))
    ];
  }

  if (mode === 'fullEquipment') {
    const questions = [
      ...QUESTION_BANK.subject1,
      ...QUESTION_BANK.subject2,
      ...QUESTION_BANK.subject3
    ];

    return shuffleArray(questions).map(question => prepareQuestion(question));
  }

  if (mode === 'examRandom') {
    const questions = [
      ...QUESTION_BANK.subject1,
      ...QUESTION_BANK.subject2,
      ...QUESTION_BANK.subject3
    ];

    return shuffleArray(questions).map(question => prepareQuestion(question));
  }

  if (mode === 'examTickets') {
    const tickets = buildAllTickets();

    const questions = tickets.flatMap(ticket => {
      return ticket.questions.map(question => ({
        ...question,
        ticketTitle: ticket.ticketTitle
      }));
    });

    return questions.map(question => prepareQuestion(question));
  }

  return shuffleArray([...QUESTION_BANK[mode]]).map(question => prepareQuestion(question));
}

function buildAllTickets() {
  const ticketsMap = {};

  [
    ...QUESTION_BANK.subject1,
    ...QUESTION_BANK.subject2,
    ...QUESTION_BANK.subject3
  ].forEach(question => {
    const ticketTitle = question.ticketTitle || 'Без билета';

    if (!ticketsMap[ticketTitle]) {
      ticketsMap[ticketTitle] = {
        ticketTitle,
        questions: []
      };
    }

    ticketsMap[ticketTitle].questions.push(question);
  });

  return Object.values(ticketsMap);
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

function renderQuestion() {
  const question = currentQuestions[currentIndex];
  selectedAnswer = null;

  document.getElementById('modeName').textContent = MODE_NAMES[currentMode];

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
