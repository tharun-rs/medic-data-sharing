import os
import requests
import csv
import matplotlib.pyplot as plt

# Configurations
EDGE_APP1_URL = "http://localhost:3000/fileHandler/upload/authorization"
EDGE_APP2_URL = "http://localhost:3001/fileHandler/download/testTimings"
FILE_SIZES_KB = [size for size in range(500, 100500, 500)]  # [500, 1000, ..., 1005000]
PATIENT_IDS = [f"patient{i+1}" for i in range(len(FILE_SIZES_KB))]
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
def test_timing(patient_id, timeout=600):  # timeout in seconds
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
    # generate_files()
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
            "T_edge": timing["T_edge"],
            "T_edge_base": timing["T_edge_base"]
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
        writer = csv.DictWriter(csvfile, fieldnames=["patient_id", "size_kb", "T_edge", "T_edge_base"])
        writer.writeheader()
        writer.writerows(edge_results)


    with open(blockchain_csv, "w", newline="") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=["patient_id", "size_kb", "T_transaction"])
        writer.writeheader()
        writer.writerows(blockchain_results)

    print(f"CSV saved to {edge_csv}")
    print(f"CSV saved to {blockchain_csv}")

    # Skip the first entry to avoid setup time influence
    edge_results_filtered = edge_results[1:]
    blockchain_results_filtered = blockchain_results[1:]

    # Extract data for Edge
    sizes_edge = [r["size_kb"] for r in edge_results_filtered]
    t_edge = [r["T_edge"] for r in edge_results_filtered]
    t_edge_base = [r["T_edge_base"] for r in edge_results_filtered]

    # Extract data for Blockchain
    sizes_tx = [r["size_kb"] for r in blockchain_results_filtered]
    t_tx = [r["T_transaction"] for r in blockchain_results_filtered]

    # Calculate max Y value across all timing lists for consistent Y-axis scaling
    all_times = [*t_edge, *t_edge_base, *t_tx]
    max_y = max(all_times)
    buffer = 100  # Optional: add a little space above the highest point

    # Plot Edge Time + Edge Base Time
    plt.figure()
    plt.plot(sizes_edge, t_edge, label="MedMe: Response Time", color='blue')
    plt.plot(sizes_edge, t_edge_base, label="MSNET: Response Time", color='red', linestyle='--')
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Edge Node Timings vs File Size")
    plt.legend()
    plt.grid(True)
    plt.ylim(0, max_y + buffer)
    plt.tight_layout()
    edge_plot_path = os.path.join(OUTPUT_DIR, "edge_timings.png")
    plt.savefig(edge_plot_path)
    print(f"Edge plot saved to {edge_plot_path}")

    # Plot Blockchain (Transaction) Time
    plt.figure()
    plt.plot(sizes_tx, t_tx, label="Transaction Time", color='green')
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Blockchain Transaction Time vs File Size")
    plt.legend()
    plt.grid(True)
    plt.ylim(0, max_y + buffer)
    plt.tight_layout()
    tx_plot_path = os.path.join(OUTPUT_DIR, "blockchain_timings.png")
    plt.savefig(tx_plot_path)
    print(f"Blockchain plot saved to {tx_plot_path}")

    # Load IPFS results from CSV (ensure second script ran before this one)
    ipfs_csv = os.path.join(OUTPUT_DIR, "ipfs_response_times.csv")
    ipfs_results = []

    if os.path.exists(ipfs_csv):
        with open(ipfs_csv, newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                ipfs_results.append({
                    "size_kb": int(float(row["size_kb"])),
                    "T_upload": float(row["T_upload"]),
                    "T_download": float(row["T_download"]),
                    "T_total": float(row["T_total"]),
                })

        # Filter out the first entry
        ipfs_results_filtered = ipfs_results[1:]

        sizes_ipfs = [r["size_kb"] for r in ipfs_results_filtered]
        t_upload = [r["T_upload"] for r in ipfs_results_filtered]
        t_download = [r["T_download"] for r in ipfs_results_filtered]
        t_total = [r["T_total"] for r in ipfs_results_filtered]

        # Update max_y with IPFS values too
        all_times.extend(t_upload + t_download + t_total)
        max_y = max(all_times)

        # Plot IPFS times
        plt.figure()
        plt.plot(sizes_ipfs, t_upload, label="Upload Time", color='green')
        plt.plot(sizes_ipfs, t_download, label="Download Time", color='orange')
        plt.plot(sizes_ipfs, t_total, label="Total Time", color='blue')
        plt.xlabel("File Size (KB)")
        plt.ylabel("Time (ms)")
        plt.title("IPFS Node Timings vs File Size")
        plt.legend()
        plt.grid(True)
        plt.ylim(0, max_y + buffer)
        plt.tight_layout()
        ipfs_plot_path = os.path.join(OUTPUT_DIR, "ipfs_timings.png")
        plt.savefig(ipfs_plot_path)
        print(f"IPFS plot saved to {ipfs_plot_path}")
    else:
        print(f"IPFS CSV not found at {ipfs_csv}, skipping IPFS plot.")

    plt.show()


if __name__ == "__main__":
    main()