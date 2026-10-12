from flask import Flask, Response, jsonify, render_template, request
from rag import ask_stream

app = Flask(__name__)

@app.route("/", methods=["GET"])
def get_index():
    return render_template("index.html")

@app.route("/ask", methods=["POST"])
def ask_question():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Request body must be valid."}), 400
    if not data.get("conversation"):
        return jsonify({"message": "Invalid message."}), 400
    
    sent_conversation = data["conversation"]
    def generate():
        for chunk in ask_stream(sent_conversation):
            yield f"data: {chunk}\n\n"
    return Response(
        generate(),
        mimetype="text/event-steam"
    )
    # updated_conversation = ask(sent_conversation)
    # return jsonify({
    #     "data": {
    #         "conversation": updated_conversation
    #     }
    #     }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)