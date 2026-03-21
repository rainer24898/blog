---
title: Memory layout
author: rainer
date: "2024-12-15T01:26:00+03:00"
categories: [C, C Advanced, Linux]
tags: [C, C Advanced, Linux]
math: true
mermaid: true
render_with_liquid: false
---

# Memory layout


Trên Linux, mỗi tiến trình (process) được cấp phát không gian địa chỉ ảo riêng, thường là ảo 32-bit hoặc 64-bit tùy vào kiến trúc. Bố cục bộ nhớ (memory layout) của một tiến trình trên Linux tuân theo một cấu trúc phân vùng và sắp xếp tương đối nhất quán. Để hiểu rõ hơn, ta nên xem xét các thành phần chính trong layout bộ nhớ, trật tự sắp xếp, cũng như cơ chế ánh xạ giữa bộ nhớ ảo và bộ nhớ vật lý thông qua quản lý của kernel và MMU (Memory Management Unit).

**1. Không gian địa chỉ ảo và phân vùng cơ bản**
Mỗi tiến trình trên Linux thường có một không gian địa chỉ ảo riêng. Không gian địa chỉ ảo này giúp cách ly tiến trình, hạn chế việc một tiến trình tác động trực tiếp lên bộ nhớ của tiến trình khác. Thông thường, trên hệ thống 32-bit, tiến trình có không gian địa chỉ ảo 4GB, trong đó 3GB (hoặc tuỳ cấu hình) dùng cho vùng user space và 1GB còn lại dành cho kernel space. Trên hệ thống 64-bit, không gian địa chỉ ảo rộng hơn rất nhiều (thường là hàng terabyte đến petabyte), nhưng nguyên tắc chung vẫn tương tự.

**2. Các phân vùng bộ nhớ cơ bản trong tiến trình**
Không gian địa chỉ ảo của một tiến trình được chia thành các vùng chính:

- **Text Segment (Code Segment):**
Đây là vùng chứa mã lệnh thực thi của chương trình. Phân vùng này thường có quyền truy cập read và execute (r-x), không được ghi (no write). Nó thường nằm ở địa chỉ thấp trong không gian nhớ ảo.
Vùng text này là bất biến trong thời gian chạy (trừ trường hợp đặc biệt như JIT compile), giúp tối ưu như chia sẻ giữa nhiều tiến trình cùng chạy chung một chương trình (nhưng vẫn đảm bảo tách biệt không gian địa chỉ).
- **Data Segment (Initialized Data + Uninitialized Data - BSS):**
Ngay phía sau vùng text là vùng data. Vùng này chứa các biến toàn cục hoặc biến static được khởi tạo (initialized data) và vùng BSS (Block Started by Symbol), chứa các biến toàn cục hoặc static chưa khởi tạo (tự động được gán giá trị 0 khi bắt đầu). Vùng data thường có quyền đọc/ghi (r/w) vì giá trị trong đó có thể thay đổi trong thời gian chạy.
- **Heap:**
Sau vùng data là heap – vùng nhớ dùng cho cấp phát động (dynamic allocation) thông qua các hàm như `malloc`, `calloc`, `realloc` trong C hoặc new/delete trong C++. Heap có thể "mở rộng" lên trên (tăng địa chỉ) khi chương trình yêu cầu nhiều bộ nhớ động hơn. Kernel sẽ cấp thêm trang bộ nhớ khi cần (thông qua system calls như `brk` hoặc `sbrk`).
- **Mmap Region & Shared Libraries:**
Sau khi heap mở rộng, chúng ta có thể có vùng memory mapping, bao gồm phân vùng ánh xạ file, shared libraries (thư viện chia sẻ như [libc.so](http://libc.so/)), vùng dành cho shared memory, cũng như các file mmap() khác. Các thư viện dùng chung thường được load vào các vùng địa chỉ cố định (ASLR – Address Space Layout Randomization có thể ảnh hưởng vị trí) để tránh xung đột, cũng như tăng cường bảo mật.
- **Stack:**
Ở phía trên cùng (các địa chỉ cao) của không gian địa chỉ tiến trình, ta có stack. Stack tăng xuống dưới (địa chỉ giảm dần khi thêm frame), nó chứa biến cục bộ, địa chỉ trả về hàm, và các thông tin về context khi gọi hàm. Stack là vùng nhớ LIFO (Last-In-First-Out), tự động được quản lý khi vào/ra hàm, và có giới hạn kích thước (thường vài MB hoặc tuỳ vào ulimit).

**3. Trật tự sắp xếp (ví dụ trên hệ thống 32-bit)**
Một hình dung đơn giản (địa chỉ tăng từ dưới lên trên):

```
+-----------------+  <- High Addresses (Vùng nhớ cao)
|   Kernel Space  |  <- Bộ nhớ dành cho kernel (không truy cập được từ user mode)
+-----------------+
|   Stack         |  <- Tăng dần từ địa chỉ cao xuống thấp (LIFO - Last In, First Out)
+-----------------+
|   Memory-mapped |  <- Dùng cho file hoặc thư viện được ánh xạ vào bộ nhớ
|   Region        |
+-----------------+
|   Heap          |  <- Tăng dần từ địa chỉ thấp lên cao (Dynamic memory allocation)
+-----------------+
|   BSS Segment   |  <- Biến toàn cục chưa khởi tạo (Uninitialized global/static variables)
|   Data Segment  |  <- Biến toàn cục đã khởi tạo (Initialized global/static variables)
+-----------------+
|   Text Segment  |  <- Chứa mã chương trình (Executable code - Read-Only)
+-----------------+  <- Low Addresses (Vùng nhớ thấp)

```

**4. Address Space Layout Randomization (ASLR)**
ASLR là một cơ chế bảo mật trên Linux (và nhiều hệ điều hành hiện đại) nhằm thay đổi ngẫu nhiên vị trí của các segment như stack, heap, và vị trí load thư viện chia sẻ mỗi khi chạy chương trình. Điều này gây khó khăn cho việc tấn công dựa trên việc đoán trước vị trí mã lệnh hay dữ liệu trong bộ nhớ.

**5. Cấp phát trang bộ nhớ và quản lý bởi Kernel**
Hệ thống Linux sử dụng phân trang (paging) để quản lý bộ nhớ. Không gian địa chỉ ảo được chia thành các trang (thường 4KB mỗi trang). Kernel sẽ ánh xạ (mapping) các trang ảo sang trang vật lý khi cần. Nếu tiến trình truy cập vào một trang chưa được ánh xạ (page fault), kernel sẽ xử lý, cấp phát và ánh xạ trang vật lý thích hợp. Đây là cơ chế "lười" (lazy allocation), giúp tránh lãng phí bộ nhớ thật bằng cách chỉ cấp phát khi thật sự cần thiết.

**6. Kết hợp với các hệ thống con khác**

- **Thư viện động (Dynamic libraries):** Khi tiến trình khởi động, dynamic linker/loader (`ld-linux.so`) sẽ tải các thư viện chia sẻ vào vùng nhớ mmap.
- **Vùng dành cho kernel:** Tiến trình không thể trực tiếp truy cập vùng kernel space, nhưng kernel space vẫn nằm trong không gian địa chỉ ảo của tiến trình để tiện lợi cho việc chuyển đổi giữa user mode và kernel mode. Tuy nhiên, mọi nỗ lực đọc/ghi trực tiếp từ tiến trình vào vùng này sẽ bị lỗi do không có quyền.

**7. Tóm tắt**
Memory layout trên Linux khá linh hoạt nhưng tuân theo một mô hình chuẩn:

- Dưới cùng: Text, Data, BSS – chứa code và dữ liệu tĩnh.
- Tiếp đến: Heap, có thể mở rộng linh hoạt lên trên.
- Giữa không gian: Các vùng mmap cho file, thư viện dùng chung.
- Trên cùng: Stack, mở rộng ngược xuống.

Cấu trúc này kết hợp với các kỹ thuật như ASLR, phân trang, và quản lý tài nguyên bởi kernel giúp hệ thống Linux vừa an toàn, vừa linh hoạt, vừa hiệu quả trong việc quản lý bộ nhớ cho các tiến trình.

**8. Memory Layout trong Multi-Process và Multi-Thread**

**Multi-Process (Nhiều Tiến Trình)**

```
                 USER SPACE / VIRTUAL MEMORY

   Process 1                    Process 2                    Process 3
+---------------+          +---------------+          +---------------+
| User Stack    |          | User Stack    |          | User Stack    |
| mmap/libs     |          | mmap/libs     |          | mmap/libs     |
| Heap          |          | Heap          |          | Heap          |
| BSS/Data      |          | BSS/Data      |          | BSS/Data      |
| Text          |          | Text          |          | Text          |
+---------------+          +---------------+          +---------------+
        |                          |                          |
        | syscall / interrupt      | syscall / interrupt      | syscall / interrupt
        v                          v                          v

                 SHARED KERNEL CODE / KERNEL SUBSYSTEMS

+------------------------------------------------------------------+
| Kernel text/code (shared)                                        |
| Scheduler, VFS, MM, Network stack, Drivers, Syscall handlers...  |
+------------------------------------------------------------------+

        |                          |                          |
        v                          v                          v

              PER-TASK / PER-PROCESS KERNEL EXECUTION CONTEXT

+----------------------+   +----------------------+   +----------------------+
| task_struct of P1    |   | task_struct of P2    |   | task_struct of P3    |
| kernel stack of P1   |   | kernel stack of P2   |   | kernel stack of P3   |
| saved registers      |   | saved registers      |   | saved registers      |
| scheduling state     |   | scheduling state     |   | scheduling state     |
| mm_struct            |   | mm_struct            |   | mm_struct            |
+----------------------+   +----------------------+   +----------------------+

```

- **Mỗi tiến trình có không gian địa chỉ ảo riêng:**
Khi chạy nhiều tiến trình, mỗi tiến trình đều có bộ memory layout độc lập. Điều này có nghĩa là:
    - Mỗi tiến trình có riêng phân vùng text (code segment), data segment (bao gồm initialized data, BSS), heap, stack và các vùng mmap.
    - Không gian địa chỉ của tiến trình A hoàn toàn tách biệt với tiến trình B. Một biến global trong tiến trình A không thể bị truy cập hay thay đổi trực tiếp từ tiến trình B.
- **Cách hoạt động fork():**
Lệnh `fork()` trong Linux tạo ra một tiến trình con (child process) gần như là bản sao của tiến trình cha (parent). Sau `fork()`:
    - Child process có cùng code, data segment và heap lúc ban đầu như parent, nhưng thực chất sử dụng cơ chế copy-on-write.
    - Copy-on-write: Chừng nào cha và con chưa ghi vào trang nhớ dùng chung, chúng vẫn trỏ tới cùng vùng memory (đọc chung), chỉ khi một trong hai tiến trình ghi dữ liệu thì kernel mới tạo bản sao riêng cho tiến trình đó. Điều này giúp tiết kiệm tài nguyên.
- **Mở rộng heap, thay đổi vùng mmap:**
Mỗi tiến trình tự quản lý heap của nó (thông qua sbrk/malloc) mà không ảnh hưởng đến heap của tiến trình khác. Tương tự, việc mmap file, load thư viện chia sẻ trong từng tiến trình cũng không ảnh hưởng đến tiến trình khác vì chúng không chia sẻ không gian địa chỉ.
- **Cách thức giao tiếp giữa các tiến trình:**
Nếu muốn trao đổi dữ liệu, các tiến trình phải dùng cơ chế liên tiến trình (IPC) như pipe, socket, shared memory segments (SVID IPC, mmap với MAP\_SHARED), message queue... Khi sử dụng shared memory (một đoạn bộ nhớ được map chung), các tiến trình có thể chia sẻ một vùng địa chỉ chung, nhưng mặc định họ vẫn có không gian địa chỉ tách biệt.

**Kernel code dùng chung, nhưng context thực thi là riêng**

>Cần tách rõ 2 ý:
---
A. Kernel code là dùng chung
Ví dụ:
- syscall handler
- scheduler
- memory manager
- driver
- network stack
Đều là mã kernel chung cho toàn hệ thống.
Tức là **Process 1** và **Process 2** khi gọi các hàm như:
- `read()`
- `write()`
- `ioctl()`
- `recvmsg()`
thì đều đi vào **cùng một bộ mã kernel**.
---
B. Nhưng context thực thi trong kernel là riêng
Mỗi process hoặc mỗi thread có:

- kernel stack riêng
- saved register context riêng
- `task_struct` riêng
- trạng thái scheduling riêng
- thông tin memory mapping riêng
Nên dù cùng chạy chung kernel code, kernel vẫn biết:

- ai đang chạy
- syscall này thuộc process nào
- user stack nào tương ứng
- file descriptor table nào dùng
- không gian địa chỉ nào đang active

**Tóm lại, trong môi trường multi-process:** Mỗi tiến trình có một memory layout độc lập. Code, dữ liệu, heap, stack không bị trộn lẫn. Bộ nhớ chỉ có thể được chia sẻ thông qua các cơ chế do kernel cung cấp (shared memory, IPC).

**Multi-Thread (Nhiều Luồng trong cùng một Tiến Trình)**

```
----------------- High Addresses -----------------
|    Kernel Space                                 |
--------------------------------------------------
|    Stack của Thread 2                           |
--------------------------------------------------
|    Stack của Thread 1                           |
--------------------------------------------------
|    Memory mapped region                        |
--------------------------------------------------
|    Heap                                         |
--------------------------------------------------
|    BSS, Data                                    |
--------------------------------------------------
|    Text                                         |
--------------------------------------------------
```

- **Chung không gian địa chỉ:**
Trong multi-threading, nhiều luồng (threads) cùng tồn tại bên trong một tiến trình. Tất cả các luồng trong cùng một tiến trình chia sẻ cùng một không gian địa chỉ ảo. Điều này có nghĩa là:
    - Mọi luồng đều thấy cùng code segment, data segment, heap, và các vùng mmap.
    - Nếu luồng A thay đổi một biến global, luồng B cũng thấy sự thay đổi đó ngay lập tức, vì cả hai cùng truy cập cùng một vùng nhớ.
- **Stack riêng cho mỗi luồng:**
Tuy cùng chia sẻ heap, data, code, nhưng mỗi luồng có **stack riêng**. Stack là vùng không gian bộ nhớ dành cho các biến cục bộ, địa chỉ trở về của hàm, khung stack (stack frame). Khi tạo ra một luồng mới, kernel sẽ cấp cho luồng đó một stack riêng nằm đâu đó trong vùng địa chỉ ảo của tiến trình.
- **Quản lý heap và dữ liệu dùng chung:**
Vì các luồng dùng chung heap, nên việc cấp phát động phải an toàn khi đa luồng. Thư viện cấp phát bộ nhớ (malloc, new) phải được thiết kế thread-safe. Tương tự, các biến toàn cục cũng cần có cơ chế đồng bộ (mutex, spinlock…) nếu nhiều luồng cùng ghi/đọc.

**Tóm lại, trong multi-thread:** Tất cả luồng trong cùng một tiến trình chia sẻ một memory layout chung cho code, data, heap và mmap region. Mỗi luồng chỉ tách biệt ở stack riêng. Việc chia sẻ hoàn toàn không gian địa chỉ giúp luồng giao tiếp cực kỳ nhanh, nhưng cũng đòi hỏi phải đồng bộ chặt chẽ để tránh lỗi cạnh tranh (race condition).

**So sánh Multi-Process và Multi-Thread trong ngữ cảnh Memory Layout**

- Multi-process:
    - Mỗi tiến trình có memory layout độc lập (toàn bộ code, data, heap, stack riêng).
    - Giao tiếp giữa các tiến trình đòi hỏi cơ chế IPC.
    - Tách biệt rõ ràng, dễ cô lập lỗi hơn (một tiến trình crash ít ảnh hưởng trực tiếp đến bộ nhớ của tiến trình khác).
- Multi-thread:
    - Nhiều luồng trong cùng một tiến trình chia sẻ hầu như toàn bộ không gian địa chỉ (ngoại trừ stack).
    - Giao tiếp giữa các luồng nhanh và dễ dàng hơn do chung không gian địa chỉ.
    - Dễ gặp vấn đề đồng bộ, cạnh tranh dữ liệu, vì thay đổi của một luồng có thể ảnh hưởng ngay lập tức đến luồng khác.

**Kết luận:**
Trong môi trường Linux, memory layout cho nhiều tiến trình (multi-process) đảm bảo tính cô lập bằng cách cung cấp không gian địa chỉ ảo riêng cho mỗi tiến trình, trong khi nhiều luồng (multi-thread) trong cùng một tiến trình lại chia sẻ cùng một không gian địa chỉ, chỉ phân tách ở mức stack. Sự khác biệt về memory layout này dẫn đến khác biệt về mô hình lập trình, hiệu suất, khả năng cô lập, và sự phức tạp trong việc đồng bộ dữ liệu.
