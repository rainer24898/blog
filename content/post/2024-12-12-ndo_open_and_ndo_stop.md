---
title: ndo_open() and ndo_stop()
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

### **Chi tiết về mở và đóng giao diện mạng: `ndo_open()` và `ndo_stop()`**

Khi một giao diện mạng được kích hoạt hoặc vô hiệu hóa bởi người dùng (thường là admin) thông qua các công cụ như `ifconfig` hoặc `ip`, kernel sẽ gọi các hàm `ndo_open()` và `ndo_stop()` trong driver mạng. Dưới đây là cách các hàm này hoạt động và các tác vụ cần thực hiện trong mỗi hàm.

---

### **1. `ndo_open()`: Mở giao diện mạng**

### **Mục đích**

- Hàm `ndo_open()` được kernel gọi khi giao diện mạng được cấu hình để hoạt động (`ifconfig <name> up` hoặc `ip link set <name> up`).
- Hàm này chuẩn bị thiết bị mạng để sẵn sàng gửi và nhận gói tin.

### **Hoạt động cần thực hiện**

1. **Truy xuất dữ liệu riêng tư:**
    - Dữ liệu riêng (private data) được gắn với thiết bị mạng trong quá trình cấp phát `alloc_etherdev()` cần được truy xuất để thực hiện các tác vụ cụ thể.
    
    ```c
    struct my_private_data *priv = netdev_priv(dev);
    
    ```
    
2. **Cấu hình tài nguyên phần cứng:**
    - Yêu cầu và ánh xạ các tài nguyên cần thiết như:
        - **I/O ports**: Để giao tiếp với thiết bị.
        - **IRQ (Interrupt Request)**: Để xử lý ngắt từ thiết bị.
        - **DMA (Direct Memory Access)**: Để truyền dữ liệu giữa thiết bị và bộ nhớ.
3. **Đăng ký xử lý ngắt:**
    - NIC (Network Interface Card) thường tạo ra ngắt khi nhận gói tin hoặc hoàn thành truyền gói tin. Driver cần đăng ký một **Interrupt Handler** để xử lý các sự kiện này.
    
    ```c
    int ret = request_irq(dev->irq, my_interrupt_handler, 0, dev->name, dev);
    if (ret) {
        printk(KERN_ERR "Failed to request IRQ\\n");
        return ret;
    }
    
    ```
    
4. **Bật phần cứng:**
    - Bật NIC và chuẩn bị cho việc gửi/nhận gói tin.
    - Nếu cần, thiết lập các thanh ghi đặc biệt trong thiết bị để kích hoạt ngắt.
5. **Cấu hình chế độ nhận:**
    - Cấu hình chế độ nhận dữ liệu như unicast, multicast, hoặc promiscuous.
6. **Bắt đầu hàng đợi truyền tải (transmit queue):**
    - Gọi hàm `netif_start_queue(dev)` để bắt đầu xử lý các gói tin truyền đi.

### **Ví dụ**

```c
int my_ndo_open(struct net_device *dev) {
    struct my_private_data *priv = netdev_priv(dev);

    // Bật phần cứng NIC
    hardware_enable(dev);

    // Đăng ký xử lý ngắt
    int ret = request_irq(dev->irq, my_interrupt_handler, 0, dev->name, dev);
    if (ret) {
        printk(KERN_ERR "Failed to request IRQ\\n");
        return ret;
    }

    // Cấu hình chế độ nhận
    configure_rx_mode(dev);

    // Bắt đầu hàng đợi truyền tải
    netif_start_queue(dev);

    return 0;  // Trả về 0 nếu thành công
}

```

---

### **2. `ndo_stop()`: Đóng giao diện mạng**

### **Mục đích**

- Hàm `ndo_stop()` được kernel gọi khi giao diện mạng bị vô hiệu hóa (`ifconfig <name> down` hoặc `ip link set <name> down`).
- Hàm này thực hiện các tác vụ dọn dẹp và dừng hoạt động của thiết bị mạng.

### **Hoạt động cần thực hiện**

1. **Dừng hàng đợi truyền tải:**
    - Gọi `netif_stop_queue(dev)` để dừng việc xử lý các gói tin truyền đi.
2. **Tắt phần cứng:**
    - Vô hiệu hóa NIC và giải phóng bất kỳ tài nguyên nào đã được yêu cầu trong `ndo_open()`.
3. **Giải phóng tài nguyên:**
    - Giải phóng các tài nguyên đã yêu cầu trước đó, chẳng hạn như:
        - **Ngắt (IRQ):**
            
            ```c
            free_irq(dev->irq, dev);
            
            ```
            
4. **Xóa cấu hình chế độ nhận:**
    - Dừng các chế độ nhận dữ liệu (multicast, promiscuous, ...).

### **Ví dụ**

```c
int my_ndo_stop(struct net_device *dev) {
    struct my_private_data *priv = netdev_priv(dev);

    // Dừng hàng đợi truyền tải
    netif_stop_queue(dev);

    // Tắt phần cứng NIC
    hardware_disable(dev);

    // Giải phóng xử lý ngắt
    free_irq(dev->irq, dev);

    return 0;  // Trả về 0 nếu thành công
}

```

---

### **3. Đăng ký xử lý ngắt**

NIC thường yêu cầu xử lý các sự kiện như:

- **Nhận gói tin:** Khi một gói tin đến.
- **Hoàn thành truyền gói tin:** Khi gói tin được truyền thành công.

### **Cách đăng ký xử lý ngắt**

1. **Trong hàm `ndo_open()` hoặc `probe()`:**
    - Sử dụng `request_irq()` để đăng ký xử lý ngắt.
2. **Trong hàm `ndo_stop()`:**
    - Sử dụng `free_irq()` để giải phóng ngắt.

### **Ví dụ về xử lý ngắt**

```c
irqreturn_t my_interrupt_handler(int irq, void *dev_id) {
    struct net_device *dev = dev_id;
    struct my_private_data *priv = netdev_priv(dev);

    // Xử lý sự kiện ngắt
    if (hardware_check_rx(dev)) {
        // Nhận gói tin
        handle_rx(dev);
    }

    if (hardware_check_tx(dev)) {
        // Xử lý hoàn thành truyền gói tin
        handle_tx(dev);
    }

    return IRQ_HANDLED;
}

```

---

### **4. Khi nào nên đăng ký ngắt?**

- **Trong hàm `probe()`:**
    - Nếu thiết bị cần ngắt ngay khi được nhận diện.
    - Ví dụ: Đăng ký ngắt và bật tắt bằng cách thiết lập thanh ghi trong `ndo_open()`/`ndo_stop()`.
- **Trong hàm `ndo_open()`:**
    - Nếu ngắt chỉ cần hoạt động khi giao diện mạng được kích hoạt (`ifconfig <name> up`).

---

### **5. Tóm tắt quy trình `ndo_open()` và `ndo_stop()`**

| **Hoạt động** | **`ndo_open()`** | **`ndo_stop()`** |
| --- | --- | --- |
| Truy xuất dữ liệu riêng tư | Truy xuất qua `netdev_priv()` | Không cần thực hiện thêm |
| Yêu cầu tài nguyên (IRQ, DMA, ..) | Yêu cầu và ánh xạ | Giải phóng tài nguyên |
| Bật/Tắt phần cứng | Bật phần cứng (enable) | Tắt phần cứng (disable) |
| Đăng ký/Xóa xử lý ngắt | Đăng ký qua `request_irq()` | Giải phóng qua `free_irq()` |
| Cấu hình chế độ nhận | Thiết lập chế độ nhận (multicast, ...) | Xóa chế độ nhận |
| Điều khiển hàng đợi truyền tải | Bắt đầu hàng đợi qua `netif_start_queue()` | Dừng hàng đợi qua `netif_stop_queue()` |

---

### **6. Tổng kết**

- **`ndo_open()`**:
    - Được gọi khi giao diện mạng được kích hoạt.
    - Thực hiện các tác vụ khởi tạo phần cứng, yêu cầu tài nguyên và bắt đầu xử lý truyền nhận gói tin.
- **`ndo_stop()`**:
    - Được gọi khi giao diện mạng bị vô hiệu hóa.
    - Dọn dẹp và giải phóng tài nguyên đã được sử dụng.
- **Đăng ký xử lý ngắt:**
    - Có thể được thực hiện trong `probe()` hoặc `ndo_open()`.
    - Phụ thuộc vào thiết kế của thiết bị và driver.

Nếu cần thêm ví dụ hoặc mở rộng chi tiết, bạn có thể yêu cầu!