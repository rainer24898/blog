---
title: User spcace và kernel space
author: rainer
date: 2024-12-15 1:26:00 +0300
categories: [Linux, C Advanced, Linux Programming]
tags: [Linux, C Advanced, Linux Programming]
math: true
mermaid: true
render_with_liquid: false
image: 
    # path: /assets/img/post/UsbEthernet/usbheader.jpg
---


# Tổng quan về User spcace và kernel space

Trong hệ điều hành Linux (và phần lớn các hệ điều hành nhân UNIX khác), không gian địa chỉ bộ nhớ được chia ra làm hai miền chính: **user space** (không gian người dùng) và **kernel space** (không gian nhân). Đây là mô hình bảo vệ và phân tách tài nguyên nhằm đảm bảo hệ thống hoạt động ổn định, an toàn và hiệu quả. Việc hiểu rõ hai khái niệm này rất quan trọng đối với việc phát triển phần mềm hệ thống, gỡ lỗi và vận hành hệ thống.

Hệ điều hành phải đảm bảo rằng các ứng dụng người dùng không thể trực tiếp can thiệp hay phá hoại vào tài nguyên cốt lõi của hệ thống (nhân hệ điều hành, thiết bị phần cứng, bộ nhớ hệ thống quan trọng, v.v.). Nhân (kernel) đóng vai trò là tầng lõi, kiểm soát truy cập phần cứng, quản lý bộ nhớ, lập lịch tiến trình, và cung cấp các dịch vụ cần thiết cho ứng dụng. Trong khi đó, các ứng dụng và tiến trình người dùng chạy ở một tầng "cao hơn", ít đặc quyền hơn, tách biệt với kernel, nhằm ngăn chặn lỗi hoặc hành vi ác ý từ ứng dụng làm ảnh hưởng đến toàn bộ hệ thống.

![](/assets/img/post/User_spcace_and_kernel_space/1.png)

### 1. Khái niệm về user space (không gian người dùng)

- **Đặc điểm**:
    - User space là môi trường trong đó các ứng dụng và tiến trình của người dùng hoạt động.
    - Chúng có quyền truy cập hạn chế vào tài nguyên hệ thống; không thể trực tiếp truy xuất vào vùng nhớ quan trọng của kernel hoặc thiết bị phần cứng.
    - Khi một chương trình người dùng cần thao tác tài nguyên (như đọc/ghi tệp, gửi gói mạng, phân bổ bộ nhớ hệ thống, thao tác thiết bị), nó phải thông qua system call để nhờ kernel thực thi.
- **Cách thức hoạt động**:
    - Khi chương trình khởi chạy, nó được nạp vào user space, mỗi tiến trình có không gian địa chỉ ảo riêng. Không gian địa chỉ này tách biệt giữa các tiến trình nhằm ngăn chặn chúng can thiệp vào nhau.
    - Mọi thao tác nhạy cảm (ví dụ: truy cập bộ nhớ nhân, điều khiển thiết bị, thay đổi ngữ cảnh ưu tiên tiến trình) đều bị chặn. Chỉ khi gọi system call, bộ vi xử lý mới chuyển từ chế độ user mode (chế độ người dùng) sang kernel mode (chế độ nhân) để nhân thay mặt thực hiện.
- **Lợi ích**:
    - Giúp bảo vệ tính ổn định của hệ thống: lỗi trong một ứng dụng (như truy cập vào vùng nhớ bất hợp lệ) sẽ chỉ làm sập tiến trình đó chứ không làm sập toàn bộ hệ thống.
    - Tạo ra một môi trường thuận lợi để phát triển ứng dụng mà không lo ứng dụng vô tình hay cố ý gây hư hại nghiêm trọng.

### 2. Khái niệm về kernel space (không gian nhân)

- **Đặc điểm**:
    - Kernel space là nơi chạy mã của nhân hệ điều hành. Nhân có toàn quyền truy cập và quản lý mọi tài nguyên: bộ nhớ vật lý, CPU, thiết bị I/O, hệ thống tập tin, và các tiến trình.
    - Nhân chạy ở chế độ đặc quyền (kernel mode) cho phép nó thực thi những lệnh mà user mode bị cấm. Ví dụ: thao tác trên các thanh ghi đặc biệt, truy cập trực tiếp vào bộ nhớ vật lý, hay chỉnh sửa bảng phân trang (page table) của CPU.
- **Cách thức hoạt động**:
    - Kernel chứa các mô-đun: trình điều khiển thiết bị (driver), trình quản lý bộ nhớ (memory manager), bộ lập lịch (scheduler), hệ thống tập tin (filesystem), và các phần tử cốt lõi khác.
    - Khi một tiến trình người dùng yêu cầu một hành động đòi hỏi đặc quyền, tiến trình sẽ thực hiện system call. CPU chuyển chế độ từ user mode sang kernel mode, nhảy tới mã trong kernel, thực hiện dịch vụ, rồi sau đó trả kết quả về user space.
    - Kernel phải đảm bảo an toàn và tránh lỗi trong code của chính nó, bởi vì một lỗi trong kernel space có thể dẫn đến crash toàn hệ thống (kernel panic).

### 3. Chuyển đổi giữa user space và kernel space

- **System call (lời gọi hệ thống)**:
    - Đây là cơ chế chính để ứng dụng trong user space "vượt" qua ranh giới, nhờ kernel thực hiện tác vụ.
    - Quá trình thực hiện system call thường thông qua một ngắt (interrupt) hoặc trap được CPU cung cấp. Khi đó:
        1. Ứng dụng chạy trong user mode thực hiện một lệnh đặc biệt (như `syscall` trong x86_64).
        2. CPU chuyển sang kernel mode, lưu ngữ cảnh hiện tại (register, stack pointer, instruction pointer) và nhảy vào địa chỉ handler của system call bên trong kernel.
        3. Kernel xử lý yêu cầu, tương tác với phần cứng hoặc hệ thống như cần.
        4. Kernel trả kết quả, khôi phục ngữ cảnh người dùng, và CPU trở lại user mode.
- **Khi xảy ra ngắt (Interrupt) hoặc ngoại lệ (Exception)**:
    - CPU chuyển quyền điều khiển từ user space sang kernel space để kernel xử lý tình huống, chẳng hạn:
        - Thiết bị ngoại vi gửi tín hiệu ngắt báo có dữ liệu mới.
        - Chương trình gặp lỗi chia cho 0, lỗi trang bộ nhớ, v.v. (Exceptions)
    - Kernel xử lý ngắt, nếu cần thiết cập nhật trạng thái hệ thống, sau đó trở lại user mode.

### 4. Tóm lược lợi ích của mô hình phân chia này

- **Bảo mật và ổn định**: Ngăn chặn ứng dụng không đặc quyền tác động trực tiếp đến hệ thống.
- **Quản lý tài nguyên hiệu quả**: Kernel có cái nhìn tổng thể về toàn bộ tài nguyên, phân phối và điều tiết tài nguyên cho các tiến trình, trong khi tiến trình chỉ thực thi trong không gian riêng, tránh xung đột.
- **Cách ly lỗi**: Lỗi ở tầng user space không gây sụp đổ toàn bộ hệ thống.

### 5. Kết luận

User space và kernel space là hai không gian bộ nhớ phân tách trong Linux, với những đặc quyền và giới hạn khác nhau. Kernel space vận hành ở mức ưu tiên cao, có quyền truy cập không giới hạn để quản lý toàn bộ hệ thống, trong khi user space là nơi các ứng dụng và tiến trình của người dùng chạy trong môi trường bị hạn chế và được kiểm soát. Cơ chế này giúp đảm bảo tính ổn định, bảo mật và hiệu năng của hệ điều hành.

# Mô tả tương tác giữa thiết bị phần cứng, nhân hệ điều hành và ứng dụng người dùng

Trong chuỗi tương tác giữa thiết bị phần cứng, nhân hệ điều hành và ứng dụng người dùng, ta có thể hình dung đường đi của dữ liệu và lệnh từ “device driver” (trình điều khiển thiết bị) trong kernel space đến user space theo các tầng như sau:

### 1. Thiết bị phần cứng (Hardware)

- Thiết bị phần cứng (ví dụ: ổ cứng, card mạng, bàn phím, chuột, card âm thanh, card đồ họa, v.v.) không thể trực tiếp giao tiếp với chương trình người dùng.
- Chúng chỉ hiểu được các tín hiệu điện, tập lệnh và giao thức ở mức rất thấp.
- Để ứng dụng người dùng có thể thao tác thiết bị một cách tiện lợi, cần có một lớp trung gian là device driver ở kernel space.

### 2. Device Driver (Trình điều khiển thiết bị) trong Kernel Space

- Device driver là một loại mã (module) chạy trong kernel space và có quyền truy cập đặc quyền.
- Driver đóng vai trò cầu nối giữa thiết bị phần cứng và nhân hệ điều hành (kernel), đồng thời cung cấp một giao diện (interface) chuẩn, trừu tượng để tầng trên (kernel subsystem) hoặc user space thao tác.
- Khi ứng dụng trong user space muốn đọc dữ liệu từ thiết bị (ví dụ đọc dữ liệu từ card mạng, hay đọc khối dữ liệu từ ổ đĩa), chúng không thể trực tiếp thao tác lên phần cứng. Thay vào đó, chúng gọi các hàm hệ thống (system call) như `read()`, `write()`, `ioctl()`.
- Lời gọi hệ thống này sẽ chuyển quyền điều khiển từ user space sang kernel space. Tại đây, kernel sẽ định tuyến yêu cầu đến device driver tương ứng.
    
    **Ví dụ**:
    
    - Khi bạn đọc một tệp trên ổ cứng (user space gọi `read()` trên file descriptor), kernel sẽ chuyển yêu cầu này đến tầng quản lý hệ thống tập tin (trong kernel), hệ thống tập tin lại tương tác với driver của ổ đĩa. Driver sẽ gửi lệnh xuống phần cứng, nhận dữ liệu, và sau đó kernel chuyển dữ liệu này ngược lên user space.

### 3. Kernel (Nhân hệ điều hành) ở Kernel Space

- Kernel không chỉ quản lý thiết bị thông qua driver mà còn cung cấp các cơ chế như cấp phát bộ nhớ, lập lịch tiến trình, quản lý tập tin, quản lý mạng, v.v.
- Với driver đã “trừu tượng hóa” việc tương tác phần cứng, kernel sử dụng các giao diện thống nhất để xử lý I/O, định tuyến yêu cầu I/O từ ứng dụng đến driver.
- Kernel cũng chịu trách nhiệm kiểm soát truy cập, bảo mật, phân quyền, đảm bảo rằng chỉ có các driver đã được tin cậy mới có thể thao tác trực tiếp lên thiết bị.
- Mỗi device driver thường được “đăng ký” (register) với kernel, cung cấp cho kernel thông tin về loại thiết bị, điểm gắn (node) trong `/dev/`, phương thức đọc ghi. Khi ứng dụng truy cập vào “file thiết bị” (device file) trong `/dev/`, kernel sẽ gọi đến driver phù hợp mà nó đã biết.

### 4. User Space (Không gian người dùng)

- Các ứng dụng của người dùng chạy trong user space - môi trường bị hạn chế quyền, không trực tiếp can thiệp vào phần cứng.
- Nếu muốn tương tác với thiết bị, ứng dụng sẽ:
    1. Mở “tệp thiết bị” tương ứng (thường nằm trong `/dev/`), ví dụ: `/dev/sda` cho ổ cứng, `/dev/ttyS0` cho cổng nối tiếp, `/dev/dsp` cho thiết bị âm thanh...
    2. Gọi system call như `open()`, `read()`, `write()`, `ioctl()`.
- Các system call này khiến CPU chuyển từ user mode sang kernel mode, nhân xử lý yêu cầu, gọi hàm driver tương ứng trong kernel space.
- Sau khi driver xử lý xong, dữ liệu hoặc kết quả sẽ được kernel trả về cho ứng dụng trong user space.

### Chuỗi luân chuyển thông tin tổng quát

**Ứng dụng (User Space)**

→ gọi hàm I/O (system call như `read()`)

→ CPU chuyển sang **Kernel mode**

→ **Kernel** định tuyến yêu cầu đến **Device Driver** tương ứng trong Kernel space

→ **Device Driver** thực hiện giao tiếp trực tiếp với **Phần cứng**

→ Nhận dữ liệu từ thiết bị hoặc ghi dữ liệu xuống thiết bị

→ Trả kết quả về Kernel

→ Kernel trả dữ liệu lại cho **User Space**.

Tóm lại, theo khía cạnh device driver → kernel → user space, device driver nằm ở tầng kernel, làm cầu nối giữa phần cứng và kernel. Kernel quản lý và điều phối yêu cầu từ ứng dụng trong user space. Ứng dụng chỉ tương tác gián tiếp với thiết bị thông qua kernel (system call), thay vì truy cập thẳng vào phần cứng. Điều này đảm bảo hệ thống hoạt động an toàn, ổn định, và tiện lợi cho việc phát triển ứng dụng.