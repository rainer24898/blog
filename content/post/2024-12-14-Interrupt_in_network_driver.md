---
title: Cơ chế ngắt và cách hoạt động trong driver mạng (NIC driver)
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

### **Cơ chế ngắt và cách hoạt động trong driver mạng (NIC driver)**

Cơ chế **ngắt (Interrupt)** là một phần quan trọng trong việc giao tiếp giữa phần cứng và hệ điều hành. Trong trường hợp của NIC driver, ngắt được sử dụng để xử lý các sự kiện xảy ra trong thiết bị mạng, chẳng hạn như:

- **Nhận gói tin**: Khi một gói tin đến từ mạng và cần được xử lý.
- **Hoàn thành truyền gói tin**: Khi một gói tin được truyền thành công ra ngoài mạng.
- **Lỗi phần cứng**: Khi có sự cố trong thiết bị, ví dụ bộ đệm (buffer) đầy hoặc lỗi giao tiếp.

Dưới đây là phân tích chi tiết cơ chế ngắt và cách hoạt động trong Linux kernel đối với NIC driver.

---

### **1. Cơ chế ngắt (Interrupt Mechanism)**

### **a. Ngắt là gì?**

- **Ngắt** là một tín hiệu từ phần cứng đến CPU để báo rằng một sự kiện cần được xử lý ngay lập tức.
- Khi xảy ra ngắt:
    1. CPU tạm dừng thực hiện chương trình hiện tại.
    2. Chuyển đến một **trình xử lý ngắt (Interrupt Handler)** để xử lý sự kiện.
    3. Sau khi xử lý xong, CPU quay trở lại công việc ban đầu.

### **b. Loại ngắt liên quan đến NIC**

- **Hardware Interrupt (Ngắt phần cứng)**:
    - Được tạo bởi thiết bị mạng khi xảy ra các sự kiện như nhận gói tin hoặc hoàn thành truyền tải.
- **SoftIRQ (Soft Interrupt):**
    - Một loại ngắt mềm do kernel Linux sử dụng để xử lý các tác vụ mạng nhẹ hơn, chẳng hạn như xử lý gói tin ở tầng cao hơn.

---

### **2. Quy trình hoạt động của ngắt trong NIC**

### **a. Đăng ký ngắt**

Driver cần **đăng ký trình xử lý ngắt (Interrupt Handler)** với kernel bằng cách sử dụng hàm **`request_irq()`**.

### **Cú pháp của `request_irq()`**:

```c
int request_irq(unsigned int irq, irq_handler_t handler, unsigned long flags,
                const char *name, void *dev);

```

- **Tham số:**
    - `irq`: Số hiệu ngắt (IRQ number) được gán cho NIC.
    - `handler`: Hàm xử lý ngắt (Interrupt Handler).
    - `flags`: Cờ (Flags) xác định kiểu ngắt (thường là `0` hoặc `IRQF_SHARED` nếu chia sẻ ngắt với các thiết bị khác).
    - `name`: Tên của thiết bị để hiển thị trong `/proc/interrupts`.
    - `dev`: Con trỏ dữ liệu riêng tư (Private Data) để nhận dạng thiết bị trong handler.

### **Ví dụ:**

```c
int ret = request_irq(dev->irq, my_interrupt_handler, IRQF_SHARED, dev->name, dev);
if (ret) {
    printk(KERN_ERR "Failed to request IRQ %d\\n", dev->irq);
    return ret;
}

```

---

### **b. Trình xử lý ngắt (Interrupt Handler)**

### **Cách hoạt động:**

1. Khi thiết bị tạo ngắt, kernel sẽ gọi `my_interrupt_handler()`.
2. Trình xử lý kiểm tra loại sự kiện gây ra ngắt (nhận gói tin, hoàn thành truyền tải, hoặc lỗi).
3. Xử lý sự kiện tương ứng (ví dụ: chuyển gói tin nhận được vào hàng đợi).
4. Báo hiệu cho thiết bị phần cứng rằng ngắt đã được xử lý.

### **Cú pháp của trình xử lý ngắt:**

```c
irqreturn_t my_interrupt_handler(int irq, void *dev_id);

```

- **Tham số:**
    - `irq`: Số hiệu ngắt xảy ra.
    - `dev_id`: Con trỏ đến thiết bị liên quan (truyền từ `request_irq()`).
- **Kết quả trả về:**
    - `IRQ_HANDLED`: Ngắt đã được xử lý.
    - `IRQ_NONE`: Ngắt không phải do thiết bị này gây ra.

### **Ví dụ:**

```c
irqreturn_t my_interrupt_handler(int irq, void *dev_id) {
    struct net_device *dev = dev_id;
    struct my_private_data *priv = netdev_priv(dev);

    // Kiểm tra ngắt là nhận gói tin hay hoàn thành truyền tải
    if (check_rx_interrupt(dev)) {
        handle_rx(dev);  // Xử lý nhận gói tin
    }

    if (check_tx_interrupt(dev)) {
        handle_tx(dev);  // Xử lý hoàn thành truyền gói tin
    }

    return IRQ_HANDLED;
}

```

---

### **c. Xử lý nhận gói tin (Packet Reception)**

1. **Kiểm tra bộ đệm nhận (Receive Buffer):**
    - Phần cứng NIC sẽ lưu gói tin vào bộ đệm nhận và tạo ngắt báo rằng có gói tin mới.
    - Driver kiểm tra bộ đệm và sao chép gói tin vào `struct sk_buff` để gửi lên tầng mạng.
2. **Chuyển gói tin lên kernel:**
    - Driver sử dụng hàm **`netif_rx()`** hoặc **`netif_rx_ni()`** để chuyển gói tin lên kernel.
    - Kernel sẽ xử lý tiếp tục qua các giao thức cao hơn (IP, TCP/UDP, ...).

### **Ví dụ xử lý nhận gói tin:**

```c
void handle_rx(struct net_device *dev) {
    struct sk_buff *skb = netdev_alloc_skb(dev, RX_BUFFER_SIZE);
    if (!skb) {
        printk(KERN_ERR "Failed to allocate sk_buff\\n");
        return;
    }

    // Sao chép dữ liệu từ phần cứng vào sk_buff
    copy_from_hardware(skb->data, RX_BUFFER_SIZE);

    // Chuyển gói tin lên kernel
    skb->protocol = eth_type_trans(skb, dev);
    netif_rx(skb);
}

```

---

### **d. Xử lý hoàn thành truyền tải (Packet Transmission)**

1. **Kiểm tra trạng thái truyền tải:**
    - Khi một gói tin được truyền thành công, NIC tạo ngắt báo rằng bộ đệm truyền tải đã trống.
2. **Giải phóng tài nguyên:**
    - Driver dọn dẹp các gói tin đã truyền xong, ví dụ: giải phóng bộ nhớ `sk_buff`.

### **Ví dụ xử lý hoàn thành truyền tải:**

```c
void handle_tx(struct net_device *dev) {
    struct my_private_data *priv = netdev_priv(dev);

    // Cập nhật trạng thái truyền tải
    priv->tx_packets++;
}

```

---

### **e. Giải phóng ngắt**

Khi driver không còn cần sử dụng ngắt (ví dụ: khi đóng giao diện mạng), driver phải giải phóng ngắt bằng **`free_irq()`**.

### **Ví dụ:**

```c
free_irq(dev->irq, dev);

```

---

### **3. SoftIRQ trong xử lý mạng**

- Linux kernel sử dụng SoftIRQ để giảm tải công việc từ trình xử lý ngắt (Interrupt Handler), cho phép xử lý công việc nặng hơn ở một ngữ cảnh thấp hơn.
- Khi nhận gói tin, trình xử lý ngắt thường chỉ đẩy gói tin vào hàng đợi và sau đó SoftIRQ (`NET_RX_SOFTIRQ`) sẽ xử lý tiếp tục.

---

### **4. Tóm tắt quy trình xử lý ngắt**

1. **Ngắt nhận gói tin:**
    - NIC lưu gói tin vào bộ đệm nhận.
    - Driver kiểm tra bộ đệm, sao chép dữ liệu vào `sk_buff`.
    - Gói tin được chuyển lên kernel qua `netif_rx()`.
2. **Ngắt hoàn thành truyền tải:**
    - NIC báo rằng gói tin đã được truyền thành công.
    - Driver giải phóng bộ đệm và cập nhật thống kê.
3. **Xử lý lỗi ngắt:**
    - Kiểm tra trạng thái thiết bị khi có lỗi, ví dụ: bộ đệm đầy hoặc lỗi phần cứng.
    - Reset hoặc tái cấu hình thiết bị nếu cần.
4. **Giải phóng ngắt:**
    - Khi giao diện mạng bị đóng hoặc driver bị gỡ, driver giải phóng tài nguyên ngắt bằng `free_irq()`.

---

### **5. Tổng kết**

Cơ chế ngắt trong NIC driver là một phần quan trọng để xử lý hiệu quả các sự kiện của thiết bị mạng. Trình xử lý ngắt cần được thiết kế để:

- **Nhanh chóng và gọn nhẹ:** Chỉ xử lý tối thiểu trong ngắt và đẩy công việc nặng hơn sang SoftIRQ.
- **An toàn:** Đảm bảo các tài nguyên được giải phóng chính xác khi đóng giao diện mạng.

Nếu bạn cần thêm ví dụ hoặc giải thích sâu hơn, hãy cho tôi biết!