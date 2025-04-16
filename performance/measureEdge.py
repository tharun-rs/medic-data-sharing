import os
import requests
import csv
import matplotlib.pyplot as plt

# Configurations
EDGE_APP1_URL = "http://localhost:3000/fileHandler/upload/authorization"
EDGE_APP2_URL = "http://localhost:3001/fileHandler/download/testTimings"
FILE_SIZES_KB = [size for size in range(500, 40000, 1500)]  # [500, 1000, ..., 5000]
PATIENT_IDS = [f"patient1{i+1}" for i in range(len(FILE_SIZES_KB))]
TEST_DIR = "test_files"
OUTPUT_DIR = "outputs"
REQUESTOR = "Org1"

os.makedirs(TEST_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate dummy files
def generate_files():
    for size_kb in FILE_SIZES_KB:
        path = os.path.join(TEST_DIR, f"{size_kb}kb.txt")
        with open(path, "wb") as f:
            f.write(b"x" * size_kb * 1024)

# Upload file to edge-app1
def upload_file(file_path, patient_id):
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {
            "readAccess": "true",
            "writeAccess": "true",
            "anonymousPHIAccess": "false",
            "patientId": patient_id
        }
        response = requests.post(EDGE_APP1_URL, files=files, data=data)
        response.raise_for_status()
        return response.json()["fileId"]

# Call /testTimings on edge-app2
def test_timing(patient_id, timeout=60):  # timeout in seconds
    try:
        res = requests.get(EDGE_APP2_URL, json={
            "patientId": patient_id,
            "requestor": REQUESTOR,
        }, timeout=timeout)  # timeout added here

        res.raise_for_status()
        return res.json()
    except requests.exceptions.Timeout:
        print(f"Request timed out for patientId: {patient_id}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Request failed for patientId: {patient_id} - {e}")
        return None


# Run tests
def main():
    generate_files()
    uploaded_files = []

    #Upload Phase
    for size_kb, patient_id in zip(FILE_SIZES_KB, PATIENT_IDS):
        file_path = os.path.join(TEST_DIR, f"{size_kb}kb.txt")
        print(f"Uploading: {file_path} for {patient_id}")
        file_id = upload_file(file_path, patient_id)
        uploaded_files.append({
            "patient_id": patient_id,
            "size_kb": size_kb,
        })

    # Test Phase
    edge_results = []
    blockchain_results = []

    for item in uploaded_files:
        print(f"Testing timings for patientId: {item['patient_id']}")
        timing = test_timing(item["patient_id"])

        if not timing:
            continue  # skip on timeout or error

        edge_results.append({
            "patient_id": item["patient_id"],
            "size_kb": item["size_kb"],
            "T_edge": timing["T_edge"]
        })

        blockchain_results.append({
            "patient_id": item["patient_id"],
            "size_kb": item["size_kb"],
            "T_transaction": timing["T_transaction"]
        })


    # Save CSVs
    edge_csv = os.path.join(OUTPUT_DIR, "edge_timings.csv")
    blockchain_csv = os.path.join(OUTPUT_DIR, "blockchain_timings.csv")

    with open(edge_csv, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["patient_id", "size_kb", "T_edge"])
        writer.writeheader()
        writer.writerows(edge_results)

    with open(blockchain_csv, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["patient_id", "size_kb", "T_transaction"])
        writer.writeheader()
        writer.writerows(blockchain_results)

    print(f"CSV saved to {edge_csv}")
    print(f"CSV saved to {blockchain_csv}")

    # Plot Edge Time
    sizes_edge = [r["size_kb"] for r in edge_results]
    t_edge = [r["T_edge"] for r in edge_results]

    plt.figure()
    plt.plot(sizes_edge, t_edge, label="Edge Time", color='blue')
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Edge Node Time vs File Size")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    edge_plot_path = os.path.join(OUTPUT_DIR, "edge_timings.png")
    plt.savefig(edge_plot_path)
    print(f"Edge plot saved to {edge_plot_path}")

    # Plot Blockchain (Transaction) Time
    sizes_tx = [r["size_kb"] for r in blockchain_results]
    t_tx = [r["T_transaction"] for r in blockchain_results]

    plt.figure()
    plt.plot(sizes_tx, t_tx, label="Transaction Time", color='green')
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Blockchain Transaction Time vs File Size")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()
    tx_plot_path = os.path.join(OUTPUT_DIR, "blockchain_timings.png")
    plt.savefig(tx_plot_path)
    print(f"Blockchain plot saved to {tx_plot_path}")

    plt.show()

if __name__ == "__main__":
    main()