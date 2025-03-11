import React, { useState } from "react";
import { Radio, Button, Input } from "antd";

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

    const apiEndpoints = new Map([
      ["authorization", `${process.env.REACT_APP_BASE_URL}/fileHandler/download/authorization/patientId`],
      ["pii", `${process.env.REACT_APP_BASE_URL}/fileHandler/download/pii`],
      ["phi", formData.anonymous
          ? `${process.env.REACT_APP_BASE_URL}/fileHandler/download/phi/anonymous`
          : `${process.env.REACT_APP_BASE_URL}/fileHandler/download/phi`
      ]
    ]);

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
      const response = await fetch(apiEndpoints.get(section), {
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100" style={{ maxWidth: "80vw", height: "80vh", margin: "auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}>
      {/* Narrower Container */}
      <div className="w-[240px] bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-lg font-bold text-center mb-4">Download Files</h2>

        {/* Section Selection Buttons */}
        <div className="flex-1 flex justify-center items-center p-6" style={{
          display: "flex",
          justifyContent: "space-around", // Equal spacing
          alignItems: "center", // Vertical centering
          padding: "4px"
        }}>
          {["pii", "authorization", "phi"].map((type) => (
            <Button
              key={type}
              type={section === type ? "primary" : "default"}
              onClick={() => setSection(type)}
              className="w-1/3 text-xs"
            >
              {type.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Form */}
        <form className="space-y-2 flex flex-col" onSubmit={handleSubmit} style={{ maxWidth: "25vw", margin: "auto", padding: "20px", border: "1px solid #ddd", borderRadius: "8px", background: "#fff" }}>
          <h3 className="text-md font-semibold text-center">{section.toUpperCase()} File</h3>

          {/* Patient ID Input */}
          <Input
            type="text"
            name="patientId"
            placeholder="Patient ID"
            value={formData.patientId}
            onChange={handleChange}
            required
            className="text-xs"
          />

          {/* Authorization Section */}
          {section === "authorization" && (
            <Input
              type="text"
              name="requestor"
              placeholder="Requestor"
              value={formData.requestor}
              onChange={handleChange}
              required
              className="text-xs"
            />
          )}

          {/* PII Section */}
          {section === "pii" && (
            <Input
              type="text"
              name="dataCustodian"
              placeholder="Data Custodian"
              value={formData.dataCustodian}
              onChange={handleChange}
              required
              className="text-xs"
            />
          )}

          {/* PHI Section */}
          {section === "phi" && (
            <>
              <span style={{ marginLeft: "10px" }}>Anonymous?
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

              {!formData.anonymous ? (
                <Input
                  type="text"
                  name="dataCustodian"
                  placeholder="Data Custodian"
                  value={formData.dataCustodian}
                  onChange={handleChange}
                  required
                  className="text-xs"
                />
              ) : (
                <>
                  <Input
                    type="text"
                    name="fileType"
                    placeholder="File Type"
                    value={formData.fileType}
                    onChange={handleChange}
                    required
                    className="text-xs"
                  />
                  <Input
                    type="text"
                    name="fileTag"
                    placeholder="File Tag"
                    value={formData.fileTag}
                    onChange={handleChange}
                    required
                    className="text-xs"
                  />
                  <Input
                    type="text"
                    name="dateRange"
                    placeholder="Date Range (YYYY-MM-DD)"
                    value={formData.dateRange}
                    onChange={handleChange}
                    required
                    className="text-xs"
                  />
                </>
              )}
            </>
          )}

          {/* Submit Button */}
          <Button type="primary" htmlType="submit" className="w-full text-xs">
            Download
          </Button>
        </form>
      </div>
    </div>
  );
}

export default DownloadFiles;