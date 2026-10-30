import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initiateCall, endCall } from '../api/callApi';
import { useVideoCall } from '../components/useVideoCall';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  ArrowLeft, Loader2, AlertCircle, Users, Send,
  Disc, Square, Loader, CheckCircle, ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ─── Chat sub-component ──────────────────────────────────────────────────────
function ChatPanel({ messages, onSend }) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const submit = () => {
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="flex flex-col h-36 sm:h-44 mt-3 sm:mt-4 bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-2 border-b border-theme-border text-xs font-semibold text-theme-text-muted uppercase tracking-wider">
        In-call Chat
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-theme-text-muted text-xs mt-4 opacity-60">No messages yet…</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.own ? 'items-end' : 'items-start'}`}>
            {m.senderName && (
              <span className="text-[10px] text-theme-text-muted mb-0.5 px-1 font-medium">
                {m.own ? 'You' : m.senderName} {m.senderRole === 'ADMIN' ? '(Admin)' : ''}
              </span>
            )}
            <span
              className={`max-w-[75%] text-xs px-3 py-1.5 rounded-xl leading-relaxed break-words ${
                m.own
                  ? 'bg-violet-600 text-white rounded-br-none shadow-sm'
                  : m.senderRole === 'ADMIN'
                  ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 rounded-bl-none font-medium'
                  : 'bg-theme-surface-hover text-theme-text border border-theme-border rounded-bl-none'
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 px-3 py-2 border-t border-theme-border bg-theme-surface-hover/30">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Type a message to participants…"
          className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-3 py-1.5 text-sm text-theme-text placeholder:text-theme-text-muted outline-none focus:border-violet-500/50 transition-colors"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-white transition-all shrink-0 shadow-sm"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Remote Peer Tile ───────────────────────────────────────────────────────
function RemotePeerTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  const isAdmin = peer.role === 'ADMIN';

  return (
    <div className={`relative bg-slate-950 rounded-2xl overflow-hidden border ${isAdmin ? 'border-purple-500/50 shadow-purple-500/10' : 'border-theme-border'} aspect-video shadow-md flex items-center justify-center`}>
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      <span className={`absolute bottom-2 left-3 text-xs px-2.5 py-0.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5 ${isAdmin ? 'bg-purple-950/80 text-purple-200 border border-purple-500/30' : 'bg-black/60 text-white/90'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-purple-400' : 'bg-emerald-400'}`}></span>
        {isAdmin ? 'Platform Administrator' : (peer.name || (peer.role === 'LENDER' ? 'Lender' : 'MSME Partner'))}
      </span>
      {isAdmin && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
          Attestor
        </span>
      )}
    </div>
  );
}

// ─── Active Call Room ─────────────────────────────────────────────────────────
function CallRoom({ dealId, roomToken, onCallEnded, userRole }) {
  const {
    localRef, remoteRef, remotePeers = [], status, isMuted, isCamOff,
    toggleMute, toggleCam, hangUp, errorMsg,
    messages, sendChatMessage,
    recordingStatus, startRecording, stopRecording,
    participantsCount, adminInRoom,
  } = useVideoCall({ dealId, roomToken, onEnded: onCallEnded });

  const handleHangUp = async () => {
    try { await endCall(dealId); } catch { /* best-effort */ }
    hangUp();
  };

  const statusLabel = {
    idle: 'Idle', connecting: 'Connecting…', ringing: 'Waiting for other party…',
    active: 'Connected', ended: 'Call Ended', error: 'Error',
  }[status] ?? status;

  const statusColor = {
    active: 'text-emerald-400', connecting: 'text-amber-400',
    ringing: 'text-blue-400', error: 'text-rose-400',
  }[status] ?? 'text-white/40';

  const hasAdminPeer = remotePeers.some(p => p.role === 'ADMIN');
  const showAdminCard = userRole !== 'ADMIN' && adminInRoom && !hasAdminPeer;
  const totalTiles = (remotePeers.length || 1) + 1 + (showAdminCard ? 1 : 0);

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Status Bar */}
      <div className="flex items-center justify-between bg-theme-surface border border-theme-border rounded-xl px-4 py-2 shadow-sm">
        <div className={`flex items-center gap-2 text-sm font-semibold ${statusColor}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {statusLabel}

          {/* Recording badge */}
          {status === 'active' && recordingStatus === 'recording' && (
            <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-500 dark:text-rose-400 text-xs border border-rose-500/20 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> REC
            </span>
          )}
          {recordingStatus === 'uploading' && (
            <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-500 dark:text-blue-400 text-xs border border-blue-500/20">
              <Loader size={10} className="animate-spin" /> Uploading…
            </span>
          )}
          {recordingStatus === 'saved' && (
            <span className="ml-2 flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 text-xs border border-emerald-500/20">
              <CheckCircle size={10} /> Saved
            </span>
          )}

          {(adminInRoom || hasAdminPeer) && userRole !== 'ADMIN' && (
            <span className="ml-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
              <ShieldCheck size={11} /> Admin Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-theme-text-muted text-xs">
          <span className="flex items-center gap-1">
            <Users size={12} /> {participantsCount} in room
          </span>
          <span className="font-mono">#{dealId?.slice(0, 8)}…</span>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Video Grid */}
      <div className={`grid gap-3 flex-1 min-h-0 ${totalTiles >= 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Render all remote peers */}
        {remotePeers.length > 0 ? (
          remotePeers.map((peer) => (
            <RemotePeerTile key={peer.peerId} peer={peer} />
          ))
        ) : (
          <div className="relative bg-slate-950/60 rounded-2xl overflow-hidden border border-dashed border-theme-border aspect-video shadow-md flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
              <Users size={22} className="text-blue-400 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-theme-text">Waiting for counterparty to join…</p>
            <p className="text-xs text-theme-text-muted mt-1">Other party or administrator will appear once connected</p>
          </div>
        )}

        {/* Local Tile */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-theme-border aspect-video shadow-md flex items-center justify-center">
          <video ref={localRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          <span className="absolute bottom-2 left-3 text-xs text-white/80 bg-black/60 px-2 py-0.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
            {userRole === 'ADMIN' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> You (Admin Observer)
              </>
            ) : (
              'You'
            )}
          </span>
          {isMuted && (
            <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-rose-400 backdrop-blur-sm">
              <MicOff size={14} />
            </span>
          )}
        </div>

        {/* Admin Frame (displayed when Admin is active in room without active video stream) */}
        {showAdminCard && (
          <div className="relative bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-purple-500/40 aspect-video shadow-lg flex flex-col items-center justify-center p-4">
            <div className="relative flex items-center justify-center mb-2">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <ShieldCheck size={28} className="text-purple-400" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Platform Administrator</p>
              <p className="text-[11px] text-purple-300/80 mt-0.5">Live Compliance & Chat Active</p>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300 font-medium">
              Attestor
            </div>
            <span className="absolute bottom-2 left-3 text-xs text-white/90 bg-black/60 px-2.5 py-0.5 rounded-lg backdrop-blur-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Admin
            </span>
          </div>
        )}
      </div>

      {/* Chat */}
      <ChatPanel messages={messages} onSend={sendChatMessage} />

      {/* Controls */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 py-3 sm:py-4 mt-1 sm:mt-2 flex-wrap">
        {/* Recording buttons — only when active AND user is a LENDER */}
        {status === 'active' && userRole === 'LENDER' && (
          recordingStatus !== 'recording' ? (
            <button
              onClick={startRecording}
              title="Start Recording"
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors border border-white/10 shadow-lg"
            >
              <Disc size={20} className="text-rose-400" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              title="Stop Recording"
              className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-600 text-white hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20 "
            >
              <Square size={18} className="fill-current animate-pulse" />
            </button>
          )
        )}

        {/* Mute */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all shadow-lg active:scale-95 ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-800 text-white/90 hover:bg-slate-700 border border-white/10'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Camera */}
        <button
          onClick={toggleCam}
          title={isCamOff ? 'Turn on camera' : 'Turn off camera'}
          className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all shadow-lg active:scale-95 ${
            isCamOff
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800 text-white/90 hover:bg-slate-700 border border-white/10'
          }`}
        >
          {isCamOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>

        {/* End Call */}
        <button
          onClick={handleHangUp}
          title="End Call"
          className="flex items-center justify-center px-6 sm:px-8 h-12 sm:h-14 rounded-full bg-rose-600 hover:bg-rose-500 transition-all active:scale-95 text-white shadow-lg shadow-rose-500/30 border border-rose-500/50"
        >
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const { dealId } = useParams();
  const navigate    = useNavigate();
  const { user }    = useAuth();
  const [phase, setPhase]       = useState('pre');   // pre | call | ended
  const [roomToken, setRoomToken] = useState(null);
  const [joining, setJoining]   = useState(false);
  const [joinError, setJoinError] = useState('');

  const join = async () => {
    setJoining(true);
    setJoinError('');
    try {
      const res = await initiateCall(dealId);
      if (!res.success) throw new Error(res.message || 'Failed to initiate call.');
      setRoomToken(res.data.roomToken);
      setPhase('call');
    } catch (err) {
      setJoinError(err?.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setJoining(false);
    }
  };

  const handleCallEnded = () => {
    toast.success('Call ended');
    setPhase('ended');
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-theme-surface/90 backdrop-blur border-b border-theme-border shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-theme-text-muted hover:text-theme-text transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span className="text-sm font-semibold text-theme-text">
          Meeting Room <span className="font-mono text-theme-text-muted ml-1">#{dealId?.slice(0, 8)}…</span>
        </span>
        <div />
      </div>

      {/* Body */}
      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-4xl">
          {/* ── PRE CALL ── */}
          {phase === 'pre' && (
            <div className="flex flex-col items-center gap-8 mt-16">
              <div className="w-20 h-20 rounded-3xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <VideoIcon size={36} className="text-violet-500 dark:text-violet-400" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-theme-text mb-2">
                  {user?.role === 'ADMIN' ? 'Join Deal Meeting (Admin)' : 'Ready to Join?'}
                </h1>
                <p className="text-theme-text-muted text-sm max-w-sm">
                  {user?.role === 'ADMIN'
                    ? 'You are joining as Platform Administrator. You can participate in the call or communicate with the Lender & MSME via in-call chat.'
                    : 'Your camera and microphone will be activated when you join. Make sure you are in a well-lit, quiet space.'}
                </p>
              </div>
              {joinError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 dark:text-rose-400 text-sm max-w-sm w-full">
                  <AlertCircle size={16} /> {joinError}
                </div>
              )}
              <button
                onClick={join}
                disabled={joining}
                className="flex items-center gap-3 px-8 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 rounded-2xl text-white font-semibold transition-all shadow-xl shadow-violet-500/20 active:scale-95"
              >
                {joining ? <Loader2 size={20} className="animate-spin" /> : <VideoIcon size={20} />}
                {joining ? 'Joining…' : user?.role === 'ADMIN' ? 'Enter Meeting & Chat' : 'Join Video Call'}
              </button>
            </div>
          )}

          {/* ── ACTIVE CALL ── */}
          {phase === 'call' && roomToken && (
            <CallRoom dealId={dealId} roomToken={roomToken} onCallEnded={handleCallEnded} userRole={user?.role} />
          )}

          {/* ── ENDED ── */}
          {phase === 'ended' && (
            <div className="flex flex-col items-center gap-6 mt-24">
              <div className="w-20 h-20 rounded-3xl bg-theme-surface border border-theme-border flex items-center justify-center shadow-md">
                <PhoneOff size={36} className="text-theme-text-muted" />
              </div>
              <h1 className="text-2xl font-bold text-theme-text">Call Ended</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-2.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text rounded-xl text-sm font-medium transition-all border border-theme-border shadow-sm"
                >
                  Go Back
                </button>
                <button
                  onClick={() => { setPhase('pre'); setRoomToken(null); }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-violet-500/20"
                >
                  Rejoin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
