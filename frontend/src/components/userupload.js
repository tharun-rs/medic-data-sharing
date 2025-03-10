import React, { useState } from 'react';

function UserUpload() {
  const [section, setSection] = useState("");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    patientId: "",
    readAccess: false,
    writeAccess: false,
    anonymousPHIAccess: false,
    fileType: "",
    fileTag: ""
  });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file");
      return;
    }

    const apiEndpoints = {
      authorization: "/api/upload/authorization",
      phi: "/api/upload/phi",
      pii: "/api/upload/pii"
    };

    const form = new FormData();
    form.append("file", file);
    form.append("patientId", formData.patientId);

    if (section === "authorization") {
      form.append("readAccess", formData.readAccess);
      form.append("writeAccess", formData.writeAccess);
      form.append("anonymousPHIAccess", formData.anonymousPHIAccess);
    } else if (section === "phi") {
      form.append("fileType", formData.fileType);
      form.append("fileTag", formData.fileTag);
    }

    try {
      const response = await fetch(apiEndpoints[section], {
        method: "POST",
        body: form
      });

      const data = await response.json();
      alert(data.message || "Upload successful");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    }
  };

  return (
    <div className="upload-container">
      <h3>Choose Files to Upload</h3>
      <button onClick={() => setSection("authorization")}>Authorization Files</button>
      <button onClick={() => setSection("phi")}>PHI Files</button>
      <button onClick={() => setSection("pii")}>PII Files</button>

      {section && (
        <form onSubmit={handleSubmit}>
          <h2>Upload {section.toUpperCase()} File</h2>
          <input type="file" onChange={handleFileChange} required />

          <input
            type="text"
            name="patientId"
            placeholder="Patient ID"
            value={formData.patientId}
            onChange={handleChange}
            required
          />

          {section === "authorization" && (
            <>
              <label>
                <input type="checkbox" name="readAccess" checked={formData.readAccess} onChange={handleChange} />
                Read Access
              </label>
              <label>
                <input type="checkbox" name="writeAccess" checked={formData.writeAccess} onChange={handleChange} />
                Write Access
              </label>
              <label>
                <input type="checkbox" name="anonymousPHIAccess" checked={formData.anonymousPHIAccess} onChange={handleChange} />
                Anonymous PHI Access
              </label>
            </>
          )}

          {section === "phi" && (
            <>
              <input
                type="text"
                name="fileType"
                placeholder="File Type"
                value={formData.fileType}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="fileTag"
                placeholder="File Tag"
                value={formData.fileTag}
                onChange={handleChange}
                required
              />
            </>
          )}

          <button type="submit">Upload</button>
        </form>
      )}
    </div>
  );
}

export default UserUpload;

