import { useState } from 'react';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import WeightPage from './pages/WeightPage';
import ResultPage from './pages/ResultPage';
import ArchivePage from './pages/ArchivePage';

export default function App() {
  const [page, setPage] = useState('home');
  const [sessionData, setSessionData] = useState({
    userInput: '',
    intentData: null,
    chatHistory: [],
    weightData: null,
    userWeights: null,
    birthday: '',
    fateText: '',
  });

  const update = (patch) => setSessionData(prev => ({ ...prev, ...patch }));

  return (
    <div style={{ minHeight: '100vh', position: 'relative', color: '#E8E0FF', overflow: 'hidden' }}>
      {/* 背景视频 */}
      <video
        autoPlay loop muted playsInline
        ref={el => { if (el) el.playbackRate = 0.4; }}
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: -1 }}
      >
        <source src="/bg.webm" type="video/webm" />
      </video>
      {/* 磨砂遮罩 */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(5, 4, 15, 0.72)', backdropFilter: 'blur(4px)', zIndex: -1 }} />
      {page === 'home' && (
        <HomePage onStart={(input, intentData) => {
          update({ userInput: input, intentData });
          setPage('chat');
        }} onArchive={() => setPage('archive')} />
      )}
      {page === 'chat' && (
        <ChatPage
          sessionData={sessionData}
          onUpdate={update}
          onNext={(chatHistory) => {
            update({ chatHistory });
            setPage('weight');
          }}
        />
      )}
      {page === 'weight' && (
        <WeightPage
          sessionData={sessionData}
          onUpdate={update}
          onNext={(weightData, userWeights) => {
            update({ weightData, userWeights });
            setPage('result');
          }}
        />
      )}
      {page === 'archive' && (
        <ArchivePage onBack={() => setPage('home')} />
      )}
      {page === 'result' && (
        <ResultPage
          sessionData={sessionData}
          onRestart={() => {
            setSessionData({ userInput:'', intentData:null, chatHistory:[], weightData:null, userWeights:null, birthday:'', fateText:'' });
            setPage('home');
          }}
        />
      )}
    </div>
  );
}
