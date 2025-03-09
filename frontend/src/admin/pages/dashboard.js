import React, { useState } from 'react';
import CreateUser from '../components/createuser';
import UploadFiles from '../components/adminupload';
import DownloadFiles from '../components/admindownload';
//import './Dashboard.css';

function AdminDashboard() {
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <button onClick={() => setSelectedComponent(<CreateUser />)}>Create New User</button>
        <button onClick={() => setSelectedComponent(<UploadFiles />)}>Upload Files</button>
        <button onClick={() => setSelectedComponent(<DownloadFiles />)}>Download Files</button>
      </div>
      <div className="content">
        {selectedComponent}
      </div>
    </div>
  );
}

export default AdminDashboard;
