// shchetnikov.ai v2: движение без библиотек. Содержимое видно и без скрипта;
// скрипт только добавляет появление, счётчики, смену кадров, переписку и журналы.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // 1. Появление блоков при прокрутке, один раз
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  // прячем только то, что ниже первого экрана и только в видимой вкладке:
  // в скрытой вкладке и при снимке страницы всё остаётся на месте
  if (!reduce && document.visibilityState === 'visible') {
    $$('.rv').forEach((el) => {
      if (el.closest('.hero') || el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('pre'); io.observe(el);
    });
  }
  document.addEventListener('visibilitychange', () => $$('.rv.pre').forEach((el) => el.classList.add('in')));

  // 2. Счётчики от нуля
  const fmt = (n, sep) => sep ? n.toLocaleString('ru-RU').replace(/\s/g, ' ') : String(n);
  const countIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; countIO.unobserve(el);
    const to = +el.dataset.count, sep = el.dataset.sep; if (reduce) return;
    const t0 = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(to * k), sep);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  // 3. Лёгкий параллакс свечения в сцене офиса
  const stage = $('#stage');
  if (stage && !reduce) {
    addEventListener('scroll', () => {
      const r = stage.getBoundingClientRect();
      stage.style.setProperty('--par', (r.top * -0.15).toFixed(1) + 'px');
    }, { passive: true });
  }

  // 4. Шаги: активный тот, что в середине экрана
  const steps = $$('.step');
  const stepIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { steps.forEach((s) => s.classList.remove('on')); e.target.classList.add('on'); }
  }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => stepIO.observe(s));
  if (steps[0]) steps[0].classList.add('on');

  // 5. Смена кадров: у каждой рамки свои точки
  $$('.frames').forEach((box) => {
    const imgs = $$('img', box), wrap = box.closest('.case'), dots = $$('.dots button', wrap);
    if (imgs.length < 2) return;
    let cur = 0, timer;
    const show = (n) => { cur = n; imgs.forEach((f, j) => f.classList.toggle('on', j === n)); dots.forEach((d, j) => d.classList.toggle('on', j === n)); };
    const run = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show((cur + 1) % imgs.length), 4200); };
    dots.forEach((d, n) => d.addEventListener('click', () => { show(n); run(); }));
    run();
  });

  // 6. Переписка гостиницы: формат сообщений рабочего бота, гость условный
  const hotel = [
    ['me', 'Бассейн сейчас свободен?'],
    ['bot', 'Сейчас бассейн закрыт, уже 01:56. Ближайшее свободное окно сегодня с 07:00 до 09:30.'],
    ['me', 'Принесите, пожалуйста, ещё два полотенца в номер 305.'],
    ['sys', 'Бот персонала, хозяйственная служба'],
    ['card', '🛎 ЗАЯВКА #214\n━━━━━━━━━━━━━━\n👥 Кому: хозяйственная служба\n📝 Принести два полотенца\n🔑 Номер: 305'],
    ['bot', 'Готово! 🛎 Если нужно что-то ещё, пишите.'],
  ];
  const playChat = (box, script) => {
    if (!box || box.dataset.busy) return;
    box.dataset.busy = '1'; box.innerHTML = '';
    let i = 0;
    const next = () => {
      if (i >= script.length) { setTimeout(() => { delete box.dataset.busy; playChat(box, script); }, 5000); return; }
      const [who, text] = script[i++];
      const add = () => {
        const m = document.createElement('div');
        if (who === 'sys') {
          m.className = 'chat-label'; m.style.margin = '4px 0'; m.textContent = text;
        } else {
          m.className = 'msg ' + (who === 'me' ? 'me' : who === 'card' ? 'bot card' : 'bot');
          m.textContent = text;
          if (who === 'card') {
            const kb = document.createElement('div'); kb.className = 'kb';
            kb.innerHTML = /ЗАЯВКА/.test(text) ? '<span>☑️ Готово</span><span>✉️ Написать гостю</span>' : '<span>Отправить</span><span>Поправить</span>'; m.appendChild(kb);
          }
        }
        box.appendChild(m);
        while (box.children.length > 6) box.firstChild.remove();
        setTimeout(next, who === 'me' ? 900 : 1600);
      };
      if (who === 'bot' || who === 'card') {
        const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>';
        box.appendChild(t); setTimeout(() => { t.remove(); add(); }, reduce ? 0 : 1100);
      } else add();
    };
    next();
  };

  // 7. Журналы, печатаются построчно
  const logs = {
    'log-wb': [
      ['14:22', 'старт', 'файл правок принят, 89 кампаний'],
      ['14:23', 'ставки', 'применено 769, проверено 769'],
      ['14:24', 'запуски', 'кампаний запущено 66'],
      ['14:25', 'бюджет', 'списано 89 000 ₽, потолок кабинета не превышен'],
      ['14:25', 'проверка', 'неизвестных исходов 0, застрявших 0', 'g'],
    ],
    'log-guard': [
      ['09:00', 'чтение', '1С: 412 долгов, изменений 0'],
      ['09:01', 'отбор', 'к напоминанию 23 по правилу «срок > 7 дней»'],
      ['09:01', 'пропуск', '4 в списке «не трогать»'],
      ['09:02', 'черновик', '23 письма по шаблону №2'],
      ['09:02', 'ждёт вас', '2 спорных случая', 'w'],
      ['09:03', 'отправка', '21 письмо, доставлено 21'],
      ['09:03', 'итог', 'ошибок 0', 'g'],
    ],
  };
  const playLog = (id) => {
    const ol = $('#' + id + ' ol'); if (!ol || ol.dataset.done) return;
    ol.dataset.done = '1'; ol.innerHTML = '';
    logs[id].forEach(([t, a, x, c], i) => setTimeout(() => {
      const li = document.createElement('li'); if (c) li.className = c;
      li.innerHTML = `<span>${t}</span><span>${a}</span><span></span>`;
      li.lastChild.textContent = x; ol.appendChild(li);
    }, reduce ? 0 : 450 * i));
  };
  const logIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) playLog(e.target.id);
  }), { threshold: 0.4 });
  Object.keys(logs).forEach((id) => { const el = $('#' + id); if (el) logIO.observe(el); });

  // 8. Переписка ассистента курса и окно офиса продаж: стартуют, когда видны
  const course = [
    ['sys', 'Проход 18:00, чат учеников'],
    ['me', 'Вопрос ученика: у меня агент всё время просит подтверждение на каждую команду, как настроить?'],
    ['card', 'Черновик ответа №3\n━━━━━━━━━━━━━━\nЭто режим разрешений. В уроке 4 разбирали, как дать агенту постоянное разрешение на безопасные команды и оставить вопрос только на удаление и отправку.'],
    ['bot', 'Пачка из 5 черновиков готова. Отправлю после вашего «отправляй».'],
  ];
  const officeSteps = [
    ['me', 'Собери КП для клиента по шаблону, истории встречи и правилам согласования'],
    ['step', 'шаблон КП найден в базе знаний'],
    ['step', 'история клиента и заметки со встречи собраны'],
    ['step', 'правила согласования учтены: скидка больше 10% только с руководителем'],
    ['file', ''],
  ];
  const playOffice = (box) => {
    if (!box || box.dataset.busy) return; box.dataset.busy = '1'; box.innerHTML = '';
    officeSteps.forEach(([k, t], i) => setTimeout(() => {
      const d = document.createElement('div');
      if (k === 'me') { d.className = 'msg me'; d.textContent = t; }
      else if (k === 'step') { d.className = 'step'; d.textContent = t; }
      else { d.className = 'file'; d.innerHTML = '<span><b>КП_черновик.docx</b>на согласование</span><span><b>КП_черновик.pdf</b>для клиента</span>'; }
      box.appendChild(d);
      if (i === officeSteps.length - 1) setTimeout(() => { delete box.dataset.busy; playOffice(box); }, 6000);
    }, reduce ? 0 : 900 * i));
  };
  logs['log-agents'] = [
    ['08:00', 'секретарь', 'прочитал состояние 12 проектов'],
    ['08:02', 'секретарь', 'план дня: 3 задачи инженеру, 1 ресёрчеру'],
    ['08:05', 'ресёрчер', 'взял задачу, источники приложит к ответу'],
    ['08:40', 'инженер', 'правка готова, тесты зелёные'],
    ['08:41', 'проверка', 'сверено с ожиданиями, 5 из 5', 'g'],
    ['08:42', 'ждёт вас', 'одна задача с деньгами, нужно ваше слово', 'w'],
  ];
  const seenIO = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    if (id === 'chat-hotel') playChat(e.target, hotel);
    if (id === 'chat-course') playChat(e.target, course);
    if (id === 'app-office') playOffice(e.target);
    if (logs[id]) playLog(id);
  }), { threshold: 0.3 });
  ['chat-hotel', 'chat-course', 'app-office', 'log-agents'].forEach((id) => { const el = $('#' + id); if (el) seenIO.observe(el); });

  // 9. Готовое состояние сразу при загрузке: превью и быстрый просмотр видят полный текст,
  // анимация потом проигрывает то же самое заново, когда блок на экране
  const staticChat = (box, script) => {
    if (!box) return;
    script.forEach(([who, text]) => {
      const m = document.createElement('div');
      if (who === 'sys') { m.className = 'chat-label'; m.style.margin = '4px 0'; m.textContent = text; }
      else { m.className = 'msg ' + (who === 'me' ? 'me' : who === 'card' ? 'bot card' : 'bot'); m.textContent = text; m.style.animation = 'none'; }
      box.appendChild(m);
    });
    while (box.children.length > 6) box.firstChild.remove();
  };
  staticChat($('#chat-hotel'), hotel);
  staticChat($('#chat-course'), course);
  Object.keys(logs).forEach((id) => {
    const ol = $('#' + id + ' ol'); if (!ol) return;
    logs[id].forEach(([t, act, x, c]) => {
      const li = document.createElement('li'); if (c) li.className = c; li.style.animation = 'none';
      li.innerHTML = `<span>${t}</span><span>${act}</span><span></span>`; li.lastChild.textContent = x; ol.appendChild(li);
    });
  });
  const off = $('#app-office');
  if (off) officeSteps.forEach(([k, t]) => {
    const d = document.createElement('div');
    if (k === 'me') { d.className = 'msg me'; d.textContent = t; }
    else if (k === 'step') { d.className = 'step'; d.textContent = t; }
    else { d.className = 'file'; d.innerHTML = '<span><b>КП_черновик.docx</b>на согласование</span><span><b>КП_черновик.pdf</b>для клиента</span>'; }
    d.style.animation = 'none'; off.appendChild(d);
  });
})();
