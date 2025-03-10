import React, { useState } from 'react';
import UserUpload from '../components/userupload';
import UserDownload from '../components/userdownload';
import '../index.css';

function UserDashboard() {
  const [selectedComponent, setSelectedComponent] = useState(<UserUpload /> );

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <h4>User Dashboard</h4>
        <hr/>
        <div onClick={() => setSelectedComponent(<UserUpload />)}>Upload<br></br>Files</div>
        <div onClick={() => setSelectedComponent(<UserDownload />)}>Download<br></br>Files</div>
      </div>
      <div className="content">
        {selectedComponent}
      </div>
    </div>
  );
}

export default UserDashboard;
