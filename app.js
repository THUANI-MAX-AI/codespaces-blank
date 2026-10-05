const lessons = [
  {
    title: "Say hello to the console.",
    shortTitle: "Your first hello",
    topic: "YOUR VERY FIRST STEP",
    description: "You write a line. Your computer answers back. That's it: you're coding.",
    challenge: "Try changing \"Ada\" to your name, then run your code.",
    code: 'const name = "Ada";\nconsole.log("Hello, " + name + "!");',
    success: output => output.includes("Hello,"),
    successText: "Your first message made it out into the world. That's coding!",
    context: 'A place to ask "wait, what does that mean?" is always a good place to be.',
    prompts: ["What is a console?", "Why use quotes?", "What does const mean?"],
    explanations: {
      console: "The console is a little window where your code can send messages. `console.log(...)` prints whatever you put inside its parentheses, so you can see what your code is doing.",
      quotes: 'Quotes tell JavaScript, "these characters are words, not code." For example, "Hello!" is text (a string), while Hello without quotes would be treated like the name of a variable.',
      const: "`const` creates a named value that your code can use later. Here, `name` remembers the text \"Ada\" so we can put it inside our greeting."
    }
  },
  {
    title: "Give a value a name.",
    shortTitle: "Meet variables",
    topic: "THINGS WITH NAMES",
    description: "A variable is a name for a value. Give something a name and you can use it again.",
    challenge: "Change one number, run your code, and see what the total becomes.",
    code: "const apples = 3;\nconst oranges = 2;\nconsole.log(apples + oranges);",
    success: output => output.trim() === "5",
    successText: "Five pieces of fruit, one tiny bit of code. Nicely done!",
    context: "A variable is a little labeled box. Give it a name, put a value inside, and your code can find it again later.",
    prompts: ["What is a variable?", "How did the math work?", "What does const mean?"],
    explanations: {
      variable: "Think of `apples` as a label on a box. `const apples = 3` puts the number 3 inside it. Later, JavaScript can use that name to find the value again.",
      math: "JavaScript understands the `+` sign, so `apples + oranges` adds the values those names hold: 3 plus 2 makes 5. `console.log` shows the answer.",
      const: "`const` creates a named value. It works well when you don't need to replace that value later. Change the number after the `=` sign to experiment."
    }
  },
  {
    title: "Teach your code a new trick.",
    shortTitle: "Make a function",
    topic: "CODE YOU CAN REUSE",
    description: "A function is a little recipe your computer can follow whenever you ask.",
    challenge: "Try changing the name inside greet(), then run your new recipe.",
    code: 'function greet(name) {\n  return "Hello, " + name + "!";\n}\n\nconsole.log(greet("Ada"));',
    success: output => output.includes("Hello,"),
    successText: "You wrote a recipe, gave it an ingredient, and got a greeting back. That's a function!",
    context: "Functions are reusable recipes. Give one an ingredient, and it can give a result back whenever you need it.",
    prompts: ["What is a function?", "What does return do?", "What is name?"],
    explanations: {
      function: "A function is a reusable recipe. `function greet(name) { ... }` gives the recipe its name (`greet`) and a place to receive an ingredient (`name`). Call it again whenever you need a greeting.",
      return: "`return` hands the result back from the function. Here, the recipe puts together a greeting and returns it, so `console.log` can show the finished message.",
      name: '`name` is called a parameter: a placeholder ingredient for the function. When you write `greet("Ada")`, JavaScript puts "Ada" in that placeholder. Try swapping it for your own name.'
    }
  }
];

const storageKey = "little-syntax-progress";
const editor = document.querySelector("#code-input");
const lineNumbers = document.querySelector("#line-numbers");
const outputContent = document.querySelector("#output-content");
const runStatus = document.querySelector("#run-status");
const runButton = document.querySelector("#run-button");
const successMessage = document.querySelector("#success-message");
const lessonNav = document.querySelector("#lesson-nav");
const chatMessages = document.querySelector("#chat-messages");
const chatInput = document.querySelector("#chat-input");

let activeLesson = 0;
let lastSuccessfulOutput = "";
let completedLessons = loadProgress();
let pendingWorker = null;

function loadProgress() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(index => Number.isInteger(index) && index >= 0 && index < lessons.length);
  } catch {
    return [];
  }
}

function saveProgress() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(completedLessons));
  } catch {
    // Keep the studio usable when browser storage is unavailable.
  }
}

function renderNavigation() {
  lessonNav.replaceChildren();

  lessons.forEach((lesson, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lesson-link";
    button.setAttribute("aria-current", index === activeLesson ? "step" : "false");
    if (index === activeLesson) button.classList.add("active");
    if (completedLessons.includes(index)) button.classList.add("completed");

    const number = document.createElement("span");
    number.className = "lesson-step";
    number.textContent = completedLessons.includes(index) ? "✓" : `0${index + 1}`;

    const copy = document.createElement("span");
    copy.className = "lesson-link-copy";
    const name = document.createElement("strong");
    name.textContent = lesson.shortTitle;
    const duration = document.createElement("span");
    duration.textContent = index === 0 ? "5 min · START HERE" : "5 min";
    copy.append(name, duration);
    button.append(number, copy);
    button.addEventListener("click", () => selectLesson(index));
    lessonNav.append(button);
  });

  const completed = completedLessons.length;
  const percent = Math.round((completed / lessons.length) * 100);
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  document.querySelector("#progress-bar").style.width = `${percent}%`;
  document.querySelector(".progress-track").setAttribute("aria-valuenow", String(completed));
  document.querySelector("#streak-count").textContent = `${completed} of ${lessons.length} lessons`;
}

function updateLineNumbers() {
  const count = editor.value.split("\n").length;
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
}

function addBubble(text, kind, richText = false) {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${kind}`;
  if (richText) {
    bubble.innerHTML = text.replaceAll(/`([^`]+)`/g, "<code>$1</code>");
  } else {
    bubble.textContent = text;
  }
  chatMessages.append(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return bubble;
}

function updateSuggestions() {
  const container = document.querySelector("#suggested-questions");
  container.replaceChildren();
  lessons[activeLesson].prompts.forEach(prompt => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-chip";
    button.append(document.createTextNode(prompt));
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    button.append(arrow);
    button.addEventListener("click", () => askTutor(prompt));
    container.append(button);
  });
}

function addWelcomeMessage() {
  chatMessages.replaceChildren();
  addBubble("Hey, welcome in! Pick a question or ask me anything. We can take it one small step at a time.", "assistant");
}

function selectLesson(index) {
  activeLesson = index;
  const lesson = lessons[index];
  document.querySelector("#lesson-title").textContent = lesson.title;
  document.querySelector("#lesson-topic").textContent = lesson.topic;
  document.querySelector("#lesson-description").textContent = lesson.description;
  document.querySelector("#lesson-number").textContent = `LESSON 0${index + 1} OF 0${lessons.length}`;
  document.querySelector("#task-copy").textContent = lesson.challenge;
  document.querySelector("#tutor-context").textContent = lesson.context;
  document.querySelector(".file-tab > span:nth-child(2)").textContent = lesson.shortTitle.toLowerCase().replaceAll(" ", "-") + ".js";
  editor.value = lesson.code;
  outputContent.replaceChildren(Object.assign(document.createElement("span"), {
    className: "output-placeholder",
    textContent: "Your code's reply\nwill show up here."
  }));
  runStatus.className = "run-status";
  runStatus.innerHTML = '<span class="status-dot"></span> READY WHEN YOU ARE';
  successMessage.hidden = !completedLessons.includes(index);
  const nextButton = document.querySelector("#next-lesson-button");
  nextButton.hidden = index === lessons.length - 1;
  document.querySelector("#success-copy").textContent = completedLessons.includes(index)
    ? lessons[index].successText
    : lessons[index].successText;
  lastSuccessfulOutput = "";
  renderNavigation();
  updateLineNumbers();
  updateSuggestions();
  addWelcomeMessage();
}

function setOutput(lines, isError = false) {
  outputContent.replaceChildren();
  const results = lines.length ? lines : ["No output yet. Try a console.log() to see a result."];
  results.forEach(line => {
    const outputLine = document.createElement("div");
    outputLine.className = isError ? "output-line error" : "output-line";
    outputLine.textContent = line;
    outputContent.append(outputLine);
  });
}

function makeRunnerWorker(source) {
  const workerScript = `
    self.onmessage = ({ data: source }) => {
      const lines = [];
      const stringify = value => {
        if (typeof value === "string") return value;
        if (typeof value === "undefined") return "undefined";
        try { return JSON.stringify(value) ?? String(value); }
        catch { return String(value); }
      };
      self.console = { log: (...args) => lines.push(args.map(stringify).join(" ")) };
      try {
        new Function(source)();
        self.postMessage({ lines, error: null });
      } catch (error) {
        self.postMessage({ lines, error: error && error.message ? error.message : "Something went wrong." });
      }
    };
    self.postMessage({ ready: true });
  `;
  const url = URL.createObjectURL(new Blob([workerScript], { type: "text/javascript" }));
  return { worker: new Worker(url), url };
}

function runCode() {
  if (pendingWorker) pendingWorker.terminate();
  runButton.disabled = true;
  successMessage.hidden = true;
  runStatus.className = "run-status running";
  runStatus.innerHTML = '<span class="status-dot"></span> RUNNING YOUR CODE';
  outputContent.replaceChildren();
  const placeholder = document.createElement("span");
  placeholder.className = "output-placeholder";
  placeholder.textContent = "Giving it a go…";
  outputContent.append(placeholder);

  try {
    const { worker, url } = makeRunnerWorker();
    pendingWorker = worker;
    const timeout = window.setTimeout(() => {
      if (pendingWorker !== worker) return;
      worker.terminate();
      URL.revokeObjectURL(url);
      pendingWorker = null;
      runButton.disabled = false;
      setOutput(["This took a while. Check for a loop that never stops."], true);
      runStatus.className = "run-status error";
      runStatus.innerHTML = '<span class="status-dot"></span> TOOK TOO LONG';
    }, 1400);

    let hasStarted = false;
    worker.addEventListener("message", ({ data }) => {
      if (pendingWorker !== worker) return;
      if (data?.ready && !hasStarted) {
        hasStarted = true;
        URL.revokeObjectURL(url);
        worker.postMessage(editor.value);
        return;
      }
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      pendingWorker = null;
      runButton.disabled = false;
      setOutput(data.lines || [], Boolean(data.error));
      if (data.error) {
        const outputLine = document.createElement("div");
        outputLine.className = "output-line error";
        outputLine.textContent = `Error: ${data.error}`;
        outputContent.append(outputLine);
        runStatus.className = "run-status error";
        runStatus.innerHTML = '<span class="status-dot"></span> SOMETHING TO CHECK';
        return;
      }

      runStatus.className = "run-status success";
      runStatus.innerHTML = '<span class="status-dot"></span> YOUR CODE RAN';
      lastSuccessfulOutput = (data.lines || []).join("\n");
      if (lessons[activeLesson].success(lastSuccessfulOutput)) completeLesson();
    });

    worker.addEventListener("error", () => {
      if (pendingWorker !== worker) return;
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      pendingWorker = null;
      runButton.disabled = false;
      setOutput(["The code runner could not start. Try refreshing the page."], true);
      runStatus.className = "run-status error";
      runStatus.innerHTML = '<span class="status-dot"></span> RUNNER UNAVAILABLE';
    });

  } catch {
    pendingWorker = null;
    runButton.disabled = false;
    setOutput(["The code runner could not start. Try refreshing the page."], true);
    runStatus.className = "run-status error";
    runStatus.innerHTML = '<span class="status-dot"></span> RUNNER UNAVAILABLE';
  }
}

function completeLesson() {
  if (!completedLessons.includes(activeLesson)) {
    completedLessons.push(activeLesson);
    completedLessons.sort((first, second) => first - second);
    saveProgress();
    renderNavigation();
  }
  document.querySelector("#success-copy").textContent = lessons[activeLesson].successText;
  document.querySelector("#next-lesson-button").hidden = activeLesson === lessons.length - 1;
  successMessage.hidden = false;
}

function getTutorReply(message) {
  const question = message.toLowerCase();
  const lesson = lessons[activeLesson];

  if (question.includes("hint") || question.includes("help me") || question.includes("stuck")) {
    return activeLesson === 0
      ? 'Look for the name between the quotation marks. That is the part you can change! When you are ready, press "Run code" to see what happens.'
      : activeLesson === 1
        ? "Try changing just one of the numbers after the equals signs. Run the code again and watch how the total changes."
        : 'Try changing "Ada" inside `greet("Ada")`. The function will use whatever name you give it!';
  }

  const concept = Object.keys(lesson.explanations).find(key => question.includes(key))
    || (question.includes("error") || question.includes("fix") || question.includes("wrong") ? "debug" : null);

  if (concept && lesson.explanations[concept]) return lesson.explanations[concept];
  if (concept === "debug") {
    return runStatus.classList.contains("error")
      ? "Take a look at the red error in the output below your code. JavaScript often includes a line number to point you in the right direction. You can share the message here, too."
      : "One small check: make sure your quotation marks and parentheses come in matching pairs. If you paste the error you're seeing, we can look at it together.";
  }

  if (question.includes("what should") || question.includes("do next") || question.includes("next")) {
    return activeLesson < lessons.length - 1
      ? "Make a tiny change to the code, run it, and see what happens. When the little challenge turns green, the next lesson is just a click away."
      : "Try making up your own name to greet, or change the words your function returns. There is no wrong answer here!";
  }

  return `Good question. In this lesson, we are exploring ${lesson.title.replace(/\.$/, "").toLowerCase()}. Try asking me about ${lesson.prompts.map(prompt => prompt.replace(/^What (?:is|does) /, "").replace(/\?$/, "").toLowerCase()).slice(0, 2).join(" or ")}, or tell me what part feels confusing and we can unpack it together.`;
}

function askTutor(message) {
  const text = message.trim();
  if (!text) return;
  addBubble(text, "user");
  chatInput.value = "";
  chatInput.style.height = "auto";
  const typing = document.createElement("div");
  typing.className = "chat-bubble typing-indicator";
  typing.setAttribute("aria-label", "Your coding buddy is thinking");
  typing.innerHTML = "<span></span><span></span><span></span>";
  chatMessages.append(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  window.setTimeout(() => {
    typing.remove();
    addBubble(getTutorReply(text), "assistant", true);
  }, 320);
}

editor.addEventListener("input", updateLineNumbers);
editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });
editor.addEventListener("keydown", event => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.setRangeText("  ", start, end, "end");
    updateLineNumbers();
  }
});
runButton.addEventListener("click", runCode);
document.querySelector("#reset-button").addEventListener("click", () => {
  editor.value = lessons[activeLesson].code;
  updateLineNumbers();
  editor.focus();
});
document.querySelector("#next-lesson-button").addEventListener("click", () => {
  if (activeLesson < lessons.length - 1) selectLesson(activeLesson + 1);
});
document.querySelector("#chat-form").addEventListener("submit", event => {
  event.preventDefault();
  if (!chatInput.value.trim()) return;
  askTutor(chatInput.value);
});
document.querySelector("#clear-chat-button").addEventListener("click", addWelcomeMessage);
chatInput.addEventListener("input", () => {
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 100)}px`;
});

renderNavigation();
selectLesson(0);