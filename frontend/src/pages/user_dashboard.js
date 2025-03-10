import React, { useState } from 'react';
import UploadFiles from '../admin/components/adminupload';
import DownloadFiles from '../admin/components/admindownload';
import '../index.css';

function UserDashboard() {
  const [selectedComponent, setSelectedComponent] = useState(<UploadFiles /> );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h4>User Dashboard</h4>
        <hr/>
        <div onClick={() => setSelectedComponent(<UploadFiles />)}>Upload<br></br>Files</div>
        <div onClick={() => setSelectedComponent(<DownloadFiles />)}>Download<br></br>Files</div>
      </div>
      <div className="content">
        {selectedComponent}
      </div>
    </div>
  );
}

export default UserDashboard;
