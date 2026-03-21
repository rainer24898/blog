---
title: IPC Message Queue
author: rainer
date: 2023-07-25 1:26:00 +0300
categories: [Linux, Linux Programming, IPC]
tags: [Linux, Linux Programming, IPC]
math: true
mermaid: true
render_with_liquid: false
image:
    path: /assets/img/post/MessageQueue/title.png
---

# 1. Giới thiệu.

## 1.1. Message Queue là gì ?

Message Queue (Hàng đợi Message) là một cơ chế giao tiếp giữa các tiến trình (processes) hoặc các luồng (thread), được sử dụng rộng rãi trong lập trình hệ thống nhúng và hệ điều hành như Linux. Một Message Queue là một danh sách liên kết ( link-list ) các message được duy trì bởi kernel.

Tất cả các process có thể trao đổi dữ liệu thông qua việc truy cập vào cùng một queues.

![](/assets/img/post/MessageQueue/1.png) 

![](/assets/img/post/MessageQueue/2.png)

Mỗi một khối dữ liệu được truyền đi được xác định một kiểu (TYPE với `System V`, Message Priority với `POSIX` ) cụ thể và người nhận có thể nhận được các dữ liệu đó tùy theo kiểu của dữ liệu. Trong nhiều trường hợp sử dụng, điều này đem lại nhiều hiệu quả hơn thay vì phải nhận dữ liệu theo cách FIFO như cách sử dụng các pipe (đường ống).

![](/assets/img/post/MessageQueue/3.png)

Message Queue có phần tử giới hạn và kích thước giới hạn, có thể set được kích thước cho nó. Bản chất của Message Queue sẽ có 2 trường là: Type và Message:
- Type: Đây là một số nguyên dương đại diện cho kiểu của Message. Type cho phép các quá trình (processes) hoặc luồng (thread) nhận Message dựa trên kiểu, thay vì chỉ dựa trên thứ tự của Message trong Message Queue. Điều này cung cấp một cấp độ linh hoạt hơn trong việc xử lý Message.
- Message: Đây là nội dung của Message. Nó có thể là một khối dữ liệu có kích thước tùy ý, và có thể bao gồm bất kỳ thông tin gì mà quá trình gửi muốn truyền đi.

## 1.2. Các kiểu chính để triển khai Message Queue.

Có 2 kiểu chính để triển khai Message Queue:
- System V IPC: Đây là mô hình IPC (Inter-Process Communication) truyền thống được giới thiệu trong phiên bản System V của Unix. Nó hỗ trợ Message Queues, Semaphores, và Shared Memory. Message Queues trong System V IPC được truy cập thông qua các hàm như msgget(), msgsnd(), msgrcv(), và msgctl(). System V IPC Message Queues có thể được quản lý một cách hiệu quả và trực tiếp, nhưng chúng có một số hạn chế, như số lượng Message và kích thước Message tối đa.
- POSIX IPC: Đây là mô hình IPC mới hơn, được chuẩn hóa bởi POSIX (Portable Operating System Interface). Nó cũng hỗ trợ Message Queues, Semaphores, và Shared Memory, nhưng với một API khác nhau. Message Queues trong POSIX IPC được truy cập thông qua các hàm như mq_open(), mq_send(), mq_receive(), và mq_close(). POSIX IPC Message Queues có một số ưu điểm so với System V IPC, bao gồm khả năng cấu hình kích thước Message và số lượng Message tối đa, và hỗ trợ cho thông báo khi có Message mới.

Khác biệt:
- POSIX cung cấp một số tính năng thông báo cho hàng đợi Message mà (mq_notify()) Sys V không có 
- System V là mô hình IPC truyền thống và đã được triển khai rộng rãi trên hầu hết các hệ điều hành Unix-like. Do đó, nó thường được hỗ trợ đầy đủ trên hầu hết các nền tảng.
- API POSIX đơn giản hơn và dễ sử dụng hơn.

>Trong bài viết này sẽ chỉ đề cập đến POSIX.

# 2. POSIX Message Queues.

## 2.1. Các bước triển khai POSIX Message Queues.

Các bước triển khai:
- Tạo message queue hoặc mở một message queue có sẵn.
- Ghi dữ liệu vào message queue.
- Đọc dữ liệu từ message queue.
- Đóng message queue khi không sử dụng.
- Giải phóng message queue.

## 2.2. Opening a message queue

Trước tiên để có thể sử dụng POSIX Message Queues cần phải khai báo thư viện:

```
#include <mqueue.h>         // Thư viện Linux POSIX Message Queues
#include <fcntl.h>          // Thư viện cung cấp các cờ (O_RDONLY,...)
```
Để tạo mới hoặc mở một message queues đã tồn tại chúng ta sử dụng mq_open() với cấu trúc:

```
mqd_t mq_open(const char *name, int oflag, mode_t mode, struct mq_attr *attr);
```
![](/assets/img/post/MessageQueue/4.png)

Các thành phần bao gồm:
- name: Đây là con trỏ đến chuỗi ký tự kết thúc bằng `NULL` chỉ định tên của Message Queue. Tên này phải bắt đầu bằng ký tự slash (`/`) và không chứa bất kỳ ký tự slash nào khác.
- oflag: Đây là các cờ mô tả cách mở Message Queue. Cờ này là một hoặc nhiều giá trị `O_RDONLY, O_WRONLY, O_RDWR` (chỉ định quyền đọc và/hoặc viết), `O_CREAT` (tạo Message Queue nếu nó không tồn tại), `O_EXCL` (lỗi nếu cố gắng tạo Message Queue đã tồn tại và `O_CREAT` cũng được chỉ định), `O_NONBLOCK` (thiết lập chế độ không chặn cho Message Queue).
- mode: Nếu `O_CREAT` được chỉ định trong oflag, mode xác định quyền truy cập cho Message Queue mới (tương tự như quyền truy cập cho các tệp trong Linux, ví dụ: 0644 cho quyền đọc và viết cho chủ sở hữu, và chỉ đọc cho người dùng khác).
- attr: Nếu `O_CREAT` được chỉ định trong oflag, attr trỏ đến một cấu trúc mq_attr mô tả thuộc tính của Message Queue mới. Nếu attr là `NULL`, Message Queue sẽ được tạo với các thuộc tính mặc định.

![](/assets/img/post/MessageQueue/5.png)

Hàm mq_open() trả về một descriptor (kiểu mqd_t) đại diện cho Message Queue đã mở hoặc tạo. Descriptor này sau đó có thể được sử dụng với các hàm khác như mq_send(), mq_receive(), và mq_close(). Nếu có lỗi xảy ra, hàm mq_open() trả về -1 và thiết lập errno để chỉ ra lỗi cụ thể.

## 2.3. Sending message

Để ghi dữ liệu vào message queue chúng ta sử dụng mq_send(). Nó có prototype như sau:

```
int mq_send(mqd_t mqdes, const char *msg_ptr, size_t msg_len, unsigned int msg_prio);
```

![](/assets/img/post/MessageQueue/6.png)

Các thành phần của hàm này bao gồm:
- mqdes: Đây là một descriptor cho Message Queue mà bạn muốn gửi Message. Descriptor này thường được trả về bởi hàm mq_open().
- msg_ptr: Đây là con trỏ đến dữ liệu mà bạn muốn gửi. Dữ liệu này được sao chép vào Message Queue, vì vậy bạn không cần giữ lại bản sao sau khi gọi mq_send().
- msg_len: Đây là kích thước, tính bằng byte, của dữ liệu mà bạn muốn gửi. Kích thước này không nên vượt quá giá trị mq_msgsize của Message Queue, mà là kích thước tối đa của một Message.
- msg_prio: Đây là mức độ ưu tiên của Message. Message với mức độ ưu tiên cao hơn sẽ được nhận trước Message với mức độ ưu tiên thấp hơn. Trong trường hợp các Message có cùng mức độ ưu tiên, chúng sẽ được nhận theo thứ tự FIFO (First-In-First-Out).

Hàm mq_send() trả về 0 nếu thành công, và -1 nếu có lỗi xảy ra. Trong trường hợp lỗi, errno sẽ được thiết lập để chỉ ra lỗi cụ thể.

## 2.4. Receving message

Đọc dữ liệu từ message queue chúng ta sử dụng mq_receive(). Nó có prototype như sau:

```
ssize_t mq_receive(mqd_t mqdes, char *msg_ptr, size_t msg_len, unsigned int *msg_prio);
```

![](/assets/img/post/MessageQueue/7.png)

Các thành phần của hàm này bao gồm:
- mqdes: Đây là một descriptor cho Message Queue mà bạn muốn nhận Message từ. Descriptor này thường được trả về bởi hàm mq_open().
- msg_ptr: Đây là con trỏ đến một vùng nhớ mà Message sẽ được sao chép vào. Bạn cần phải đảm bảo rằng vùng nhớ này đủ lớn để chứa Message. Kích thước Message tối đa có thể được lấy từ thuộc tính mq_msgsize của Message Queue.
- msg_len: Đây là kích thước, tính bằng byte, của vùng nhớ mà msg_ptr trỏ đến. Giá trị này phải lớn hơn hoặc bằng mq_msgsize của Message Queue.
- msg_prio: Nếu msg_prio không phải là NULL, hàm mq_receive() sẽ sao chép mức độ ưu tiên của Message đã nhận vào biến mà msg_prio trỏ đến.

Hàm mq_receive() trả về số byte trong Message nhận được nếu thành công, và -1 nếu có lỗi xảy ra. Trong trường hợp lỗi, errno sẽ được thiết lập để chỉ ra lỗi cụ thể.

## 2.5. Clossing a message queue

Để đóng message queue khi không còn sử dụng ta sử sử dụng mq_close(). Nó có prototype như sau:

```
int mq_close(mqd_t mqdes);
```
![](/assets/img/post/MessageQueue/8.png)

- mqdes: Đây là một descriptor cho Message Queue mà bạn muốn đóng. Descriptor này thường được trả về bởi hàm mq_open()

Hàm mq_close() trả về 0 nếu thành công, và -1 nếu có lỗi xảy ra. Trong trường hợp lỗi, errno sẽ được thiết lập để chỉ ra lỗi cụ thể.

Hàm mq_close() chỉ đóng kết nối của quá trình hiện tại với Message Queue, giải phóng tài nguyên liên quan đến descriptor của Message Queue trong quá trình đó. Tuy nhiên, Message trong Message Queue và thông tin về Message Queue (như tên, thuộc tính) vẫn được giữ lại. Sau khi gọi mq_close(), descriptor mqdes không thể được sử dụng nữa cho đến khi lại mở Message Queue bằng mq_open()

>Lưu ý rằng: mq_close() chỉ đóng Message Queue đối với quá trình hiện tại, và không xóa Message Queue khỏi hệ thống. Nếu một tiến trình khác sau đó mở Message Queue bằng cách sử dụng mq_open(), nó sẽ có thể truy cập vào Message đang tồn tại trong Message Queue.

Để xóa Message Queue, bạn cần sử dụng hàm mq_unlink().

## 2.6. Remove a message queue

Để xóa message queue khi không còn sử dụng ta sử sử dụng mq_ unlink(). Nó có prototype như sau:

```
int mq_unlink(const char *name);
```
- name: Đây là con trỏ đến chuỗi ký tự kết thúc bằng null chỉ định tên của Message Queue. Tên này phải bắt đầu bằng ký tự slash (/) và không chứa bất kỳ ký tự slash nào khác.

Khi mq_unlink() được gọi, nó sẽ đánh dấu Message Queue để xóa. Message Queue sẽ không được xóa ngay lập tức nếu vẫn còn quá trình nào đang mở nó; thay vào đó, nó sẽ được xóa sau khi tất cả các quá trình đã đóng nó bằng mq_close(). Sau khi đã được unlink, Message Queue không thể được mở lại, và tất cả các Message còn lại trong nó sẽ bị mất.

Hàm mq_unlink() trả về 0 nếu thành công, và -1 nếu có lỗi xảy ra. Trong trường hợp lỗi, errno sẽ được thiết lập để chỉ ra lỗi cụ thể.

# 3. Cơ chế của Message Priority (TYPE)

Mức độ ưu tiên của Message (message priority) là một khái niệm quan trọng trong cơ chế hoạt động của Message Queues, đặc biệt là trong POSIX Message Queues.

Mức độ ưu tiên của một Message là một số nguyên không âm mà hệ thống sử dụng để xác định thứ tự mà Message được lấy ra khỏi hàng đợi. Message với mức độ ưu tiên cao hơn sẽ được nhận trước Message với mức độ ưu tiên thấp hơn. Trong trường hợp có nhiều Message có cùng mức độ ưu tiên, chúng sẽ được nhận theo thứ tự FIFO (First-In-First-Out).

Điều này giúp kiểm soát thứ tự xử lý Message trong các tình huống mà một số Message quan trọng hơn các Message khác. Ví dụ, trong một hệ thống xử lý sự kiện, sự kiện quan trọng hoặc khẩn cấp có thể được gán mức độ ưu tiên cao hơn để chúng được xử lý trước.

Cơ chế hoạt động của message priority (TYPE) như sau:
- Khi một Message được gửi vào Message Queue bằng hàm mq_send(), người gửi có thể chỉ định một mức độ ưu tiên cho Message đó.
- Hệ thống sau đó sẽ xếp Message trong Message Queue dựa trên mức độ ưu tiên: Message với mức độ ưu tiên cao hơn sẽ được xếp trước Message với mức độ ưu tiên thấp hơn.
- Khi một tiến trình hay một luồng gọi hàm mq_receive() để nhận Message từ Message Queue, hệ thống sẽ trả về Message với mức độ ưu tiên cao nhất. Nếu có nhiều Message có cùng mức độ ưu tiên, hệ thống sẽ trả về Message nào được gửi trước.

### Lấy 1 ví dụ về message priority (TYPE):

Giả sử cho 1 Message Queues lưu trữ được tối đa 8 Message.

>Đầu tiên gửi 1 Message có priority là 3:

| null | null | null | null | null | null | null | 3   |


>Tiếp theo gửi 1 Message có priority là 8:

| null | null | null | null | null | null | 8   | 3   |


>Tiếp theo gửi 1 Message có priority là 1:

| null | null | null | null | null | 8   | 3   | 1   |


>Tiếp theo tiếp tục gửi 1 Message có priority là 1 ( để phân biệt ta ký hiệu priority này là  `1`):

| null | null | null | null | 8   | 3   | `1` | 1   |


>Tiếp theo gửi 1 Message có priority là 5:

| null | null | null | 8   | 5   | 3   | `1` | 1   |


### Trong bối cảnh POSIX Message Queues:

Các cách để 1 tiến trình chỉ nhận Message thuộc về nó:
- Sử dụng một Message Queue riêng biệt cho mỗi tiến trình. Bằng cách này, mỗi tiến trình sẽ chỉ gửi và nhận Message từ Message Queue của nó, và do đó, không cần phải lo lắng về việc xử lý Message không thuộc về nó.
- Gửi bao gồm thông tin về tiến trình mà Message thuộc về trong chính Messagen đó. Ví dụ, bạn có thể định nghĩa cấu trúc Message bao gồm ID tiến trình và dữ liệu Message. Khi một tiến trình nhận một Message, nó sẽ kiểm tra ID tiến trình trong Message, và chỉ xử lý Message nếu ID tiến trình phù hợp.

Đầu tiên, chúng ta định nghĩa cấu trúc Message:

```
struct message {
    long process_id;     // ID của tiến trình
    char data[100];      // Dữ liệu Message
};

```

Khi một tiến trình gửi một Message, nó sẽ bao gồm ID của nó trong Message:

```
struct message msg;
msg.process_id = getpid();  // Sử dụng ID của tiến trình hiện tại
strcpy(msg.data, "Hello, world!");

mqd_t mqdes = mq_open("/my_queue", O_WRONLY);
mq_send(mqdes, (char*)&msg, sizeof(msg), 0);
mq_close(mqdes);
```

Khi một tiến trình nhận một Message, nó sẽ kiểm tra ID tiến trình trong Message, và chỉ xử lý Message nếu ID tiến trình phù hợp:

```
mqd_t mqdes = mq_open("/my_queue", O_RDONLY);
struct message msg;

while (1) {
    mq_receive(mqdes, (char*)&msg, sizeof(msg), NULL);

    // Chỉ xử lý Message nếu ID tiến trình phù hợp
    if (msg.process_id == getpid()) {
        printf("Received: %s\n", msg.data);
    }
}
mq_close(mqdes);
```

Hàm mq_receive() trong POSIX Message Queues, hệ thống sẽ trả về và `xóa` Message đầu tiên trong hàng đợi. 

>Vì vậy trong trường hợp: Sử dụng 1 Message Queues để liên hệ nhiều tiến trình, mỗi tiến trình chỉ nhận Message thuộc về nó và không làm ảnh hưởng đến các Message của tiến trình khác là không phù hợp trong bối cảnh `POSIX Message Queues`.

Để giải quyết bài toán này ta cần phải sử dụng System V.

### Trong bối cảnh System V Message Queues:

Trong System V IPC, mỗi Message có một trường "kiểu" (type) dùng để phân biệt giữa các loại Message. Dưới đây là một ví dụ về cách bạn có thể sử dụng trường kiểu Message này để chỉ định Message thuộc về một tiến trình cụ thể.

Đầu tiên, chúng ta định nghĩa cấu trúc Message:

```
struct message {
    long type;       // Kiểu Message
    char data[100];  // Dữ liệu Message
};
```

Khi một tiến trình gửi một Message, nó sẽ bao gồm kiểu Message (ví dụ, có thể là ID tiến trình):

```
int msgid = msgget(key, 0666 | IPC_CREAT);  // Tạo Message Queue

struct message msg;
msg.type = getpid();  // Sử dụng ID của tiến trình hiện tại làm kiểu Message
strcpy(msg.data, "Hello, world!");

msgsnd(msgid, &msg, sizeof(msg), 0);  // Gửi Message
```

Khi một tiến trình nhận một Message, nó sẽ chỉ định muốn nhận Message của một kiểu cụ thể:

```
int msgid = msgget(key, 0666 | IPC_CREAT);  // Truy cập Message Queue

struct message msg;

// Nhận Message với kiểu là ID của tiến trình hiện tại
msgrcv(msgid, &msg, sizeof(msg), getpid(), 0);

printf("Received: %s\n", msg.data);
```

Trong ví dụ trên, mỗi tiến trình sẽ chỉ nhận các Message có kiểu tương ứng với ID của nó. Như vậy, mỗi tiến trình chỉ nhận các Message thuộc về nó, mặc dù tất cả các tiến trình đều sử dụng cùng một Message Queue.

Nếu tiến trình kiểm tra và thấy Message không thuộc về nó (tức là, kiểu Message không phù hợp), thì Message đó sẽ vẫn ở trong hàng đợi. Nó không bị xóa khỏi hàng đợi, và có thể được nhận bởi một lời gọi msgrcv() sau từ chính tiến trình này hoặc một tiến trình khác.

Trong trường hợp không có tiến trình nào khác gọi msgrcv() để nhận Message đó, và nếu Message đó vẫn ở đầu hàng đợi, thì tiến trình gốc sẽ nhận lại cùng một Message khi nó gọi msgrcv() lần tiếp theo.

Trong System V IPC, nhiều tiến trình có thể gọi msgrcv() đồng thời để nhận Message từ cùng một Message Queue. Nếu hai tiến trình gọi msgrcv() đồng thời, chỉ một trong hai tiến trình sẽ nhận được một Message cụ thể. Nếu hai tiến trình đều chỉ định cùng một kiểu Message, thì chỉ một trong hai sẽ nhận được Message đầu tiên với kiểu đó, và tiến trình kia sẽ phải đợi cho đến khi có một Message khác với kiểu đó trong hàng đợi.

### Khi hàng đợi Message Queue đầy và vẫn có Message gửi tới:

Khi hàng đợi Message Queue đạt đến kích thước tối đa của nó và một tiến trình cố gắng gửi thêm một Message vào hàng đợi thì hành vi sẽ phụ thuộc vào cách tiến trình gửi Message:

- Nếu tiến trình gửi Message mà không chỉ định cờ O_NONBLOCK, thì lời gọi mq_send() hoặc msgsnd() sẽ chặn (block) và tiến trình sẽ chờ cho đến khi có không gian trống trong hàng đợi (tức là, cho đến khi một hoặc nhiều Message khác đã được nhận và xóa khỏi hàng đợi).
- Nếu tiến trình gửi Message và chỉ định cờ O_NONBLOCK, thì lời gọi mq_send() hoặc msgsnd() sẽ trả về ngay lập tức với một lỗi, và Message không được gửi. Lỗi này thường là EAGAIN hoặc một lỗi tương tự, chỉ ra rằng thao tác không thể hoàn thành ngay lập tức do hàng đợi đã đầy.

Trong cả hai trường hợp, Message mà tiến trình cố gắng gửi không bị mất và có thể thử gửi lại nó vào một thời điểm sau. Trong trường hợp như vậy, tiến trình thường sẽ cần phải xử lý lỗi và quyết định cách tiếp tục. Có một số cách tiếp cận khác nhau mà tiến trình có thể chọn:

-  Chờ một khoảng thời gian và thử gửi lại Message. Điều này có thể hoạt động nếu lỗi chỉ tạm thời (ví dụ, do hàng đợi tạm thời đầy).
-  Thông báo lỗi cho người dùng hoặc một thành phần khác của hệ thống. Điều này có thể hữu ích nếu lỗi nghiêm trọng hoặc không thể khắc phục.
-  Bỏ qua lỗi và tiếp tục thực hiện các hành động khác. Trong một số trường hợp, có thể không cần thiết phải gửi lại Message nếu việc gửi không thành công.



> wait update .... 