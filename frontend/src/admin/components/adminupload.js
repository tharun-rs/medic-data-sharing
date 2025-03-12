import React, { useState } from "react";
import { Checkbox, Input, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import '../../index.css';

function UploadFiles() {
  const [section, setSection] = useState("pii");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    patientId: "",
    readAccess: false,
    writeAccess: false,
    anonymousPHIAccess: false,
    fileType: "",
    fileTag: "",
  });

  const handleFileChange = (info) => {
    if (info.fileList.length > 0) {
      setFile(info.file);
    } else {
      setFile(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file");
      return;
    }

    const apiEndpoints = new Map([
      ["authorization", `${process.env.REACT_APP_BASE_URL}/fileHandler/upload/authorization/`],
      ["pii", `${process.env.REACT_APP_BASE_URL}/fileHandler/upload/pii`],
      [
        "phi",
        formData.anonymous
          ? `${process.env.REACT_APP_BASE_URL}/fileHandler/upload/phi/anonymous`
          : `${process.env.REACT_APP_BASE_URL}/fileHandler/upload/phi`,
      ],
    ]);

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
      const response = await fetch(apiEndpoints.get(section), {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Upload failed with status ${response.status}`);
      }

      alert(data.message || "Upload successful");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(error.message || "Failed to upload file");
    }
  };

  return (
    <div className="upload-container">
      {/* Narrower Container */}
      <h2>Upload Files</h2>

      {/* Section Selection Buttons */}
      <div className="flex-1 flex justify-center items-center p-6" style={{
        display: "flex",
        justifyContent: "space-around", // Equal spacing
        alignItems: "center", // Vertical centering
        padding: "8px",
      }}>
        {["pii", "authorization", "phi"].map((type) => (
          <Button
            key={type}
            type={section === type ? "primary" : "default"}
            onClick={() => setSection(type)}
            className="w-1/3 text-xs"
            style={{
              boxShadow: "1px 1px 5px rgb(165, 165, 165)"
            }}
          >
            {type.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Form */}
      <form className="formSection" onSubmit={handleSubmit}>
        <h3 className="text-md font-semibold text-center">{section.toUpperCase()} File</h3>

        {/* File Upload */}
        <Upload beforeUpload={() => false} onChange={handleFileChange} className="w-full">
          <Button icon={<UploadOutlined />} className="w-full text-xs">
            Click to Upload
          </Button>
        </Upload>

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
          <div className="flex flex-col">
            <Checkbox name="readAccess" checked={formData.readAccess} onChange={handleChange}>
              Read Access
            </Checkbox>
            <Checkbox name="writeAccess" checked={formData.writeAccess} onChange={handleChange}>
              Write Access
            </Checkbox>
            <Checkbox name="anonymousPHIAccess" checked={formData.anonymousPHIAccess} onChange={handleChange}>
              Anonymous PHI Access
            </Checkbox>
          </div>
        )}

        {/* PHI Section */}
        {section === "phi" && (
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
          </>
        )}

        {/* Submit Button */}
        <Button type="primary" htmlType="submit">
          Upload
        </Button>
      </form>
    </div>

  );
}

export default UploadFiles;