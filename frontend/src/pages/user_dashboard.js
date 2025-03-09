import React, { useState } from 'react';
import UserUpload from '../components/userupload';
import UserDownload from '../components/userdownload';
//import './Dashboard.css';

function UserDashboard() {
  const [selectedComponent, setSelectedComponent] = useState(null);

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <button onClick={() => setSelectedComponent(<UserUpload />)}>Upload Files</button>
        <button onClick={() => setSelectedComponent(<UserDownload />)}>Download Files</button>
      </div>
      <div className="content">
        {selectedComponent}
      </div>
    </div>
  );
}

export default UserDashboard;
