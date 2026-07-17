import React, { useState } from 'react';

// Initial State Structures
const initialTestCase = {
  id: '',            // Format: [Project]_[Feature]_[Number]
  title: '',
  description: '',
  relatedRequirements: '',
  priority: 'Medium', 
  preconditions: '', 
  build: '',         
  testData: '',      
  testSteps: '',
  expectedResult: '',
  actualResult: '',  
  status: 'Not Executed' 
};

const initialBug = {
  id: '',
  title: '',
  reporter: '',
  dateReported: '',
  assignedTo: '',
  description: '',
  testCaseId: '',    
  status: 'New',      
  severity: 'Medium',
  priority: 'Medium',
  operatingSystem: '',
  browser: '',
  device: '',
  appVersionBuild: '',
  environmentConditions: '', 
  stepsToReproduce: '',
  expectedResult: '',
  actualResult: '',
  attachments: null,         // Updated to store an object: { name, type, dataUrl }
  additionalNotes: ''        
};

export default function App() {
  const [testCases, setTestCases] = useState([]);
  const [bugs, setBugs] = useState([]);
  
  // Track which test cases are expanded (using an object map of ID -> boolean)
  const [expandedTestCases, setExpandedTestCases] = useState({});

  // Forms state
  const [testCaseForm, setTestCaseForm] = useState(initialTestCase);
  const [bugForm, setBugForm] = useState(initialBug);

  const toggleExpand = (id) => {
    setExpandedTestCases(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
            description: `Automatic failure ticket spawned from Test Case validation tracking for ID ${id}.`,
            stepsToReproduce: `1. Run test case ${id}\n2. Observed outcome: ${tc.actualResult || "Execution failed."}`,
            expectedResult: tc.expectedResult,
            actualResult: tc.actualResult
          });
          alert(`Test Case ${id} marked as Failed! Bug form pre-populated below.`);
        }
        return updated;
      }
      return tc;
    }));
  };

  const updateTestCaseActualResult = (id, val) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, actualResult: val } : tc));
  };

  const handleAddTestCase = (e) => {
    e.preventDefault();

    // 1. Check for Duplicate Test Case ID
    const idExists = testCases.some(tc => tc.id.trim().toLowerCase() === testCaseForm.id.trim().toLowerCase());
    if (idExists) {
      alert(`Validation Error: A test case with ID "${testCaseForm.id}" already exists. Test IDs must be unique.`);
      return;
    }

    // 2. Validate Test Steps field is not blank
    if (!testCaseForm.testSteps || testCaseForm.testSteps.trim() === '') {
      alert('Validation Error: The "Test Steps" field cannot be left blank.');
      return;
    }

    // 3. Validate Expected Result field is not blank
    if (!testCaseForm.expectedResult || testCaseForm.expectedResult.trim() === '') {
      alert('Validation Error: The "Expected Result" field cannot be left blank.');
      return;
    }

    // If all validations pass, save the test case
    setTestCases([...testCases, testCaseForm]);
    setTestCaseForm(initialTestCase);
  };

  const handleAddBug = (e) => {
    e.preventDefault();

    // Check for Duplicate Bug ID before saving
    const bugIdExists = bugs.some(b => b.id.trim().toLowerCase() === bugForm.id.trim().toLowerCase());
    if (bugIdExists) {
      alert(`Validation Error: A bug report with ID "${bugForm.id}" already exists. Bug IDs must be unique.`);
      return;
    }

    setBugs([...bugs, bugForm]);
    setBugForm(initialBug);
    
    // Reset file input element manually
    const fileInput = document.getElementById('bug-file-upload');
    if (fileInput) fileInput.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setBugForm(prev => ({ ...prev, attachments: null }));
      return;
    }

    // Enforce file extension / MIME filters
    const validTypes = ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      alert('Validation Error: Only PNG, JPG, PDF, or TXT file attachments are supported.');
      e.target.value = ''; // Reset input element
      return;
    }

    // Ingest data stream to base64 for persistent client memory tracking
    const reader = new FileReader();
    reader.onloadend = () => {
      setBugForm(prev => ({
        ...prev,
        attachments: {
          name: file.name,
          type: file.type,
          dataUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const updateBugStatus = (bugId, newStatus) => {
    setBugs(prev => prev.map(b => b.id === bugId ? { ...b, status: newStatus } : b));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>QA Test Case & Bug Tracker</h1>
      <hr />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* ================= TEST CASES SECTION ================= */}
        <div>
          <h2>🧪 Test Cases</h2>
          <form onSubmit={handleAddTestCase} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Create Test Case</h3>
            <input type="text" placeholder="ID (e.g. PROJ_LOGIN_01)" required value={testCaseForm.id} onChange={e => setTestCaseForm({...testCaseForm, id: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Title" required value={testCaseForm.title} onChange={e => setTestCaseForm({...testCaseForm, title: e.target.value})} /><br/><br/>
            <input type="text" placeholder="App Version/Build" required value={testCaseForm.build} onChange={e => setTestCaseForm({...testCaseForm, build: e.target.value})} /><br/><br/>
            
            <label>Priority: </label>
            <select value={testCaseForm.priority} onChange={e => setTestCaseForm({...testCaseForm, priority: e.target.value})}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select><br/><br/>

            <textarea placeholder="Preconditions (System state / Setup)" value={testCaseForm.preconditions} onChange={e => setTestCaseForm({...testCaseForm, preconditions: e.target.value})} style={{ width: '100%', height: '50px' }} /><br/><br/>
            <textarea placeholder="Test Data" value={testCaseForm.testData} onChange={e => setTestCaseForm({...testCaseForm, testData: e.target.value})} style={{ width: '100%', height: '50px' }} /><br/><br/>
            <textarea placeholder="Steps (Required)" value={testCaseForm.testSteps} onChange={e => setTestCaseForm({...testCaseForm, testSteps: e.target.value})} style={{ width: '100%', height: '60px' }} /><br/><br/>
            <input type="text" placeholder="Expected Result (Required)" value={testCaseForm.expectedResult} onChange={e => setTestCaseForm({...testCaseForm, expectedResult: e.target.value})} style={{ width: '100%' }} /><br/><br/>
            
            <button type="submit">Add Test Case</button>
          </form>

          {/* Test Case List */}
          {testCases.map(tc => {
            const isExpanded = !!expandedTestCases[tc.id];
            
            // UI Color mapping based on status
            let statusColor = '#555';
            if (tc.status === 'Pass') statusColor = '#2e7d32';
            if (tc.status === 'Fail') statusColor = '#c62828';
            if (tc.status === 'Blocked') statusColor = '#ef6c00';

            return (
              <div key={tc.id} style={{ border: '1px solid #ccc', padding: '12px', margin: '10px 0', borderRadius: '4px', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: '0' }}>{tc.id}: {tc.title}</h4>
                  <button 
                    onClick={() => toggleExpand(tc.id)} 
                    style={{ padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    {isExpanded ? '▲ Hide Details' : '▼ Expand Details'}
                  </button>
                </div>
                
                <p style={{ margin: '8px 0 4px 0' }}>
                  <strong>Priority:</strong> {tc.priority} | 
                  <strong> Build:</strong> {tc.build} | 
                  <strong> Status:</strong> <span style={{ color: statusColor, fontWeight: 'bold' }}>{tc.status}</span>
                </p>
                
                {/* Collapsible content pane containing details fields */}
                {isExpanded && (
                  <div style={{ background: '#fcfcfc', border: '1px solid #eee', padding: '8px', margin: '8px 0', borderRadius: '4px', fontSize: '14px' }}>
                    <p style={{ margin: '4px 0' }}><strong>Preconditions:</strong> {tc.preconditions || "None Specified"}</p>
                    <p style={{ margin: '4px 0' }}><strong>Test Data:</strong> {tc.testData || "None Specified"}</p>
                    <p style={{ margin: '4px 0' }}><strong>Steps:</strong></p>
                    <pre style={{ margin: '4px 0 8px 10px', whiteSpace: 'pre-wrap', fontFamily: 'sans-serif', color: '#444' }}>{tc.testSteps}</pre>
                    <p style={{ margin: '4px 0' }}><strong>Expected Result:</strong> {tc.expectedResult}</p>
                  </div>
                )}

                <div style={{ marginTop: '10px', marginBottom: '10px', borderTop: '1px dashed #eee', paddingTop: '10px' }}>
                  <label><strong>Actual Result (Log after execution):</strong></label><br/>
                  <input 
                    type="text" 
                    placeholder="Type actual execution outcome..." 
                    value={tc.actualResult} 
                    onChange={e => updateTestCaseActualResult(tc.id, e.target.value)}
                    style={{ width: '95%', padding: '4px', marginTop: '5px' }}
                  />
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button onClick={() => updateTestCaseStatus(tc.id, 'Pass')} style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px' }}>Pass</button>{' '}
                  <button onClick={() => updateTestCaseStatus(tc.id, 'Fail')} style={{ backgroundColor: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px' }}>Fail (Auto-Bug)</button>{' '}
                  <button onClick={() => updateTestCaseStatus(tc.id, 'Blocked')} style={{ backgroundColor: '#fff3e0', color: '#ef6c00', border: '1px solid #ffe0b2', padding: '4px 8px', cursor: 'pointer', borderRadius: '3px' }}>Block</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ================= BUGS SECTION ================= */}
        <div>
          <h2>🪲 Bugs Logged</h2>
          <form onSubmit={handleAddBug} style={{ background: '#fff0f0', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h3>Log a Bug</h3>
            <input type="text" placeholder="Bug ID" required value={bugForm.id} onChange={e => setBugForm({...bugForm, id: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Title" required value={bugForm.title} onChange={e => setBugForm({...bugForm, title: e.target.value})} /><br/><br/>
            
            <textarea placeholder="Description / Summary of Bug" value={bugForm.description} onChange={e => setBugForm({...bugForm, description: e.target.value})} style={{ width: '100%', height: '50px' }} /><br/><br/>
            
            <input type="text" placeholder="Linked Test Case ID" value={bugForm.testCaseId} onChange={e => setBugForm({...bugForm, testCaseId: e.target.value})} /><br/><br/>
            <input type="text" placeholder="Build" value={bugForm.appVersionBuild} onChange={e => setBugForm({...bugForm, appVersionBuild: e.target.value})} /><br/><br/>
            
            <input type="text" placeholder="Environment Conditions (e.g. Staging, Stale Network)" value={bugForm.environmentConditions} onChange={e => setBugForm({...bugForm, environmentConditions: e.target.value})} style={{ width: '100%' }} /><br/><br/>
            
            <textarea placeholder="Steps to Reproduce" value={bugForm.stepsToReproduce} onChange={e => setBugForm({...bugForm, stepsToReproduce: e.target.value})} style={{ width: '100%', height: '50px' }} /><br/><br/>
            
            {/* UPDATED: Converted from text input to type="file" field with explicit type filters */}
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Upload Attachment (.png, .jpg, .pdf, .txt):</label>
            <input 
              id="bug-file-upload"
              type="file" 
              accept=".png,.jpg,.jpeg,.pdf,.txt" 
              onChange={handleFileChange} 
              style={{ width: '100%', background: '#fff', padding: '5px', border: '1px solid #ccc', borderRadius: '4px' }} 
            /><br/><br/>

            <textarea placeholder="Additional Notes" value={bugForm.additionalNotes} onChange={e => setBugForm({...bugForm, additionalNotes: e.target.value})} style={{ width: '100%', height: '50px' }} /><br/><br/>
            
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
            <div key={bug.id} style={{ border: '1px solid #ffb3b3', backgroundColor: '#fff9f9', padding: '12px', margin: '10px 0', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{bug.id}: {bug.title}</h4>
              
              <p style={{ margin: '4px 0', fontSize: '14px', color: '#444' }}><strong>Description:</strong> {bug.description || "None Specified"}</p>
              
              <p style={{ color: '#d32f2f', margin: '4px 0' }}><strong>Linked TC:</strong> {bug.testCaseId || "None"} | <strong>Build:</strong> {bug.appVersionBuild}</p>
              
              <p style={{ margin: '4px 0' }}><strong>Environment:</strong> {bug.environmentConditions || "None Specified"}</p>
              
              <p style={{ margin: '4px 0' }}><strong>Steps to Reproduce:</strong></p>
              <pre style={{ margin: '2px 0 6px 10px', whiteSpace: 'pre-wrap', fontSize: '13px', fontFamily: 'sans-serif', color: '#555' }}>{bug.stepsToReproduce}</pre>
              
              {/* UPDATED: Dynamic layout processing depending on the specific asset format */}
              <div style={{ margin: '8px 0', padding: '8px', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
                <strong>Attachment:</strong>{' '}
                {bug.attachments ? (
                  <div style={{ marginTop: '5px' }}>
                    <span style={{ fontSize: '13px', color: '#333', display: 'block', marginBottom: '5px' }}>
                      📄 {bug.attachments.name}
                    </span>
                    
                    {/* Render inline preview for PNG/JPG images */}
                    {bug.attachments.type.startsWith('image/') && (
                      <img 
                        src={bug.attachments.dataUrl} 
                        alt={bug.attachments.name} 
                        style={{ maxWidth: '100%', maxHeight: '150px', display: 'block', borderRadius: '4px', border: '1px solid #ccc' }} 
                      />
                    )}

                    {/* Provide sandboxed view or download links for non-image types */}
                    {(bug.attachments.type === 'application/pdf' || bug.attachments.type === 'text/plain') && (
                      <a 
                        href={bug.attachments.dataUrl} 
                        download={bug.attachments.name} 
                        style={{ display: 'inline-block', padding: '4px 8px', background: '#0288d1', color: '#fff', textDecoration: 'none', borderRadius: '3px', fontSize: '12px' }}
                      >
                        Download Document
                      </a>
                    )}
                  </div>
                ) : (
                  <span style={{ color: '#888', fontSize: '13px' }}>No file attached</span>
                )}
              </div>
              
              <p style={{ margin: '4px 0' }}><strong>Notes:</strong> {bug.additionalNotes || "None"}</p>
              
              <p style={{ margin: '8px 0 4px 0' }}><strong>Severity:</strong> {bug.severity} | <strong>Priority:</strong> {bug.priority}</p>
              
              <div style={{ marginTop: '8px' }}>
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
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}