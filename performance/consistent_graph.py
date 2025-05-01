import os
import csv
import matplotlib.pyplot as plt

OUTPUT_DIR = "outputs"  # Change if needed
BUFFER = 100

def read_edge_csv(path):
    results = []
    with open(path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            results.append({
                "patient_id": row["patient_id"],
                "size_kb": int(float(row["size_kb"])),
                "T_edge": float(row["T_edge"]),
                "T_edge_base": float(row["T_edge_base"]),
            })
    return results[1:]  # Skip setup entry

def read_blockchain_csv(path):
    results = []
    with open(path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            results.append({
                "patient_id": row["patient_id"],
                "size_kb": int(float(row["size_kb"])),
                "T_transaction": float(row["T_transaction"]),
            })
    return results[1:]

def read_ipfs_csv(path):
    results = []
    if not os.path.exists(path):
        print(f"Missing file: {path}")
        return []
    with open(path, newline="") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            results.append({
                "size_kb": int(float(row["size_kb"])),
                "T_upload": float(row["T_upload"]),
                "T_download": float(row["T_download"]),
                "T_total": float(row["T_total"]),
            })
    return results[1:]


def plot_all(edge_data, blockchain_data, ipfs_data):
    # Extract all timings for y-axis scaling
    all_times = []

    sizes_edge = [r["size_kb"] for r in edge_data]
    t_edge = [r["T_edge"] for r in edge_data]
    t_edge_base = [r["T_edge_base"] for r in edge_data]
    all_times += t_edge + t_edge_base

    sizes_tx = [r["size_kb"] for r in blockchain_data]
    t_tx = [r["T_transaction"] for r in blockchain_data]
    all_times += t_tx

    sizes_ipfs = [r["size_kb"] for r in ipfs_data]
    t_upload = [r["T_upload"] for r in ipfs_data]
    t_download = [r["T_download"] for r in ipfs_data]
    t_total = [r["T_total"] for r in ipfs_data]
    all_times += t_upload + t_download + t_total

    max_y = max(all_times)
    
    # Plot Edge: MedMe vs MSNET
    plt.figure()
    plt.plot(sizes_edge, t_edge, label="MedMe: Response Time", color="blue")
    plt.plot(sizes_edge, t_edge_base, label="MSNET: Response Time", color="red", linestyle="--")
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Edge Node Response Time vs File Size")
    plt.ylim(0, max_y + BUFFER)
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "edge_timings.png"))

    # Plot Blockchain
    plt.figure()
    plt.plot(sizes_tx, t_tx, label="Transaction Time", color="green")
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("Blockchain Transaction Time vs File Size")
    plt.ylim(0, max_y + BUFFER)
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "blockchain_timings.png"))

    # Plot IPFS
    plt.figure()
    plt.plot(sizes_ipfs, t_upload, label="Upload Time", color="green")
    plt.plot(sizes_ipfs, t_download, label="Download Time", color="orange")
    plt.plot(sizes_ipfs, t_total, label="Total Time", color="blue")
    plt.xlabel("File Size (KB)")
    plt.ylabel("Time (ms)")
    plt.title("IPFS Node Timings vs File Size")
    plt.ylim(0, max_y + BUFFER)
    plt.grid(True)
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, "ipfs_timings.png"))

    print("All plots saved in", OUTPUT_DIR)


def main():
    edge_path = os.path.join(OUTPUT_DIR, "edge_timings.csv")
    blockchain_path = os.path.join(OUTPUT_DIR, "blockchain_timings.csv")
    ipfs_path = os.path.join(OUTPUT_DIR, "ipfs_response_times.csv")

    edge_data = read_edge_csv(edge_path)
    blockchain_data = read_blockchain_csv(blockchain_path)
    ipfs_data = read_ipfs_csv(ipfs_path)

    plot_all(edge_data, blockchain_data, ipfs_data)


if __name__ == "__main__":
    main()
