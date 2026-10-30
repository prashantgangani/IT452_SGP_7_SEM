/**
 * useVideoCall — React hook for WebRTC + Socket.IO signaling
 * Roles:
 *   Initiator = first peer in room → call:peer-joined → creates SDP offer
 *   Receiver  = second peer        → call:peer-ready  → waits for offer
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://finsite-7l69.onrender.com' : 'http://localhost:5000');

const TURN_URL = import.meta.env.VITE_TURN_URL;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;

const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Optional TURN for tough NATs (recommended to set via env)
    ...(TURN_URL
      ? [
        {
          urls: TURN_URL,
          username: TURN_USERNAME,
          credential: TURN_CREDENTIAL,
        },
      ]
      : []),
  ],
  iceCandidatePoolSize: 4,
};

// Favor speech intelligibility: keep AGC/NS on and avoid aggressive VAD drops
const AUDIO_CONSTRAINTS = {
  channelCount: 1,
  sampleRate: 48000,
  sampleSize: 16,
  echoCancellation: { ideal: true },
  noiseSuppression: { ideal: true },
  autoGainControl: { ideal: true },
  voiceIsolation: true,
};

// Prefer Opus and tune it for continuous speech (no clipping on long words)
const enhanceOpusSdp = (sdp) => {
  const lines = sdp.split("\r\n");
  const opusLineIndex = lines.findIndex((l) =>
    /^a=rtpmap:(\d+) opus\/48000/i.test(l),
  );
  if (opusLineIndex === -1) return sdp;
  const opusPayload = lines[opusLineIndex].match(/^a=rtpmap:(\d+)/i)[1];

  const mLineIndex = lines.findIndex((l) => l.startsWith("m=audio"));
  if (mLineIndex !== -1) {
    const parts = lines[mLineIndex].split(" ");
    const header = parts.slice(0, 3);
    const codecs = parts.slice(3).filter(Boolean);
    const reordered = [opusPayload, ...codecs.filter((c) => c !== opusPayload)];
    lines[mLineIndex] = [...header, ...reordered].join(" ");
  }

  const fmtpParams =
    "stereo=0; sprop-stereo=0; maxaveragebitrate=96000; useinbandfec=1; usedtx=0; ptime=20";
  const fmtpIndex = lines.findIndex((l) =>
    l.startsWith(`a=fmtp:${opusPayload}`),
  );
  if (fmtpIndex !== -1) {
    lines[fmtpIndex] = `a=fmtp:${opusPayload} ${fmtpParams}`;
  } else {
    lines.splice(opusLineIndex + 1, 0, `a=fmtp:${opusPayload} ${fmtpParams}`);
  }

  if (!lines.some((l) => l.startsWith("a=ptime:"))) {
    lines.splice(opusLineIndex + 1, 0, "a=ptime:20");
  }

  return lines.join("\r\n");
};

export function useVideoCall({ dealId, roomToken, onEnded }) {
  const [status, setStatus] = useState("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState("idle");
  const [participantsCount, setParticipantsCount] = useState(1);
  const [adminInRoom, setAdminInRoom] = useState(false);
  const [remotePeers, setRemotePeers] = useState([]);

  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({}); // peerId -> { pc, stream, role, name }
  const iceBuffersRef = useRef({}); // peerId -> [candidates]
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // ── Teardown ──────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    Object.values(peersRef.current).forEach(({ pc }) => {
      try { pc?.close(); } catch {}
    });
    peersRef.current = {};
    iceBuffersRef.current = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setRemotePeers([]);
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Recording Upload ──────────────────────────────────────────────
  const uploadRecording = useCallback(
    async (blob) => {
      setRecordingStatus("uploading");
      const formData = new FormData();
      formData.append("recording", blob, "recording.webm");
      try {
        const res = await fetch(`${SOCKET_URL}/api/call/${dealId}/recording`, {
          method: "POST",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        setRecordingStatus("saved");
      } catch (err) {
        console.error("[useVideoCall] upload error", err);
        setRecordingStatus("error");
      }
    },
    [dealId],
  );

  // ── Manual Recording ──────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    if (mediaRecorderRef.current?.state === "recording") return;

    setRecordingStatus("recording");
    recordedChunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      uploadRecording(blob);
    };
    mr.start(1000);
    mediaRecorderRef.current = mr;
  }, [uploadRecording]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Hang Up ───────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    setStatus("ended");
    socketRef.current?.emit("call:leave");
    stopRecording();
    cleanup();
    onEnded?.();
  }, [cleanup, onEnded, stopRecording]);

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMuted((m) => !m);
  }, []);

  const toggleCam = useCallback(() => {
    if (!streamRef.current) return;
    streamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((c) => !c);
  }, []);

  // ── Main Effect ───────────────────────────────────────────────────
  useEffect(() => {
    if (!dealId || !roomToken) return;
    let destroyed = false;

    const start = async () => {
      try {
        setStatus("connecting");
        setErrorMsg(null);

        // 1. Camera + mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: AUDIO_CONSTRAINTS,
        });
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        console.log("[useVideoCall] local media secured");

        // 2. Socket.IO
        const socket = io(`${SOCKET_URL}/call`, {
          auth: { roomToken, userToken: localStorage.getItem("token") },
          transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        // ── Helper to create or retrieve peer connection ──
        const getOrCreatePeerConnection = (peerId, role, name) => {
          if (peersRef.current[peerId]?.pc) {
            return peersRef.current[peerId].pc;
          }

          const pc = new RTCPeerConnection(ICE_CONFIG);

          // Add local tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              pc.addTrack(track, streamRef.current);
            });
          }

          // Audio constraints & preferences
          try {
            const audioTransceiver = pc
              .getTransceivers()
              .find((t) => t.sender?.track?.kind === "audio");
            const audioCapabilities = RTCRtpSender.getCapabilities("audio");
            if (audioTransceiver?.setCodecPreferences && audioCapabilities?.codecs) {
              const opusFirst = [
                ...audioCapabilities.codecs.filter((c) => c.mimeType === "audio/opus"),
                ...audioCapabilities.codecs.filter((c) => c.mimeType !== "audio/opus"),
              ];
              if (opusFirst.length) audioTransceiver.setCodecPreferences(opusFirst);
            }
          } catch (e) {
            console.warn("[useVideoCall] codec setup warning", e);
          }

          pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              socket.emit("call:ice-candidate", { to: peerId, candidate });
            }
          };

          pc.ontrack = (e) => {
            const remoteStream = e.streams[0];
            peersRef.current[peerId] = {
              ...peersRef.current[peerId],
              stream: remoteStream,
              role: role || peersRef.current[peerId]?.role,
              name: name || peersRef.current[peerId]?.name,
            };

            setRemotePeers((prev) => {
              const filtered = prev.filter((p) => p.peerId !== peerId);
              return [
                ...filtered,
                {
                  peerId,
                  stream: remoteStream,
                  role: role || peersRef.current[peerId]?.role,
                  name: name || peersRef.current[peerId]?.name,
                },
              ];
            });

            if (remoteRef.current && (!remoteRef.current.srcObject || remoteRef.current.srcObject === remoteStream)) {
              remoteRef.current.srcObject = remoteStream;
            }
          };

          pc.onconnectionstatechange = () => {
            if (destroyed) return;
            const s = pc.connectionState;
            console.log(`[useVideoCall] Peer ${peerId} state:`, s);
            if (s === "connected") {
              setStatus("active");
            }
          };

          peersRef.current[peerId] = { pc, role, name, stream: null };
          return pc;
        };

        // ── Socket Event Listeners ─────────────────────────────────
        socket.on("connect_error", (err) => {
          if (!destroyed) {
            setStatus("error");
            setErrorMsg(err.message);
          }
        });

        socket.on("call:joined", ({ existingPeers = [] } = {}) => {
          if (destroyed) return;
          setStatus("ringing");
          if (existingPeers.length > 0) {
            setParticipantsCount(existingPeers.length + 1);
            existingPeers.forEach((p) => {
              if (p.role === "ADMIN") setAdminInRoom(true);
              getOrCreatePeerConnection(p.peerId, p.role, p.name);
            });
          }
        });

        socket.on("call:peer-joined", async (data) => {
          if (destroyed) return;
          const peerId = data.peerId || data.newPeerId;
          if (!peerId) return;
          if (data.role === "ADMIN") setAdminInRoom(true);
          setStatus("active");

          const pc = getOrCreatePeerConnection(peerId, data.role, data.name);
          try {
            const offer = await pc.createOffer({ iceRestart: true });
            offer.sdp = enhanceOpusSdp(offer.sdp || "");
            await pc.setLocalDescription(offer);
            socket.emit("call:offer", { to: peerId, offer });
          } catch (e) {
            console.error("[useVideoCall] Failed to create offer:", e);
          }
        });

        socket.on("call:offer", async ({ from, role, name, offer }) => {
          if (destroyed || !from || !offer) return;
          if (role === "ADMIN") setAdminInRoom(true);
          const pc = getOrCreatePeerConnection(from, role, name);
          try {
            const isPolite = (socket.id || "") < from;
            if (pc.signalingState === "have-local-offer") {
              if (!isPolite) {
                console.log("[useVideoCall] Glare detected; impolite peer waiting for answer from", from);
                return;
              }
              console.log("[useVideoCall] Glare detected; polite peer rolling back local offer for", from);
              await pc.setLocalDescription({ type: "rollback" });
            }

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Flush buffered ICE candidates for this peer
            if (iceBuffersRef.current[from]?.length) {
              for (const c of iceBuffersRef.current[from]) {
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (err) {}
              }
              iceBuffersRef.current[from] = [];
            }

            const answer = await pc.createAnswer();
            answer.sdp = enhanceOpusSdp(answer.sdp || "");
            await pc.setLocalDescription(answer);
            socket.emit("call:answer", { to: from, answer });
            setStatus("active");
          } catch (e) {
            console.error("[useVideoCall] Offer handling error:", e);
          }
        });

        socket.on("call:answer", async ({ from, answer }) => {
          if (destroyed || !from || !answer) return;
          const pc = peersRef.current[from]?.pc;
          if (pc && pc.signalingState === "have-local-offer") {
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              if (iceBuffersRef.current[from]?.length) {
                for (const c of iceBuffersRef.current[from]) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (err) {}
                }
                iceBuffersRef.current[from] = [];
              }
            } catch (e) {
              console.error("[useVideoCall] Answer handling error:", e);
            }
          }
        });

        socket.on("call:ice-candidate", async ({ from, candidate }) => {
          if (destroyed || !candidate) return;
          const targetPeerId = from || Object.keys(peersRef.current)[0];
          const pc = targetPeerId ? peersRef.current[targetPeerId]?.pc : null;

          if (pc && pc.remoteDescription) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.warn("[useVideoCall] ICE add error", e);
            }
          } else if (targetPeerId) {
            iceBuffersRef.current[targetPeerId] = iceBuffersRef.current[targetPeerId] || [];
            iceBuffersRef.current[targetPeerId].push(candidate);
          }
        });

        socket.on("call:participants-update", (data) => {
          if (!destroyed && data) {
            setParticipantsCount(data.count || 1);
            if (data.participants?.length >= 3) {
              setAdminInRoom(true);
            }
          }
        });

        socket.on("call:chat-message", (msg) => {
          if (!destroyed) {
            setMessages((p) => [...p, msg]);
            if (msg.senderRole === "ADMIN") {
              setAdminInRoom(true);
            }
          }
        });

        socket.on("call:peer-left", ({ peerId, role, remainingCount }) => {
          if (destroyed) return;
          if (peerId && peersRef.current[peerId]) {
            try { peersRef.current[peerId].pc?.close(); } catch {}
            delete peersRef.current[peerId];
            setRemotePeers((prev) => prev.filter((p) => p.peerId !== peerId));
          }
          if (role === "ADMIN") {
            setAdminInRoom(false);
          }
          if (remainingCount !== undefined) {
            setParticipantsCount(remainingCount);
            if (remainingCount === 0) hangUp();
          }
        });

        socket.on("call:error", ({ message }) => {
          if (destroyed) return;
          setStatus("error");
          setErrorMsg(message);
          cleanup();
        });

        // Join room
        socket.emit("call:join");
      } catch (err) {
        if (!destroyed) {
          setStatus("error");
          setErrorMsg(err.message || "Failed to start call.");
          cleanup();
        }
      }
    };

    start();

    return () => {
      destroyed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId, roomToken]);

  // ── Chat send ────────────────────────────────────────────────────
  const sendChatMessage = useCallback((text) => {
    if (!socketRef.current || !text?.trim()) return;
    socketRef.current.emit("call:chat-message", { text: text.trim() });
  }, []);

  return {
    localRef,
    remoteRef,
    remotePeers,
    remoteStreams: remotePeers,
    status,
    isMuted,
    isCamOff,
    toggleMute,
    toggleCam,
    hangUp,
    errorMsg,
    messages,
    sendChatMessage,
    recordingStatus,
    startRecording,
    stopRecording,
    participantsCount,
    adminInRoom,
  };
}
