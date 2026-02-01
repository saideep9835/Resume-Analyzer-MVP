import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles, Target, TrendingUp, FileText, HelpCircle, Lightbulb } from 'lucide-react';

export default function ResumeAnalyzer() {
  const MAX_CHARACTERS = 8000;
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [modelMode, setModelMode] = useState('accurate');

  const analyzeResume = async () => {
    if (!resume.trim() || !jobDescription.trim()) {
      setError('Please fill in both resume and job description');
      return;
    }

    if (resume.length > MAX_CHARACTERS || jobDescription.length > MAX_CHARACTERS) {
      setError(`Please limit each field to ${MAX_CHARACTERS} characters or less`);
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);
    setActiveSection('overview');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume,
          jobDescription,
          mode: modelMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'API request failed');
      }

      setAnalysis(data.content);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      <Analytics />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6 md:p-8">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Resume Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            Resume <span className="text-yellow-300">Analyzer</span>
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Get instant, actionable insights to tailor your resume perfectly for any job
          </p>
        </div>

        {!analysis && (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="group">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-lg font-bold text-gray-800">
                    Your Resume
                  </label>
                </div>
                <textarea
                  value={resume}
                  onChange={(e) => setResume(e.target.value.slice(0, MAX_CHARACTERS))}
                  maxLength={MAX_CHARACTERS}
                  placeholder="Paste your resume content here..."
                  className="w-full h-72 p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 resize-none transition-all duration-200 text-gray-700"
                />
                <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {resume.length}/{MAX_CHARACTERS} characters
                </div>
              </div>
            </div>

            <div className="group">
              <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <label className="text-lg font-bold text-gray-800">
                    Job Description
                  </label>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value.slice(0, MAX_CHARACTERS))}
                  maxLength={MAX_CHARACTERS}
                  placeholder="Paste the job description here..."
                  className="w-full h-72 p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all duration-200 text-gray-700"
                />
                <div className="mt-3 text-sm text-gray-500 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  {jobDescription.length}/{MAX_CHARACTERS} characters
                </div>
              </div>
            </div>
          </div>
        )}

        {!analysis && (
          <div className="text-center mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="text-white/90 text-sm font-semibold">Model Mode:</span>
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setModelMode('fast')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    modelMode === 'fast'
                      ? 'bg-white text-purple-700 shadow'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Fast
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode('accurate')}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                    modelMode === 'accurate'
                      ? 'bg-white text-purple-700 shadow'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Accurate
                </button>
              </div>
              <span className="text-white/70 text-xs">
                Fast uses lower cost model, Accurate uses higher quality model
              </span>
            </div>
            <button
              onClick={analyzeResume}
              disabled={loading}
              className="group relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold px-12 py-4 rounded-full transition-all duration-300 flex items-center gap-3 mx-auto shadow-2xl hover:shadow-3xl hover:scale-105 disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Analyzing your resume...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  <span className="text-lg">Analyze Resume</span>
                  <TrendingUp className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-purple-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
              </div>
              <div className="space-y-2">
                <p className="text-xl font-semibold text-gray-800">Analyzing your resume...</p>
                <p className="text-gray-600">Our AI is comparing your experience with the job requirements</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/90 backdrop-blur-lg border-2 border-red-300 rounded-2xl p-6 mb-6 flex items-start gap-4 shadow-xl animate-shake">
            <XCircle className="w-6 h-6 text-white flex-shrink-0 mt-1" />
            <div>
              <p className="text-white font-semibold text-lg">Oops! Something went wrong</p>
              <p className="text-red-100">{error}</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-2 flex gap-2">
              <button
                onClick={() => setActiveSection('overview')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeSection === 'overview'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📊 Overview & Skills
              </button>
              <button
                onClick={() => setActiveSection('suggestions')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeSection === 'suggestions'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                ✨ Suggestions
              </button>
              <button
                onClick={() => setActiveSection('interview')}
                className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  activeSection === 'interview'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                🎤 Interview Prep
              </button>
            </div>

            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                    Overall Match Score
                  </h2>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="text-7xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {analysis.overallMatch}%
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-6 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                          style={{ width: `${analysis.overallMatch}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                        </div>
                      </div>
                      <p className="text-gray-600 mt-3 text-sm">
                        {analysis.overallMatch >= 80 ? '🎉 Excellent match!' : 
                         analysis.overallMatch >= 60 ? '👍 Good match with room for improvement' :
                         '💡 Several improvements needed'}
                      </p>
                    </div>
                  </div>
                </div>

                {analysis.requiredSkills && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      Required Skills Analysis
                    </h2>
                    
                    {analysis.requiredSkills.missing?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-red-600">⚠️</span> Critical Missing Skills (Required)
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {analysis.requiredSkills.missing.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow-md"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <p className="text-sm text-red-700 mt-3 italic">
                          These are must-have requirements from the job description
                        </p>
                      </div>
                    )}

                    {analysis.requiredSkills.present?.length > 0 && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-green-600">✓</span> Required Skills You Have
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          {analysis.requiredSkills.present.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-900 rounded-full text-sm font-semibold shadow-md border-2 border-green-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {analysis.preferredSkills?.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <Lightbulb className="w-6 h-6 text-white" />
                      </div>
                      Preferred Skills (Optional)
                    </h2>
                    <p className="text-gray-600 mb-6">
                      These skills are nice-to-have. Consider adding them if you have relevant experience.
                    </p>
                    <div className="space-y-4">
                      {analysis.preferredSkills.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-5 rounded-xl border-2 ${
                            item.inResume 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-blue-50 border-blue-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {item.inResume ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <span className="text-2xl">💡</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-bold text-gray-900 text-lg">{item.skill}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  item.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.priority} priority
                                </span>
                                {item.inResume && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                    Already in resume
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-700 text-sm">
                                <span className="font-semibold">Benefit:</span> {item.benefit}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.atsKeywords && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      ATS Keyword Optimization
                    </h2>
                    
                    {analysis.atsKeywords.mustHave?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                          <span className="text-red-600">★</span> Critical Keywords (Must Include)
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.atsKeywords.mustHave.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm font-semibold shadow-md"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.atsKeywords.replaceWith?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">🔄 Replace Generic Terms</h3>
                        <div className="space-y-3">
                          {analysis.atsKeywords.replaceWith.map((item, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm line-through">
                                  {item.current}
                                </span>
                                <span className="text-gray-400">→</span>
                                <span className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-semibold">
                                  {item.better}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.atsKeywords.exactPhrases?.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-bold text-gray-800 mb-3">📋 Exact Phrases to Mirror</h3>
                        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                          <ul className="space-y-2">
                            {analysis.atsKeywords.exactPhrases.map((phrase, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-yellow-600 font-bold">•</span>
                                <span className="text-gray-800 font-mono text-sm bg-white px-2 py-1 rounded">
                                  "{phrase}"
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-600 mt-3 italic">
                            Use these exact phrases from the job description for maximum ATS compatibility
                          </p>
                        </div>
                      </div>
                    )}

                    {analysis.atsKeywords.actionVerbs?.length > 0 && (
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3">⚡ Powerful Action Verbs from JD</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.atsKeywords.actionVerbs.map((verb, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg text-sm font-semibold shadow-md hover:scale-105 transition-transform"
                            >
                              {verb}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-600 mt-3 italic">
                          Start your bullet points with these verbs to match the job's tone
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'suggestions' && (
              <div className="space-y-6">
                {analysis.pointsToAdd?.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      Suggested Points to Add
                    </h2>
                    <div className="space-y-4">
                      {analysis.pointsToAdd.map((point, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-r-xl shadow-md hover:shadow-lg transition-all duration-200 hover:translate-x-1"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                              point.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' :
                              point.priority === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
                              'bg-gradient-to-r from-blue-400 to-indigo-400 text-white'
                            }`}>
                              {point.priority?.toUpperCase()} PRIORITY
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 mb-3 text-lg">
                            ✨ {point.suggestion}
                          </p>
                          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-green-700">💡 Why this helps:</span> {point.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.pointsToRemove?.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      Points to Remove or Deprioritize
                    </h2>
                    <div className="space-y-4">
                      {analysis.pointsToRemove.map((point, idx) => (
                        <div
                          key={idx}
                          className="border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-r-xl shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <p className="font-bold text-gray-900 mb-3 text-lg">
                            ❌ "{point.content}"
                          </p>
                          <div className="bg-white/60 backdrop-blur-sm p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-red-700">⚠️ Why remove:</span> {point.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.keyInsights?.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      Key Insights
                    </h2>
                    <ul className="space-y-4">
                      {analysis.keyInsights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl shadow-sm">
                          <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold shadow-md">
                            {idx + 1}
                          </span>
                          <span className="text-gray-800 font-medium">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'interview' && (
              <div className="space-y-6">
                {analysis.interviewQuestions?.length > 0 && (
                  <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                        <HelpCircle className="w-6 h-6 text-white" />
                      </div>
                      Interview Preparation ({analysis.interviewQuestions.length} Questions)
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Based on your resume and the job description, here are likely interview questions with sample answers.
                    </p>
                    <div className="space-y-6">
                      {analysis.interviewQuestions.map((item, idx) => (
                        <div
                          key={idx}
                          className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
                        >
                          <div className="flex items-start gap-4 mb-4">
                            <span className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                              {idx + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  item.type === 'technical' ? 'bg-blue-100 text-blue-800' :
                                  item.type === 'behavioral' ? 'bg-green-100 text-green-800' :
                                  'bg-orange-100 text-orange-800'
                                }`}>
                                  {item.type?.toUpperCase()}
                                </span>
                              </div>
                              <p className="font-bold text-gray-900 text-xl mb-3">
                                "{item.question}"
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg mb-4">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold text-yellow-800">💡 Why they'll ask this:</span> {item.reason}
                            </p>
                          </div>
                          
                          <div className="bg-white rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-lg">🗣️</span>
                              <p className="font-bold text-purple-700">Sample Answer:</p>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-l-4 border-purple-400">
                              <p className="text-gray-800 leading-relaxed italic">
                                "{item.sampleAnswer}"
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-center pt-6">
              <button
                onClick={() => setAnalysis(null)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold px-8 py-3 rounded-full transition-all duration-200"
              >
                ← Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}