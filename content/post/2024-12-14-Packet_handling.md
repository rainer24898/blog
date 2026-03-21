---
title: Packet handling
author: rainer
date: 2024-12-15 1:26:00 +0300
categories: [Linux, Networking, Linux Driver]
tags: [Networking, Linux Driver, Linux]
math: true
mermaid: true
render_with_liquid: false
image: 
    # path: /assets/img/post/UsbEthernet/usbheader.jpg
---

### **Xử lý gói tin trong Network Interface Driver**

Việc xử lý gói tin (packet handling) là nhiệm vụ chính của bất kỳ **driver giao diện mạng (NIC driver)** nào. Nó bao gồm hai phần chính:

- **Transmission (Truyền tải gói tin):** Gửi các gói tin đi ra mạng.
- **Reception (Nhận gói tin):** Nhận các gói tin từ mạng vào.

Trong Linux, có hai phương pháp chính để thực hiện trao đổi dữ liệu mạng:

1. **Interrupt-driven (dựa trên ngắt):** Kernel đợi thiết bị gửi tín hiệu qua IRQ (Interrupt Request) khi có sự kiện.
2. **Polling-driven (dựa trên thăm dò):** Kernel kiểm tra trạng thái thiết bị ở các khoảng thời gian cố định.

---

### **1. Phương pháp Interrupt-Driven**

### **Cách hoạt động**

- Kernel đợi thiết bị mạng báo hiệu một sự kiện qua **IRQ** (Interrupt Request).
- Khi nhận được IRQ, kernel sẽ gọi trình xử lý ngắt (**Interrupt Handler**) trong driver để xử lý sự kiện, ví dụ:
    - Nhận gói tin (Packet Reception).
    - Hoàn thành truyền tải (Packet Transmission Complete).

### **Ưu điểm**

- Hiệu quả hơn khi lưu lượng mạng thấp vì kernel không cần liên tục kiểm tra trạng thái thiết bị.
- Giảm thiểu tải trên CPU trong điều kiện mạng bình thường.

### **Nhược điểm**

- Trong điều kiện lưu lượng cao, ngắt có thể xảy ra liên tục, dẫn đến **interrupt storm** (quá tải ngắt), gây ra tải lớn trên CPU và làm giảm hiệu suất hệ thống.

---

### **2. Phương pháp Polling-Driven**

### **Cách hoạt động**

- Kernel không đợi tín hiệu từ IRQ mà kiểm tra trạng thái của thiết bị ở các khoảng thời gian cố định (ví dụ: kiểm tra xem thiết bị có gói tin mới hay không).
- Thường được thực hiện thông qua **timer** hoặc vòng lặp kiểm tra.

### **Ưu điểm**

- Tránh được tình trạng quá tải ngắt khi lưu lượng mạng cao.
- Dễ kiểm soát hơn trong các hệ thống mạng có lưu lượng lớn.

### **Nhược điểm**

- Tăng tải trên CPU trong điều kiện lưu lượng thấp, vì kernel phải liên tục kiểm tra thiết bị ngay cả khi không có dữ liệu.

---

### **3. NAPI (New API): Kết hợp cả hai phương pháp**

### **Giới thiệu NAPI**

- **NAPI (New API)** là một cơ chế trong kernel Linux để kết hợp cả **interrupt-driven** và **polling-driven**.
- Hoạt động của NAPI:
    - Sử dụng **interrupt-driven** khi lưu lượng mạng thấp.
    - Chuyển sang **polling-driven** khi lưu lượng mạng cao, giúp giảm tải trên CPU do quá nhiều ngắt.

### **Cách NAPI hoạt động**

1. Khi có một sự kiện (ví dụ: nhận gói tin), thiết bị tạo ngắt (IRQ), driver xử lý ngắt và kích hoạt chế độ polling.
2. Trong chế độ polling:
    - Driver đọc tất cả các gói tin từ thiết bị mà không tạo thêm ngắt.
    - Sau khi xử lý xong hàng đợi gói tin, driver chuyển lại sang chế độ interrupt-driven.

### **Ưu điểm của NAPI**

- Hiệu suất cao hơn trong điều kiện mạng có lưu lượng lớn.
- Giảm tình trạng quá tải ngắt (interrupt storm).
- Tối ưu hóa cả lưu lượng thấp và cao.

### **Ví dụ về NAPI trong NIC Driver**

```c
static int my_poll(struct napi_struct *napi, int budget) {
    int work_done = 0;

    // Xử lý gói tin từ thiết bị
    while (work_done < budget && has_more_packets()) {
        process_packet();
        work_done++;
    }

    // Nếu xử lý xong hàng đợi, chuyển lại sang interrupt-driven
    if (work_done < budget) {
        napi_complete(napi);
        enable_irq();
    }

    return work_done;
}

```

---

### **4. Tập trung vào phương pháp Interrupt-Driven**

Mặc dù NAPI rất hiệu quả, ở đây chúng ta tập trung vào phương pháp **interrupt-driven**.

### **Quy trình xử lý gói tin trong interrupt-driven**

1. **Truyền tải gói tin (Packet Transmission):**
    - Gói tin cần truyền được đặt trong bộ đệm truyền tải (transmit buffer).
    - Driver gửi gói tin ra thiết bị và yêu cầu thiết bị truyền đi.
    - Khi thiết bị hoàn thành việc truyền tải, nó tạo ngắt để thông báo driver.
2. **Nhận gói tin (Packet Reception):**
    - Khi một gói tin đến, thiết bị lưu nó trong bộ đệm nhận (receive buffer).
    - Thiết bị tạo ngắt để báo hiệu driver rằng có gói tin mới.
    - Driver xử lý ngắt, đọc gói tin từ bộ đệm nhận, và chuyển gói tin lên kernel.

### **Trình tự xử lý ngắt**

- Khi nhận ngắt từ thiết bị:
    1. Kiểm tra loại ngắt (truyền tải hoặc nhận gói tin).
    2. Gọi hàm xử lý tương ứng:
        - **Nhận gói tin:** Đọc gói tin từ bộ đệm nhận và đẩy lên tầng mạng.
        - **Truyền tải:** Cập nhật trạng thái gói tin đã truyền và giải phóng tài nguyên.

---

### **5. Ví dụ xử lý gói tin trong interrupt-driven**

### **a. Truyền tải gói tin**

Hàm `ndo_start_xmit()` được gọi khi kernel muốn gửi một gói tin ra ngoài. Sau đó, driver xử lý và truyền gói tin qua phần cứng.

### **Ví dụ:**

```c
netdev_tx_t my_ndo_start_xmit(struct sk_buff *skb, struct net_device *dev) {
    struct my_private_data *priv = netdev_priv(dev);

    // Đặt gói tin vào bộ đệm truyền tải
    enqueue_transmit_buffer(dev, skb->data, skb->len);

    // Gửi gói tin qua phần cứng
    hardware_transmit(dev);

    // Giải phóng sk_buff
    dev_kfree_skb(skb);

    return NETDEV_TX_OK;
}

```

---

### **b. Nhận gói tin**

Hàm xử lý ngắt nhận gói tin (`handle_rx_interrupt`) sẽ đọc dữ liệu từ phần cứng, chuyển gói tin vào `struct sk_buff` và gửi lên tầng mạng kernel.

### **Ví dụ:**

```c
irqreturn_t my_interrupt_handler(int irq, void *dev_id) {
    struct net_device *dev = dev_id;

    if (check_rx_interrupt(dev)) {
        struct sk_buff *skb = netdev_alloc_skb(dev, RX_BUFFER_SIZE);
        if (!skb) {
            printk(KERN_ERR "Failed to allocate sk_buff\\n");
            return IRQ_NONE;
        }

        // Sao chép dữ liệu từ phần cứng vào sk_buff
        copy_from_hardware(skb->data, RX_BUFFER_SIZE);

        // Chuyển gói tin lên tầng mạng
        skb->protocol = eth_type_trans(skb, dev);
        netif_rx(skb);
    }

    return IRQ_HANDLED;
}

```

---

### **6. Tổng kết**

| **Phương pháp** | **Ưu điểm** | **Nhược điểm** |
| --- | --- | --- |
| **Interrupt-Driven** | Hiệu quả khi lưu lượng thấp | Có thể gây quá tải ngắt khi lưu lượng cao |
| **Polling-Driven** | Kiểm soát tốt trong lưu lượng cao | Gây lãng phí CPU khi lưu lượng thấp |
| **NAPI (Kết hợp)** | Tối ưu hóa cho cả lưu lượng thấp và cao | Yêu cầu thiết bị và driver hỗ trợ NAPI |

Việc chọn phương pháp phù hợp phụ thuộc vào khả năng phần cứng và yêu cầu hệ thống. Các driver hiện đại nên sử dụng **NAPI** nếu phần cứng hỗ trợ để đạt hiệu suất tối ưu. Trong trường hợp sử dụng phương pháp **interrupt-driven**, cần đảm bảo xử lý ngắt hiệu quả và tránh tình trạng **interrupt storm**.