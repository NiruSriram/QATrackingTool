import React, { useState } from 'react';

// import non-existant file
import Dummy from './non-existent';

// Initial State Structures
const initialTestCase = {
  id: '',            // Format: [Project]_[Feature]_[Number]
  title: '',
  description: '',
  relatedRequirements: '',
  priority: 'Medium',
  preconditions: '', // Including system state / App Version or Build
  build: '',         // Dedicated Build field (explicitly from Q2)
  testData: '',
  testSteps: '',
  expectedResult: '',
  actualResult: '',
  status: 'Pass'     // Pass, Fail, Blocked
};

const initialBug = {
  id: '',
  title: '',
  reporter: '',
  dateReported: '',
  assignedTo: '',
  description: '',
  testCaseId: '',    // Ties back to the Test Case (explicitly from Q3)
  status: 'New',      // New, Open, In Progress, Fixed, Verified, Regression Testing, Closed, Reopened
  severity: 'Medium',
  priority: 'Medium',
  operatingSystem: '',
  browser: '',
  device: '',
  appVersionBuild: '',
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  additionalNotes: ''
};

export default function App() {
  const [testCases, setTestCases] = useState([]);
  const [bugs, setBugs] = useState([]);
  
  // Forms state
  const [testCaseForm, setTestCaseForm] = useState(initialTestCase);
  const [bugForm, setBugForm] = useState(initialBug);

  // Quick Action: Mark status & trigger Bug creation if "Fail"
  const updateTestCaseStatus = (id, newStatus) => {
    setTestCases(prev => prev.map(tc => {
      if (tc.id === id) {
        const updated = { ...tc, status: newStatus };
        if (newStatus === 'Fail') {
          // Auto-populate bug form with linked Test Case ID and build info!
          setBugForm({
            ...initialBug,
            id: `BUG_${id}_${Date.now().toString().slice(-4)}`,
            testCaseId: id,
            appVersionBuild: tc.build,
            title: `[BUG] Derived from failed Test Case ${id}`,
            stepsToReproduce: `1. Run test case ${id}\n2. Observed outcome: ${tc.actualResult || "Execution failed."}`,
            expectedResult: tc.expectedResult,
            actualResult: tc.actualResult
          });
          // Scroll to or focus bug form to let the tester submit it
          alert(`Test Case ${id} marked as Failed! Bug form pre-populated below.`);
        }
        return updated;
      }
      return tc;
    }));
  };

  const handleAddTestCase = (e) => {
    e.preventDefault();
    setTestCases([...testCases, testCaseForm]);
    setTestCaseForm(initialTestCase);
  };

  const handleAddBug = (e) => {
    e.preventDefault();
    setBugs([...bugs, bugForm]);
    setBugForm(initialBug);
  };

  const updateBugStatus = (bugId, newStatus) => {
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>QA Test Case & Bug Tracker</h1>
      <hr />

      {/* Grid Layout to see side-by-side easily */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* ================= TEST CASES SECTION ================= */}
        <div>
          <h2>🧪 Test Cases</h2>
          <form onSubmit={handleAddTestCase} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Create Test Case</h3>
            <input type="text" placeholder="ID (e.g. PROJ_LOGIN_01)" required value={testCaseForm.id} onChange={e => setTestCaseForm({...testCaseForm, id: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Title" required value={testCaseForm.title} onChange={e => setTestCaseForm({...testCaseForm, title: e.target.value})} /><br/><br/>
            <input type="text" placeholder="App Version/Build" required value={testCaseForm.build} onChange={e => setTestCaseForm({...testCaseForm, build: e.target.value})} /><br/><br/>
            <textarea placeholder="Steps" value={testCaseForm.testSteps} onChange={e => setTestCaseForm({...testCaseForm, testSteps: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Expected Result" value={testCaseForm.expectedResult} onChange={e => setTestCaseForm({...testCaseForm, expectedResult: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Actual Result" value={testCaseForm.actualResult} onChange={e => setTestCaseForm({...testCaseForm, actualResult: e.target.value})} /><br/><br/>
            <button type="submit">Add Test Case</button>
          </form>

          {/* Test Case List */}
          {testCases.map(tc => (
            <div key={tc.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
              <h4>{tc.id}: {tc.title}</h4>
              <p><strong>Build:</strong> {tc.build} | <strong>Status:</strong> {tc.status}</p>
              <p><strong>Actual Result:</strong> {tc.actualResult || "N/A"}</p>
              <div>
                <button onClick={() => updateTestCaseStatus(tc.id, 'Pass')}>Pass</button>{' '}
                <button onClick={() => updateTestCaseStatus(tc.id, 'Fail')} style={{ backgroundColor: '#ffcccc' }}>Fail (Auto-Bug)</button>{' '}
                <button onClick={() => updateTestCaseStatus(tc.id, 'Blocked')}>Block</button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= BUGS SECTION ================= */}
        <div>
          <h2>🪲 Bugs Logged</h2>
          <form onSubmit={handleAddBug} style={{ background: '#fff0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Log a Bug</h3>
            <input type="text" placeholder="Bug ID" required value={bugForm.id} onChange={e => setBugForm({...bugForm, id: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Title" required value={bugForm.title} onChange={e => setBugForm({...bugForm, title: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Linked Test Case ID" value={bugForm.testCaseId} onChange={e => setBugForm({...bugForm, testCaseId: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Build" value={bugForm.appVersionBuild} onChange={e => setBugForm({...bugForm, appVersionBuild: e.target.value})} /><br/><br/>
            <textarea placeholder="Steps to Reproduce" value={bugForm.stepsToReproduce} onChange={e => setBugForm({...bugForm, stepsToReproduce: e.target.value})} /><br/><br/>
            
            <label>Severity: </label>
            <select value={bugForm.severity} onChange={e => setBugForm({...bugForm, severity: e.target.value})}>
              <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
            </select>{' '}
            <label>Priority: </label>
            <select value={bugForm.priority} onChange={e => setBugForm({...bugForm, priority: e.target.value})}>
              <option>Low</option><option>Medium</option><option>High</option>
            </select><br/><br/>

            <button type="submit" style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '8px 12px', cursor: 'pointer' }}>Log Bug</button>
          </form>

          {/* Bugs List */}
          {bugs.map(bug => (
            <div key={bug.id} style={{ border: '1px solid #ffb3b3', backgroundColor: '#fff9f9', padding: '10px', margin: '10px 0', borderRadius: '4px' }}>
              <h4>{bug.id}: {bug.title}</h4>
              <p style={{ color: '#d32f2f' }}><strong>Linked TC:</strong> {bug.testCaseId || "None"} | <strong>Build:</strong> {bug.appVersionBuild}</p>
              <p><strong>Severity:</strong> {bug.severity} | <strong>Priority:</strong> {bug.priority}</p>
              
              <label><strong>Status Lifecycle:</strong> </label>
              <select value={bug.status} onChange={e => updateBugStatus(bug.id, e.target.value)}>
                <option value="New">New (Unreviewed)</option>
                <option value="Open">Open (Accepted)</option>
                <option value="In progress">In Progress</option>
                <option value="Fixed">Fixed</option>
                <option value="Verified">Verified</option>
                <option value="Regression testing">Regression Testing</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}