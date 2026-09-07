import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import './Onboarding.css';

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [replyLength, setReplyLength] = useState('10-40');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [demoStatus, setDemoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [demoResults, setDemoResults] = useState<any[]>([]);
  
  const handleKeywordAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && keywordInput.trim()) {
      if (keywords.length < 2) {
        setKeywords([...keywords, keywordInput.trim()]);
        setKeywordInput('');
      }
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const runDemo = async () => {
    setStep(3);
    setDemoStatus('loading');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const API_URL = import.meta.env.VITE_API_URL || 'https://gbp-auto-master-backend-us.onrender.com';
      
      // Simulate demo processing for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDemoResults([
        { reviewer: "Amit Verma", rating: 5, reply: `Thank you for the 5 stars, Amit! We've made sure to focus on ${keywords[0] || 'our service'} to give you the best experience.` },
        { reviewer: "Priya Sharma", rating: 4, reply: `Thanks Priya! Your feedback helps us improve our ${keywords[1] || 'offerings'} for all our customers.` }
      ]);
      setDemoStatus('success');
      
      // Save onboarding data to actual database
      await fetch(`${API_URL}/api/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ 
          user_id: session?.user?.id, 
          reply_length: replyLength, 
          seo_keywords: keywords 
        })
      });
      
      setTimeout(() => setStep(4), 1500);
    } catch (error) {
      console.error(error);
      setDemoStatus('error');
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}></div>
        </div>

        {step === 1 && (
          <div className="step-content fade-in">
            <h2>Welcome! Let's get started.</h2>
            <p>How long should AI replies be?</p>
            <div className="radio-group">
              {['10-40', '50-90', '100-120'].map((length) => (
                <label key={length} className={`radio-option ${replyLength === length ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="replyLength"
                    value={length}
                    checked={replyLength === length}
                    onChange={(e) => setReplyLength(e.target.value)}
                  />
                  <span>{length} words</span>
                </label>
              ))}
            </div>
            <button className="primary-btn" onClick={() => setStep(2)}>Next Step</button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ marginBottom: '8px' }}>Boost your SEO</h2>
              <p>Add the SEO keywords you want to rank for.</p>
            </div>
            
            <div className="plan-badge" style={{ marginBottom: '12px' }}>Free Plan: Max 2 keywords</div>
            
            <div className="keyword-input-wrapper">
              <input
                type="text"
                placeholder="Press Enter to add keyword..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordAdd}
                disabled={keywords.length >= 2}
                className="keyword-input"
              />
            </div>
            
            <div className="chips-container">
              {keywords.map((kw, idx) => (
                <span key={idx} className="chip">
                  {kw}
                  <button onClick={() => removeKeyword(idx)} className="chip-remove">&times;</button>
                </span>
              ))}
            </div>
            
            <div className="btn-group">
              <button className="secondary-btn" onClick={() => setStep(1)}>Back</button>
              <button className="primary-btn" onClick={runDemo}>Run Live Demo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content fade-in text-center">
            <h2>Live Demo</h2>
            <p>We are connecting to your Google Business Profile...</p>
            
            <div className="demo-status">
              {demoStatus === 'loading' && (
                <div className="loader">
                  <div className="spinner"></div>
                  <p>Replying to 2 live reviews automatically...</p>
                </div>
              )}
              {demoStatus === 'success' && (
                <div className="success-icon">&#10003; Success!</div>
              )}
              {demoStatus === 'error' && (
                <div className="error-message">
                  Something went wrong. <button onClick={runDemo} className="retry-btn">Retry</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="step-content fade-in success-step">
            <div className="confetti-icon">&#127881;</div>
            <h2>You're all set!</h2>
            <p className="tokens-msg">You've been given <strong>60 free tokens!</strong></p>
            
            <div className="demo-results">
              <h3>Demo Results:</h3>
              {demoResults.map((res, idx) => (
                <div key={idx} className="result-card">
                  <div className="reviewer">{res.reviewer}</div>
                  <div className="reply-text">{res.reply}</div>
                </div>
              ))}
            </div>

            <button className="primary-btn pulse" onClick={() => {
              window.history.pushState(null, '', '/dashboard-v2');
              const navEvent = new PopStateEvent('popstate');
              window.dispatchEvent(navEvent);
            }}>
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
