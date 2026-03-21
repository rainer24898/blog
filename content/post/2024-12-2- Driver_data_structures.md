---
title: Driver data structures 
author: rainer
date: 2024-12-3 1:26:00 +0300
categories: [Linux, Networking, Linux Driver]
tags: [Networking, Linux Driver, Linux]
math: true
mermaid: true
render_with_liquid: false
image: 
    # path: /assets/img/post/UsbEthernet/usbheader.jpg
---



#  Driver data structures 

### Giải thích về **Driver Data Structures** khi làm việc với NIC devices

Trong Linux, khi xử lý các thiết bị **NIC** (Network Interface Card), hai cấu trúc dữ liệu chính cần được sử dụng là:

1. **`struct sk_buff` (Socket Buffer)**
    - Là cấu trúc dữ liệu cơ bản trong mạng Linux, được sử dụng để quản lý và xử lý các gói tin (packets) gửi và nhận.
    - Mỗi gói tin truyền qua hệ thống mạng Linux được bao bọc trong một `sk_buff`.
2. **`struct net_device` (Network Device)**
    - Đại diện cho mọi thiết bị mạng trong kernel Linux.
    - Đây là giao diện chính để thực hiện truyền tải dữ liệu qua NIC.

---

### 1. **`struct sk_buff` (Socket Buffer Structure)**

Được định nghĩa trong **`include/linux/skbuff.h`**, cấu trúc này bao bọc bất kỳ gói tin nào đi qua NIC.

Mỗi gói tin nhận hoặc gửi đều được xử lý thông qua cấu trúc này.

### **Cấu trúc chính:**

```c
struct sk_buff {
    struct sk_buff *next;        // Trỏ đến gói tin tiếp theo
    struct sk_buff *prev;        // Trỏ đến gói tin trước đó
    ktime_t tstamp;              // Thời gian dấu mốc (timestamp)
    struct rb_node rbnode;       // Dùng trong netem và TCP stack
    struct sock *sk;             // Socket liên quan
    struct net_device *dev;      // Thiết bị mạng liên quan
    unsigned int len;            // Độ dài gói tin
    unsigned int data_len;       // Độ dài phần dữ liệu
    __u16 mac_len;               // Độ dài của MAC header
    __u16 hdr_len;               // Độ dài của header
    // Nhiều trường khác để xử lý mạng...
};

```

### **Chức năng các trường quan trọng:**

- **`next` / `prev`**: Cho phép tạo danh sách liên kết kép giữa các gói tin, thường dùng trong hàng đợi (queues).
- **`tstamp`**: Dấu mốc thời gian để đánh dấu khi gói tin được tạo hoặc nhận.
- **`rbnode`**: Dùng trong TCP stack để tổ chức gói tin theo dạng cây đỏ-đen (red-black tree).
- **`dev`**: Gắn kết gói tin với thiết bị mạng nơi nó được gửi hoặc nhận.
- **`len`**: Tổng độ dài gói tin.
- **`data_len`**: Độ dài phần dữ liệu của gói tin (payload).
- **`mac_len` / `hdr_len`**: Độ dài của header MAC và header gói tin.

---

### 2. **`struct net_device` (Network Device Structure)**

Được định nghĩa trong **`include/linux/netdevice.h`**, cấu trúc này đại diện cho thiết bị mạng trong Linux.

Đây là giao diện qua đó dữ liệu được truyền tải, xử lý qua NIC.

### **Cấu trúc chính:**

```c
struct net_device {
    char name[IFNAMSIZ];           // Tên của thiết bị (vd: "eth0")
    struct net_device_ops *netdev_ops;  // Callback cho các thao tác thiết bị
    unsigned long state;           // Trạng thái hiện tại của thiết bị
    struct net_device_stats stats; // Thống kê thiết bị (số packet, lỗi,...)
    unsigned int mtu;              // Maximum Transmission Unit (MTU)
    unsigned char dev_addr[ETH_ALEN]; // Địa chỉ MAC của thiết bị
    struct net_device *next;       // Danh sách thiết bị liên kết
    // Nhiều trường khác...
};

```

### **Chức năng các trường quan trọng:**

- **`name`**: Tên của thiết bị mạng (ví dụ: `eth0`, `wlan0`).
- **`netdev_ops`**: Chứa các callback function để thực hiện các thao tác mạng (vd: gửi, nhận dữ liệu). Chi tiết có thể tham khảo tại : [Cơ chế callback trong cấu trúc `struct net_device`](https://rainer24898.github.io/posts/Mechanism_callback_in_net_device/)
- **`state`**: Trạng thái thiết bị (vd: hoạt động, dừng, lỗi,...).
- **`stats`**: Thống kê hiệu suất và lỗi của thiết bị (số gói tin gửi/nhận thành công, số gói bị drop,...).
- **`mtu`**: Định nghĩa kích thước tối đa của gói tin có thể được truyền qua thiết bị. Chi tiết về MTU size có thể tìm hiểu tại: [MTU](https://thietbimanggiare.com/mtu-maximum-transmission-unit/#:~:text=MTU%20%C4%91%C6%B0%E1%BB%A3c%20x%C3%A1c%20%C4%91%E1%BB%8Bnh%20d%C6%B0%E1%BB%9Bi,c%E1%BB%91%20%C4%91%E1%BB%8Bnh%20l%C3%A0%201500%20byte.)
- **`dev_addr`**: Địa chỉ MAC của thiết bị.
- **`next`**: Cho phép liên kết các thiết bị mạng thành danh sách.

---

### 3. **Các thư viện hỗ trợ quan trọng**

Khi viết driver cho NIC, bạn cần thêm các thư viện sau:

### **Thư viện quan trọng:**

- **`<linux/etherdevice.h>`**:
    
    Hỗ trợ các hàm liên quan đến Ethernet/MAC như:
    
    - `alloc_etherdev()`: Cấp phát bộ nhớ cho thiết bị Ethernet.
    - `eth_type_trans()`: Xác định loại giao thức Ethernet.
- **`<linux/ethtool.h>`**:
    
    Hỗ trợ các thao tác cấu hình thiết bị NIC như thay đổi MTU, lấy thông tin driver, điều chỉnh thông số mạng.
    

---

### Quy trình hoạt động

1. **Khởi tạo `net_device`:**
    - Sử dụng hàm `alloc_etherdev()` để cấp phát bộ nhớ cho một thiết bị mạng Ethernet.
    - Gán các hàm callback trong `net_device_ops`.
2. **Quản lý dữ liệu với `sk_buff`:**
    - Mỗi gói tin nhận được qua thiết bị sẽ được bao bọc bởi một `struct sk_buff`.
    - Khi driver nhận/gửi dữ liệu, nó thao tác với `sk_buff`.
3. **Xử lý dữ liệu qua NIC:**
    - Gói tin từ lớp cao hơn (vd: TCP/IP stack) được truyền xuống qua `net_device`.
    - Driver xử lý gói tin và chuyển nó qua NIC để gửi hoặc nhận.

---

### Ví dụ ngắn về cách sử dụng

### **1. Tạo `net_device`:**

```c
struct net_device *dev;

dev = alloc_etherdev(sizeof(struct private_data));
if (!dev)
    return -ENOMEM;

strcpy(dev->name, "myeth%d");
dev->netdev_ops = &my_netdev_ops;
register_netdev(dev);

```

### **2. Xử lý gói tin với `sk_buff`:**

```c
int my_start_xmit(struct sk_buff *skb, struct net_device *dev) {
    struct private_data *priv = netdev_priv(dev);

    // Truy xuất dữ liệu từ sk_buff
    unsigned char *data = skb->data;
    unsigned int len = skb->len;

    // Truyền dữ liệu qua NIC
    send_to_hardware(data, len);

    dev_kfree_skb(skb); // Giải phóng sk_buff sau khi xử lý
    return NETDEV_TX_OK;
}

```

---

Xem thêm ví dụ chi tiết hơn tại: [Create Virtual Network Driver](https://rainer24898.github.io/posts/Network_driver/)

### Tóm tắt

- **`struct sk_buff`**: Bao bọc mọi gói tin gửi/nhận qua NIC, chứa thông tin metadata và dữ liệu thực tế.
- **`struct net_device`**: Đại diện cho thiết bị mạng, cung cấp các callback để giao tiếp với hệ thống.
- **Thư viện hỗ trợ**: `etherdevice.h` và `ethtool.h` cung cấp các hàm và cấu trúc liên quan đến Ethernet và cấu hình NIC.