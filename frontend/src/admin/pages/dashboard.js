import React, { useState } from 'react';
import CreateUser from '../components/createuser';
import UploadFiles from '../components/adminupload';
import DownloadFiles from '../components/admindownload';
import '../../index.css';

function AdminDashboard() {
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h4>Admin Dashboard</h4>
        <hr/>
        <div onClick={() => setSelectedComponent(<CreateUser />)}>Create<br></br>New User</div>
        <div onClick={() => setSelectedComponent(<UploadFiles />)}>Upload<br></br>Files</div>
        <div onClick={() => setSelectedComponent(<DownloadFiles />)}>Download<br></br>Files</div>
      </div>
      <div className="content">
        {selectedComponent}
      </div>
    </div>
  );
}

export default AdminDashboard;
