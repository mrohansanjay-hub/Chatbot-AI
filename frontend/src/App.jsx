import { useState, useEffect, useRef } from "react";
import {
  FaPaperclip,
  FaMicrophone,
  FaCamera,
  FaPaperPlane,
  FaFile,
  FaFileAudio,
  FaFileVideo,
  FaFileImage,
} from "react-icons/fa";

import ChatWindow from "./components/ChatWindow";
import PinDropdown from "./components/PinDropdown";
import MenuBar from "./components/MenuBar";

export default function App() {
  // ------------------ STATE ------------------
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [micBlink, setMicBlink] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const [showContact, setShowContact] = useState(false);
  const [feedbackType, setFeedbackType] = useState("Feedback");
  const [feedbackText, setFeedbackText] = useState("");

  // ------------------ REFS ------------------
  const bottomRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);

  // ------------------ CLOSE PIN DROPDOWN ------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".pin-container")) setPinOpen(false);
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // ------------------ HANDLE ACCOUNT ------------------
  const handleAccount = (user) => {
    if (!user) {
      setIsLoggedIn(false);
      setEmail("");
      setName("");
      localStorage.removeItem('user');
    } else {
      setIsLoggedIn(true);
      setEmail(user.email);
      setName(user.name || "");
      setShowLoginModal(false);  // Close modal on login

      // 🔐 store email in DB
      fetch("http://127.0.0.1:8000/auth/store-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
    }
  };

  // ------------------ HANDLE FILES SELECTED FROM DROPDOWN ------------------
  const handleFilesSelect = (files) => {
    // files may be an array of File objects
    if (!files || files.length === 0) return;
    setAttachedFiles((prev) => {
      // append new files, avoid duplicates by name+size
      const existingKeys = new Set(prev.map((f) => `${f.name}_${f.size}`));
      const toAdd = files.filter((f) => !existingKeys.has(`${f.name}_${f.size}`));
      const next = [...prev, ...toAdd];
      console.log("Attached files:", next);
      return next;
    });
    setPinOpen(false);  // Hide dropdown after attaching files
  };

  // ------------------ REMOVE SINGLE FILE ------------------
  const removeFile = (idx) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // ------------------ CHECK URL PARAM FOR LOGIN ------------------
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mail = params.get("email");
    const uname = params.get("name");
    if (mail) {
      const user = { email: mail, name: uname };
      handleAccount(user);
      localStorage.setItem('user', JSON.stringify(user));
      window.history.replaceState({}, document.title, "/");
    } else {
      // Check localStorage for persisted login
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        handleAccount(JSON.parse(savedUser));
      }
    }
  }, []);

  // ------------------ LOGIN MODAL ------------------
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser && !isLoggedIn && !showLoginModal) {
      // Delay to allow state to set
      setTimeout(() => setShowLoginModal(true), 100);
    } else if (isLoggedIn) {
      setShowLoginModal(false);
    }
  }, [isLoggedIn, showLoginModal]);

  const handleLoginClick = () => {
    window.location.href = "http://127.0.0.1:8000/auth/google/login";
  };

  // ------------------ MENU HANDLERS ------------------
  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "ChatbotAI", url });
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
  };

  const handleContact = () => setShowContact(true);

  // ------------------ SUBMIT FEEDBACK ------------------
  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      await fetch("http://127.0.0.1:8000/contact-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          type: feedbackType,
          message: feedbackText,
        }),
      });

      setFeedbackText("");
      setShowContact(false);
      alert("Thank you for your response!");
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

  // ------------------ HANDLE MESSAGE FEEDBACK ------------------
  const handleMessageFeedback = async (messageId, type) => {
    try {
      await fetch("http://127.0.0.1:8000/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: messageId,
          type,
          email,
        }),
      });
      alert(`${type} recorded!`);
    } catch {
      alert("Failed to record feedback");
    }
  };

  // ------------------ SEND MESSAGE ------------------
  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const newUserMsg = {
      id: Date.now(),
      role: "user",
      text: input.trim(),
      files: attachedFiles.map((f) => ({ name: f.name })),
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInput("");

    try {
      const uploadedFiles = [];

      for (const file of attachedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const endpoint =
          file.type.startsWith("audio/") ? "transcribe-audio" : "upload-file";

        const res = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        uploadedFiles.push({
          name: file.name,
          text: data.text || "[No text extracted]",
        });
      }

      let combined = input.trim();
      uploadedFiles.forEach((f) => {
        combined += `\n\n[File: ${f.name}]\n${f.text}`;
      });

      const conversation = [
        { role: "system", content: "You are a helpful AI assistant." },
        ...messages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: combined },
      ];

      setMessages([...updatedMessages, { id: Date.now(), role: "assistant", text: "" }]);

      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));
            if (data.chunk) {
              accumulated += data.chunk;
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1].text = accumulated;
                return msgs;
              });
            }
            if (data.final) {
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1].text = data.final;
                msgs[msgs.length - 1].image_url = data.image_url || null;
                msgs[msgs.length - 1].isComplete = true;
                return msgs;
              });
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1].text = "Error: Backend connection failed";
        return msgs;
      });
    }

    setAttachedFiles([]);
  };

  // ------------------ MICROPHONE ------------------
  const startMic = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onstart = () => {
      setRecording(true);
      setMicBlink(true);
    };
    recognition.onend = () => {
      setRecording(false);
      setMicBlink(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopMic = () => recognitionRef.current?.stop();

  // ------------------ CAMERA ------------------
  const handleCameraClick = async () => {
    setCameraOpen(true);
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  const handleCapture = () => {
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    setCapturedImage(canvas.toDataURL("image/png"));
    videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    setCameraOpen(false);
  };

  // ------------------ RENDER ------------------
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden">
      <MenuBar
        onShare={handleShare}
        onContact={handleContact}
        onLogin={handleAccount}
        isLoggedIn={isLoggedIn}
        email={email}
        name={name}
      />

      <div className="flex-1 flex justify-center overflow-hidden">
        <div className="w-full flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
          <ChatWindow messages={messages} bottomRef={bottomRef} onFeedback={handleMessageFeedback} />
        </div>
      </div>

      {/* CONTACT MODAL */}
      {showContact && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-96 max-w-sm mx-4">
            <h2 className="font-bold mb-3 text-xl text-gray-800">Contact Us</h2>

            <select
              className="w-full border p-2 mb-3 bg-white text-black rounded"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value)}
            >
              <option>Feedback</option>
              <option>Issue</option>
              <option>Suggestion</option>
            </select>

            <textarea
              className="w-full border p-2 h-28 bg-white text-black rounded placeholder-gray-400"
              placeholder="Type your message..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowContact(false)}
                className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={submitFeedback}
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ATTACHED FILES DISPLAY ABOVE FOOTER */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 border-t">
          {attachedFiles.map((f, idx) => (
            <div key={`${f.name}_${f.size}_${idx}`} className="px-2 py-1 bg-gray-100 rounded text-sm flex items-center gap-1">              {f.type.startsWith("image/") ? <FaFileImage size={14} /> :
               f.type.startsWith("video/") ? <FaFileVideo size={14} /> :
               f.type.startsWith("audio/") ? <FaFileAudio size={14} /> :
               <FaFile size={14} />}              {f.name}
              <button
                onClick={() => removeFile(idx)}
                className="text-red-600 hover:text-red-800"
              >
                {'\u00D7'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER */}
      <footer className="flex p-1 sm:p-2 bg-white border-t border-gray-200 items-center gap-1 sm:gap-2 rounded-b-lg">
        <div className="pin-container relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setPinOpen(!pinOpen);
            }}
            className="text-xl sm:text-2xl px-1 py-1 sm:px-2 sm:py-2 rounded hover:bg-gray-600"
          >
            <FaPaperclip />
          </button>
          {pinOpen && <PinDropdown onSelect={handleFilesSelect} />}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 p-1 sm:p-2 border rounded bg-white text-black placeholder-gray-500"
          placeholder="Type your prompt..."
        />

        <button
          onClick={recording ? stopMic : startMic}
          className={`px-2 py-1 sm:px-3 sm:py-2 rounded ${
            micBlink ? "bg-red-600 animate-pulse" : "bg-indigo-600"
          } text-white`}
        >
          <FaMicrophone />
        </button>

        <button
          onClick={handleCameraClick}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-green-600 text-white rounded"
        >
          <FaCamera />
        </button>

        <button
          onClick={sendMessage}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-indigo-700 text-white rounded"
        >
          <FaPaperPlane />
        </button>
      </footer>

      <canvas ref={canvasRef} className="hidden" />

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Welcome to ChatbotAI</h2>
            <p className="mb-6 text-gray-600">Please log in with Google to continue.</p>
            <button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition duration-300 shadow-lg"
            >
              Login with Google
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
