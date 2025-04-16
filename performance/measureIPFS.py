import os
import base64
import time
import requests
import matplotlib.pyplot as plt
import csv

# Configuration
IPFS_SERVER = "http://localhost:3002"
FILE_SIZES_KB = [size for size in range(500, 55000, 500)]  # Sizes in KB
TEST_DIR = "test_files"
OUTPUT_DIR = "outputs"

# Ensure test directory and output directory exist
os.makedirs(TEST_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Generate dummy files of given sizes
def generate_files():
    for size_kb in FILE_SIZES_KB:
        file_path = os.path.join(TEST_DIR, f"{size_kb}kb.txt")
        with open(file_path, "wb") as f:
            f.write(b'1' * 1024 * size_kb)
    print(f"Generated files: {FILE_SIZES_KB}")

# Upload and download a file, measure timings
def test_file(file_path):
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    base64_data = base64.b64encode(file_bytes).decode("utf-8")

    # Upload
    upload_start = time.time()
    upload_res = requests.post(f"{IPFS_SERVER}/upload", json={"fileData": base64_data})
    upload_end = time.time()
    T_upload = (upload_end - upload_start) * 1000

    cid = upload_res.json()["cid"]

    # Download
    download_start = time.time()
    download_res = requests.get(f"{IPFS_SERVER}/download/{cid}")
    download_end = time.time()
    T_download = (download_end - download_start) * 1000

    T_total = T_upload + T_download
    size_kb = os.path.getsize(file_path) / 1024

    return {
        "size_kb": size_kb,
        "T_upload": T_upload,
        "T_download": T_download,
        "T_total": T_total
    }

# Main
def run_tests():
    generate_files()
    results = []

    for size_kb in FILE_SIZES_KB:
        file_path = os.path.join(TEST_DIR, f"{size_kb}kb.txt")
        print(f"Testing file: {file_path}")
        result = test_file(file_path)
        print(f"  Size: {result['size_kb']} KB | Upload: {result['T_upload']:.2f} ms | Download: {result['T_download']:.2f} ms | Total: {result['T_total']:.2f} ms")
        results.append(result)

    # Plot results
    sizes = [r["size_kb"] for r in results]
    upload_times = [r["T_upload"] for r in results]
    download_times = [r["T_download"] for r in results]
    total_times = [r["T_total"] for r in results]

    plt.plot(sizes, upload_times, linestyle='-', color='green', label='Upload Time')
    plt.plot(sizes, download_times, linestyle='-', color='orange', label='Download Time')
    plt.plot(sizes, total_times, linestyle='-', color='blue', label='Total Time')

    plt.xlabel('File Size (KB)')
    plt.ylabel('Response Time (ms)')
    plt.title('IPFS Node: Upload vs Download vs Total Time')
    plt.grid(True)
    plt.legend()
    plt.tight_layout()

    # Save plot to file
    plot_path = os.path.join(OUTPUT_DIR, "ipfs_response_time_plot.png")
    plt.savefig(plot_path)
    print(f"Plot saved to {plot_path}")

    # Export results to CSV
    csv_path = os.path.join(OUTPUT_DIR, "ipfs_response_times.csv")
    with open(csv_path, mode="w", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=["size_kb", "T_upload", "T_download", "T_total"])
        writer.writeheader()
        for result in results:
            writer.writerow(result)

    print(f"CSV file saved to {csv_path}")

    plt.show()

if __name__ == "__main__":
    run_tests()
