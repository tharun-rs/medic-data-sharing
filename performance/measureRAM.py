import docker
import re
import time

client = docker.from_env()

GROUP_PATTERNS = {
    "edge-app": re.compile(r"edge-app.*"),
    "ipfs-node": re.compile(r"ipfs-node.*"),
    "peer": re.compile(r"peer.*"),
    "couchdb": re.compile(r"couchdb.*"),
    "orderer": re.compile(r"orderer.*"),
}

def get_stats(container):
    try:
        stats = container.stats(stream=False)

        cpu_delta = stats["cpu_stats"]["cpu_usage"]["total_usage"] - \
                    stats["precpu_stats"]["cpu_usage"]["total_usage"]
        system_delta = stats["cpu_stats"]["system_cpu_usage"] - \
                       stats["precpu_stats"]["system_cpu_usage"]
        num_cores = stats["cpu_stats"].get("online_cpus") or len(stats["cpu_stats"]["cpu_usage"]["percpu_usage"])

        cpu_usage_cores = (cpu_delta / system_delta) * num_cores if system_delta > 0 else 0

        mem_usage_bytes = stats["memory_stats"]["usage"]
        mem_usage_mb = mem_usage_bytes / (1024 * 1024)

        return cpu_usage_cores, mem_usage_mb
    except Exception as e:
        print(f"Error fetching stats for {container.name}: {e}")
        return None, None

def average_stats(group_name, containers):
    cpu_total = 0.0
    mem_total = 0.0
    count = 0

    for container in containers:
        cpu, mem = get_stats(container)
        if cpu is not None:
            cpu_total += cpu
            mem_total += mem
            count += 1

    if count == 0:
        print(f"{group_name}: No matching containers")
        return

    print(f"{group_name}:")
    print(f"  Avg CPU Usage:  { (cpu_total *1000)/ count:.3f} milli cores")
    print(f"  Avg Memory Use: {mem_total / count:.2f} MB")
    print("")

def main():
    containers = client.containers.list()
    grouped = {key: [] for key in GROUP_PATTERNS}

    for container in containers:
        for group, pattern in GROUP_PATTERNS.items():
            if pattern.match(container.name):
                grouped[group].append(container)

    for group, group_containers in grouped.items():
        average_stats(group, group_containers)

if __name__ == "__main__":
    main()
