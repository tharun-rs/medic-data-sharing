import React, { useState } from "react";
import { Radio } from "antd";

function DownloadFiles() {
  const [section, setSection] = useState("pii");
  const [formData, setFormData] = useState({
    patientId: "",
    requestor: "",
    dataCustodian: "",
    fileType: "",
    fileTag: "",
    dateRange: "",
    anonymous: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const apiEndpoints = {
      authorization: `${process.env.BASE_URL}/fileHandler/download/authorization/patientId`,
      pii: `${process.env.BASE_URL}/fileHandler/download/pii`,
      phi: formData.anonymous
        ? `${process.env.BASE_URL}/fileHandler/download/phi/anonymous`
        : `${process.env.BASE_URL}/fileHandler/download/phi`,
    };

    const requestData = {
      patientId: formData.patientId,
    };

    if (section === "authorization") {
      requestData.requestor = formData.requestor;
    } else if (section === "pii") {
      requestData.dataCustodian = formData.dataCustodian;
    } else if (section === "phi") {
      if (!formData.anonymous) {
        const [startDate, endDate] = formData.dateRange.split(" - ");
        requestData.startDate = startDate;
        requestData.endDate = endDate;
        requestData.fileType = formData.fileType;
        requestData.fileTag = formData.fileTag;
      } else {
        requestData.patientId = formData.patientId;
        requestData.dataCustodian = formData.dataCustodian;
      }
    }       

    try {
      const response = await fetch(apiEndpoints[section], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error("Download failed");

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `downloaded_file`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file.");
    }
  };

  return (
    <div className="download-container">
      <h2>Download Files</h2>
      <div className="buttonPanel">
        <button className="uploadButton" onClick={() => setSection("pii")}>PII Files</button>
        <button className="uploadButton" onClick={() => setSection("authorization")}>Authorization Files</button>
        <button className="uploadButton" onClick={() => setSection("phi")}>PHI Files</button>
      </div>

      {section && (
        <form className="formSection" onSubmit={handleSubmit}>
          <h3>Download {section.toUpperCase()} File</h3>
          <input
            type="text"
            name="patientId"
            placeholder="Patient ID"
            value={formData.patientId}
            onChange={handleChange}
            required
          />

          {section === "authorization" && (
            <input
              type="text"
              name="requestor"
              placeholder="Requestor"
              value={formData.requestor}
              onChange={handleChange}
              required
            />
          )}

          {section === "pii" && (
            <input
              type="text"
              name="dataCustodian"
              placeholder="Data Custodian"
              value={formData.dataCustodian}
              onChange={handleChange}
              required
            />
          )}

          {section === "phi" && (
            <>
              <span style={{marginLeft: "10px"}}>Anonymous?
              <label>
                <Radio
                  type="radio"
                  className="anonymous"
                  name="anonymous"
                  value="yes"
                  checked={formData.anonymous}
                  onChange={() => setFormData((prev) => ({ ...prev, anonymous: true }))}
                />
                Yes
              </label>
              <label>
                <Radio
                  type="radio"
                  className="anonymous"
                  name="anonymous"
                  value="no"
                  checked={!formData.anonymous}
                  onChange={() => setFormData((prev) => ({ ...prev, anonymous: false }))}
                />
                No
              </label>
              </span>

              {formData.anonymous ? (
                <input
                  type="text"
                  name="dataCustodian"
                  placeholder="Data Custodian"
                  value={formData.dataCustodian}
                  onChange={handleChange}
                  required
                />
              ) : (
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
                  <input
                    type="text"
                    name="dateRange"
                    placeholder="Date Range (YYYY-MM-DD)"
                    value={formData.dateRange}
                    onChange={handleChange}
                    required
                  />
                </>
              )}
            </>
          )}

          <button type="submit">Download</button>
        </form>
      )}
    </div>
  );
}

export default DownloadFiles;
