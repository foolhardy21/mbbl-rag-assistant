const questionInput = document.getElementById("question");
const sendButton = document.getElementById("send");
const chat = document.getElementById("chat");
const infoBtn = document.getElementById("info-btn");
const infoModal = document.getElementById("info-modal");

let conversation = [];

infoBtn.addEventListener("click", () => infoModal.showModal());
infoModal.addEventListener("click", (event) => {
    if (event.target === infoModal) infoModal.close();
});

sendButton.addEventListener("click", sendMessage);
questionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const question = questionInput.value.trim();
    if (!question || sendButton.disabled) {
        return;
    }

    questionInput.value = "";
    sendButton.disabled = true;

    conversation.push({
        role: "user",
        content: question,
    });

    chat.innerHTML = `<div class="user-message">${escapeHtml(question)}</div><div class="assistant-message" id="answer"><div class="page-list" id="page-list"></div><div class="answer-text" id="answer-text"></div></div>`;

    const answerElement = document.getElementById("answer");
    const pageList = document.getElementById("page-list");
    const answerText = document.getElementById("answer-text");

    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                conversation: conversation,
            }),
        });

        if (!response.ok) {
            throw new Error("Request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        const pages = [];
        let buffer = "";
        let mode = "sources";
        let answer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (value) {
                buffer += decoder.decode(value, { stream: true });
            }
            if (done) {
                buffer += decoder.decode();
            }
            const sources = takeSources(buffer, pages, mode, pageList);
            buffer = sources.buffer;
            mode = sources.mode;
            if (mode === "answer") {
                const drained = takeAnswer(buffer, done);
                buffer = drained.buffer;
                answer += drained.text;
                answerText.textContent = answer;
            }
            if (done) {
                break;
            }
        }

        conversation.push({
            role: "assistant",
            content: answer,
        });
    } catch (error) {
        answerElement.textContent = "Something went wrong. Try again.";
        conversation.pop();
    } finally {
        sendButton.disabled = false;
        questionInput.focus();
    }
}

// Source events look like: data: {'page': 98, 'source': 'mbbl_2016'}
// or data: data: {'source': 'mbbl_2016', 'page': 98}
// Everything after those events is the answer.
const sourcePattern = /^\s*(?:data:\s*)+\{[^{}]*['"]page['"]\s*:\s*(\d+)[^{}]*\}/;

function takeSources(buffer, pages, mode, pageList) {
    while (mode === "sources") {
        const match = buffer.match(sourcePattern);
        if (match) {
            notePage(pages, Number(match[1]), pageList);
            buffer = buffer.slice(match[0].length);
            continue;
        }
        if (isPartialSource(buffer)) {
            break;
        }
        buffer = buffer.replace(/^\n+/, "");
        mode = "answer";
    }
    return { buffer, mode };
}

function isPartialSource(buffer) {
    const text = buffer.trim();
    if (text === "") {
        return buffer.length > 0;
    }
    const rest = text.replace(/^(?:data:\s*)+/, "");
    if (rest !== text) {
        return rest === "" || (rest.startsWith("{") && !rest.includes("}"));
    }
    return "data:".startsWith(text) || "data: data:".startsWith(text);
}

function notePage(pages, page, pageList) {
    if (pages.includes(page)) {
        return;
    }
    pages.push(page);
    const chip = document.createElement("span");
    chip.className = "page-chip";
    chip.textContent = `page ${page}`;
    pageList.appendChild(chip);
}

function takeAnswer(buffer, done) {
    if (!isSseAnswer(buffer)) {
        if (!done && couldBeSse(buffer)) {
            return { buffer, text: "" };
        }
        return { buffer: "", text: buffer };
    }

    let text = "";
    while (true) {
        const splitAt = buffer.indexOf("\n\n");
        if (splitAt === -1) {
            break;
        }
        text += eventText(buffer.slice(0, splitAt));
        buffer = buffer.slice(splitAt + 2);
    }
    if (done && buffer) {
        text += eventText(buffer);
        buffer = "";
    }
    return { buffer, text };
}

function isSseAnswer(buffer) {
    const text = buffer.trimStart();
    return text.startsWith("data:") || buffer.includes("\ndata:");
}

function couldBeSse(buffer) {
    const text = buffer.trimStart();
    return text === "" || "data:".startsWith(text);
}

function eventText(event) {
    if (!event.includes("data:")) {
        return event;
    }
    return event.split("\n").map((line) => {
        if (!line.startsWith("data:")) {
            return line;
        }
        const rest = line.slice("data:".length);
        return rest.startsWith(" ") ? rest.slice(1) : rest;
    }).join("\n");
}

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
