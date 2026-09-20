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

    chat.innerHTML = `
        <div class="user-message">${escapeHtml(question)}</div>
        <div class="assistant-message" id="answer"></div>
    `;

    const answerElement = document.getElementById("answer");

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
        let answer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            answer += decoder.decode(value);
            answerElement.textContent = answer;
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

function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
