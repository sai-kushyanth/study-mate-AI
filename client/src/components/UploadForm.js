import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function UploadForm() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setResponse('Please select a file.');
      return;
    }
    setLoading(true); // Start loading
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:5001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.summary && data.flashcards) {
        setShowAlert(true); // Set alert to show
        console.log('Summary:', data.summary);
        console.log('Flashcards:', data.flashcards);
        setResponse(
          <div>
            <h5>Summary & Flashcards</h5>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {data.summary}
            </pre>
          </div>
        );
      } else {
        setResponse('Failed to generate summary/flashcards.');
      }
    } catch (err) {
      setResponse('Upload error: ' + err.message);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Show alert only once
  useEffect(() => {
    if (showAlert) {
      alert('AI Summary and Flashcards generated!');
      setShowAlert(false);
    }
  }, [showAlert]);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Upload a File</h2>
              {loading && (
                <div className="text-center my-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div>Generating summary and flashcards...</div>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <input
                    type="file"
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  Upload
                </button>
              </form>
              {response && (
                <div className="alert alert-info mt-4" role="alert">
                  {response}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadForm;
