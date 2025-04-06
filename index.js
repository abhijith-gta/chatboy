import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

const Chat = () => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [username, setUsername] = useState("Stranger" + Math.floor(Math.random() * 1000));

  useEffect(() => {
    socket.on("matched", ({ roomId }) => {
      setRoomId(roomId);
      setChat([]);
    });

    socket.on("message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("typing", (user) => {
      setTypingUser(user);
      setTimeout(() => setTypingUser(""), 2000);
    });

    return () => {
      socket.off("matched");
      socket.off("message");
      socket.off("typing");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "" || !roomId) return;
    socket.emit("message", { roomId, user: username, text: message });
    setMessage("");
  };

  const handleTyping = () => {
    if (roomId) {
      socket.emit("typing", { roomId, user: username });
    }
  };

  const handleNextChat = () => {
    socket.emit("next");
    setChat([]);
    setRoomId(null);
  };

  return (
    <div style={styles.container}>
      <h2>Chat Boy - Stranger Chat</h2>

      {!roomId && <p>Waiting for a stranger to connect...</p>}

      <div style={styles.chatBox}>
        {chat.map((msg, index) => (
          <p key={index}><strong>{msg.user}: </strong>{msg.text}</p>
        ))}
        {typingUser && <p><em>{typingUser} is typing...</em></p>}
      </div>

      <div style={styles.inputArea}>
        <input
          type="text"
          placeholder="Say something..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTyping}
          style={styles.input}
          disabled={!roomId}
        />
        <button onClick={sendMessage} style={styles.button} disabled={!roomId}>Send</button>
      </div>

      {roomId && (
        <button onClick={handleNextChat} style={{ ...styles.button, backgroundColor: "#ff4d4d", marginTop: 10 }}>
          Next Chat
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 500,
    margin: "50px auto",
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 10,
    backgroundColor: "#f9f9f9"
  },
  chatBox: {
    height: 300,
    overflowY: "auto",
    border: "1px solid #ccc",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff"
  },
  inputArea: {
    display: "flex",
    gap: 10
  },
  input: {
    flex: 1,
    padding: 10,
    fontSize: 16
  },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    cursor: "pointer"
  }
};

export default Chat;