---
title: Word size and instruction length
author: rainer
date: "2025-07-22T01:26:00+03:00"
categories: [Linux]
tags: [Linux]
math: true
mermaid: true
render_with_liquid: false
image: /blog/assets/img/post/Code_size_and_code_word/Best-CPU-for-Gaming.png

---


# Word size và instruction length của CPU: dễ nhầm ở đâu, khác nhau thế nào?
![Image 1](/blog/assets/img/post/Code_size_and_code_word/69271fa6-b3c0-4964-87f3-fa5f5a69976e.png)

> Một CPU 64-bit không có nghĩa mọi thứ bên trong nó đều “64-bit” theo cùng một cách.
> Và `word size` của CPU cũng không đồng nghĩa với độ dài của một lệnh máy.

Đây là hai khái niệm rất hay bị trộn lẫn khi mới học kiến trúc máy tính:

* **word size**: nói về **dữ liệu** mà CPU xử lý một cách tự nhiên nhất
* **instruction length** (nhiều nơi gọi không chặt là *code word*): nói về **độ dài lệnh máy**

Nếu phân biệt rõ hai khái niệm này, bạn sẽ hiểu tốt hơn về:

* thanh ghi và ALU
* alignment
* load/store dữ liệu
* instruction fetch / decode
* pipeline CPU
* khác biệt giữa RISC và CISC

---

## Nhìn nhanh trong 30 giây

### Word size là gì?

Là độ rộng dữ liệu mà CPU xử lý “tự nhiên” nhất.

Ví dụ:

* CPU 32-bit → thường xử lý tốt dữ liệu 32 bit
* CPU 64-bit → thường xử lý tốt dữ liệu 64 bit

Nó liên quan mạnh đến:

* độ rộng thanh ghi
* ALU
* kích thước dữ liệu load/store
* kích thước con trỏ trong nhiều ABI phổ biến

### Instruction length là gì?

Là độ dài của **lệnh máy** khi được lưu trong bộ nhớ chương trình.

Ví dụ:

* MIPS, RISC-V cơ bản: lệnh thường dài **32 bit cố định**
* x86/x64: lệnh có độ dài **biến đổi**

Nó liên quan mạnh đến:

* instruction fetch
* decode
* độ phức tạp của front-end CPU

### Điểm quan trọng nhất

> **Word size và instruction length có thể trùng nhau, nhưng không bắt buộc phải trùng nhau.**

---

## 1. Word size của CPU là gì?

### Định nghĩa dễ hiểu

`Word size` là độ rộng dữ liệu mà CPU xử lý hiệu quả và tự nhiên nhất trong:

* thanh ghi tổng quát
* ALU
* đường dữ liệu nội bộ

Nói ngắn gọn:

* CPU 16-bit → word size thường là 16 bit
* CPU 32-bit → word size thường là 32 bit
* CPU 64-bit → word size thường là 64 bit

### Một vài ví dụ quen thuộc

* **Intel 8086**: 16-bit
* **Intel 80386**: 32-bit
* **x86-64 hiện đại**: 64-bit
* **ARMv8-A**: 64-bit

---

## 2. Word size ảnh hưởng đến những gì?

## 2.1. Thanh ghi

Các thanh ghi tổng quát thường có độ rộng bằng hoặc tối ưu theo word size.

Ví dụ trên x86-64:

* `RAX`, `RBX`, `RCX`, `RDX` là thanh ghi 64 bit
* `EAX` là 32 bit thấp của `RAX`
* `AX` là 16 bit thấp
* `AL` là 8 bit thấp

Điều đó có nghĩa là CPU 64-bit xử lý phép toán 64-bit một cách tự nhiên hơn CPU 32-bit.

---

## 2.2. ALU

ALU (**Arithmetic Logic Unit**) là khối thực hiện các phép toán như:

* cộng
* trừ
* AND / OR / XOR
* SHIFT
* so sánh

Nếu CPU là 64-bit, ALU thường được tối ưu cho toán hạng 64-bit.
Nếu bạn xử lý dữ liệu nhỏ hơn như 8 bit hay 32 bit thì CPU vẫn làm được, nhưng độ rộng “tự nhiên” của nó vẫn là 64 bit.

---

## 2.3. Load/store dữ liệu

Word size cũng ảnh hưởng đến cách CPU đọc và ghi dữ liệu giữa thanh ghi với bộ nhớ.

Ví dụ:

* CPU 32-bit xử lý dữ liệu 4 byte rất tự nhiên
* CPU 64-bit xử lý dữ liệu 8 byte rất tự nhiên

Điều này không có nghĩa CPU chỉ đọc đúng từng đó byte, vì thực tế còn phụ thuộc vào cache line, bus, vi kiến trúc, vector unit..., nhưng ở mức khái niệm cơ bản thì đây là cách hiểu đúng.

---

## 2.4. Con trỏ và không gian địa chỉ

Trên nhiều hệ thống:

* môi trường 32-bit → con trỏ thường là 4 byte
* môi trường 64-bit → con trỏ thường là 8 byte

Tuy nhiên cần cực kỳ cẩn thận ở đây.

> **Word size không hoàn toàn đồng nghĩa với address width thực tế.**

Ví dụ trên x86-64:

* thanh ghi tổng quát rộng 64 bit
* nhưng địa chỉ ảo thực tế thường không dùng đủ toàn bộ 64 bit
* địa chỉ vật lý cũng có thể nhỏ hơn 64 bit

Vì vậy, khi viết kỹ thuật chặt chẽ, nên tách rõ:

* **register width**
* **ALU/data path width**
* **address width**

---

## 3. Register và memory layout: nhìn từ góc độ CPU

Sau khi hiểu `word size`, một câu hỏi rất tự nhiên là:

* dữ liệu đang nằm ở đâu?
* CPU lấy dữ liệu từ đâu để tính toán?
* vai trò của thanh ghi khác gì so với RAM?

Muốn trả lời, cần nhìn thêm hai thứ:

* **register layout**
* **memory layout**

---

## 3.1. Register là gì và vì sao nó quan trọng?

`Register` là vùng lưu trữ cực nhỏ nhưng cực nhanh nằm ngay trong CPU.

So với RAM:

* register nhanh hơn rất nhiều
* số lượng ít hơn rất nhiều
* được CPU dùng trực tiếp khi thực hiện phép toán

Khi ALU cộng hai số, toán hạng thường phải nằm trong register trước.
Vì vậy, một chương trình chạy nhanh hay chậm thường phụ thuộc rất nhiều vào việc dữ liệu có đang nằm trong register hay không.

---

## 3.2. Register layout thường gồm những gì?

Tùy kiến trúc, tên gọi sẽ khác nhau, nhưng nhìn chung CPU có các nhóm thanh ghi sau:

### a) General-purpose registers

Đây là các thanh ghi đa dụng, dùng để chứa:

* biến tạm
* toán hạng của phép toán
* địa chỉ
* giá trị trả về của hàm
* tham số truyền vào hàm

Ví dụ trên x86-64:

* `RAX`, `RBX`, `RCX`, `RDX`
* `RSI`, `RDI`
* `R8` đến `R15`

Ví dụ trên ARM64:

* `X0` đến `X30`

### b) Special registers

Đây là các thanh ghi có nhiệm vụ đặc biệt, ví dụ:

* **PC (Program Counter)**: trỏ tới lệnh đang hoặc sắp được thực thi
* **SP (Stack Pointer)**: trỏ tới đỉnh stack
* **FP/BP (Frame Pointer/Base Pointer)**: hỗ trợ truy cập biến cục bộ, tham số hàm, stack frame
* **FLAGS / STATUS REGISTER**: lưu các cờ như zero, carry, overflow, sign

### c) Floating-point / SIMD registers

Ngoài register số nguyên, CPU hiện đại còn có register riêng cho:

* số thực dấu chấm động
* vector instruction
* xử lý multimedia / AI / signal processing

Ví dụ:

* x86 có `XMM`, `YMM`, `ZMM`
* ARM có `V0`, `V1`, ...

---

## 3.3. Register layout liên quan gì đến word size?

Word size ảnh hưởng trực tiếp tới độ rộng “tự nhiên” của register.

Ví dụ với x86-64:

* `RAX` là 64 bit
* `EAX` là 32 bit thấp của `RAX`
* `AX` là 16 bit thấp
* `AL` là 8 bit thấp

Điều này cho thấy cùng một thanh ghi vật lý có thể được truy cập theo nhiều độ rộng khác nhau.

### Ý nghĩa thực tế

* CPU 64-bit xử lý toán hạng 64-bit tự nhiên hơn
* toán hạng nhỏ hơn vẫn dùng được
* compiler sẽ chọn kích thước register phù hợp với kiểu dữ liệu và ABI

---

## 3.4. Vì sao register quan trọng hơn RAM trong đường nóng hiệu năng?

RAM chậm hơn register rất nhiều.
Ngay cả cache cũng vẫn chậm hơn register.

Do đó CPU luôn cố gắng:

* giữ dữ liệu nóng trong register
* tránh load/store không cần thiết
* giảm số lần truy cập bộ nhớ

Đây là lý do các compiler tối ưu thường làm rất nhiều việc như:

* register allocation
* constant propagation
* common subexpression elimination
* loop optimization

Mục tiêu cuối cùng là giảm áp lực lên memory subsystem.

---

## 3.5. Memory layout là gì?

Nếu register là nơi CPU làm việc trực tiếp, thì **memory layout** là cách dữ liệu và mã chương trình được sắp xếp trong không gian bộ nhớ.

Ở mức đơn giản, một process thường có bố cục bộ nhớ kiểu như sau:

```text
Địa chỉ cao
+---------------------------+
|         Stack             |
|  local variables, frame   |
+---------------------------+
|           Mmap            |
| shared libs, mapped files |
+---------------------------+
|           Heap            |
|   malloc / calloc / new   |
+---------------------------+
|           BSS             |
| uninitialized global/stat |
+---------------------------+
|          Data             |
| initialized global/stat   |
+---------------------------+
|         Rodata            |
|   string literals, const  |
+---------------------------+
|           Text            |
|       machine code        |
+---------------------------+
Địa chỉ thấp
```

Lưu ý: đây là mô hình khái quát để học. Thực tế còn phụ thuộc vào:

* hệ điều hành
* ABI
* linker
* cơ chế ASLR
* loader
* vi kiến trúc và runtime

---

## 3.6. Ý nghĩa của từng vùng nhớ

### Text segment

Chứa mã lệnh máy của chương trình.

* thường chỉ đọc
* CPU fetch instruction từ đây
* instruction length liên quan trực tiếp đến cách CPU đọc lệnh trong vùng này

### Rodata

Chứa dữ liệu chỉ đọc, ví dụ:

* string literal
* bảng hằng số
* một số biến `const`

### Data

Chứa biến global/static đã khởi tạo giá trị.

Ví dụ:

```c
int g_count = 10;
static int ready = 1;
```

### BSS

Chứa biến global/static chưa khởi tạo hoặc mặc định bằng 0.

Ví dụ:

```c
int g_total;
static char buffer[1024];
```

### Heap

Chứa bộ nhớ cấp phát động:

* `malloc`
* `calloc`
* `realloc`
* `new`

Vùng này rất linh hoạt nhưng dễ phát sinh lỗi như:

* leak
* use-after-free
* double free
* heap corruption

### Stack

Chứa:

* local variables
* tham số hàm
* return address
* saved registers
* stack frame

Stack thường được quản lý rất nhanh, nhưng kích thước có giới hạn.

---

## 3.7. Register và memory layout gặp nhau ở đâu?

Một lệnh máy thường đi theo luồng tư duy như sau:

1. lấy lệnh từ **text segment**
2. decode để biết cần thao tác gì
3. load dữ liệu từ **stack**, **heap** hoặc **data segment** vào register
4. ALU xử lý dữ liệu trong register
5. ghi kết quả lại về register hoặc bộ nhớ

Nói cách khác:

* **instruction length** liên quan mạnh tới việc lấy lệnh từ vùng **text**
* **word size** liên quan mạnh tới việc xử lý dữ liệu sau khi dữ liệu đã được nạp vào register

Đây chính là cầu nối giữa phần “instruction” và phần “data” trong bài này.

---

## 3.8. Stack frame nhìn rất gần với register

Khi một hàm được gọi, CPU và ABI thường phối hợp để tạo ra một **stack frame**.

Một stack frame thường liên quan đến:

* return address
* saved frame pointer
* saved callee-saved registers
* local variables
* temporary spill slots

Ví dụ tư duy đơn giản:

```text
Hàm foo() được gọi
→ tham số được đặt vào register hoặc stack
→ SP giảm xuống để cấp chỗ cho local variable
→ một số register được save xuống stack
→ hàm chạy xong thì restore lại register và return
```

Điều này giải thích vì sao khi debug bằng GDB, ta thường thấy mối liên hệ rất chặt giữa:

* register
* stack pointer
* frame pointer
* biến cục bộ
* backtrace

---

## 3.9. Register layout và memory layout liên quan gì đến lập trình C?

Trong C, bạn thấy các khái niệm này hầu như mỗi ngày:

* biến local thường nằm trên stack
* biến global/static nằm ở data hoặc BSS
* chuỗi hằng thường nằm ở rodata
* vùng cấp phát bởi `malloc()` nằm trên heap
* toán hạng trước khi tính toán thường phải được đưa vào register

Ví dụ:

```c
int g = 5;

int add(int a, int b)
{
    int c = a + b;
    return c + g;
}
```

Khi biên dịch, chuyện gì thường xảy ra?

* mã lệnh của `add()` nằm ở **text**
* `g` nằm ở **data**
* `a`, `b` có thể được truyền qua register theo ABI
* `c` có thể nằm trong register hoặc stack tùy mức tối ưu
* kết quả cuối cùng thường trả về qua một register

Đây là lý do học register và memory layout sẽ giúp đọc assembly dễ hơn rất nhiều.

---

## 3.10. Kết luận ngắn cho phần này

Nếu phải nhớ ngắn gọn, có thể nhớ như sau:

* **register** là nơi CPU làm việc nhanh nhất
* **memory layout** là nơi chương trình và dữ liệu được đặt trong không gian nhớ
* CPU liên tục di chuyển dữ liệu giữa memory và register để thực thi lệnh
* hiểu register và memory layout sẽ giúp nối được ba mảng kiến thức rất quan trọng:

  * C language
  * assembly
  * operating system

---

## 4. Cache, TLB và virtual memory: CPU đi tới dữ liệu bằng cách nào?

Sau khi nhìn được **register** và **memory layout**, bước tiếp theo là hiểu một chuyện rất quan trọng:

> CPU gần như không muốn đụng tới RAM nếu không thật sự cần.

Lý do rất đơn giản:

* register rất nhanh
* cache chậm hơn register nhưng vẫn nhanh hơn RAM rất nhiều
* RAM chậm hơn rất nhiều so với tốc độ xử lý của CPU

Ngoài ra, chương trình hiện đại không truy cập trực tiếp địa chỉ vật lý theo kiểu “thấy đâu dùng đó”, mà thường đi qua cơ chế **virtual memory**. Trong quá trình này, **TLB** đóng vai trò tăng tốc việc dịch địa chỉ.

Ba khái niệm này liên kết chặt với nhau:

* **cache**: tăng tốc truy cập dữ liệu và lệnh
* **TLB**: tăng tốc dịch địa chỉ ảo → địa chỉ vật lý
* **virtual memory**: cho mỗi process một không gian địa chỉ ảo riêng

---

## 4.1. Vì sao CPU cần cache?

Khoảng cách tốc độ giữa CPU và RAM là rất lớn. Nếu mỗi lần cần dữ liệu CPU đều phải chờ RAM, pipeline sẽ bị đói dữ liệu liên tục.

Vì vậy người ta đặt các lớp bộ nhớ đệm nhỏ nhưng nhanh hơn ở gần CPU hơn, gọi là **cache**.

Có thể hình dung đơn giản:

* **register**: nhanh nhất, nhỏ nhất
* **L1 cache**: rất nhanh, rất nhỏ
* **L2 cache**: lớn hơn, chậm hơn L1
* **L3 cache**: còn lớn hơn nữa, thường dùng chung giữa nhiều core
* **RAM**: lớn nhưng chậm hơn nhiều

Đây chính là **memory hierarchy**.

---

## 4.2. Cache hoạt động theo ý tưởng nào?

Cache dựa rất nhiều vào hai tính chất của chương trình:

### a) Temporal locality

Nếu dữ liệu hoặc lệnh vừa được dùng gần đây, khả năng cao nó sẽ sớm được dùng lại.

Ví dụ:

```c
sum += a[i];
sum += a[i];
```

Hoặc trong vòng lặp, cùng một biến đếm được đọc lại rất nhiều lần.

### b) Spatial locality

Nếu một địa chỉ vừa được truy cập, các địa chỉ gần nó cũng có khả năng sớm được truy cập.

Ví dụ:

```c
for (int i = 0; i < n; i++)
    sum += a[i];
```

Khi đọc `a[i]`, rất có thể chương trình sẽ đọc tiếp `a[i+1]`, `a[i+2]`, ...

Đó là lý do cache không nạp từng byte rời rạc, mà thường nạp theo **cache line**.

---

## 4.3. Cache line là gì?

`Cache line` là đơn vị dữ liệu mà cache trao đổi với mức bộ nhớ thấp hơn.

Nói đơn giản:

* CPU không nhất thiết lấy đúng 1 byte hay đúng 4 byte từ RAM lên cache
* thay vào đó, nó thường lấy cả một khối liên tiếp, ví dụ 64 byte trên nhiều hệ thống hiện đại

Ý nghĩa:

* tận dụng spatial locality
* giảm số lần truy cập RAM
* tăng hiệu quả truy cập tuần tự

Nhưng cũng vì vậy mà có những hiện tượng như:

* **false sharing** giữa nhiều thread
* truy cập mảng không tuần tự gây mất locality
* cache miss làm chương trình chậm rõ rệt

---

## 4.4. Các mức cache thường gặp

### L1 cache

* gần core nhất
* nhanh nhất trong các mức cache
* dung lượng nhỏ nhất
* thường tách thành:

  * **L1I**: instruction cache
  * **L1D**: data cache

### L2 cache

* lớn hơn L1
* chậm hơn L1
* thường vẫn gắn khá gần từng core

### L3 cache

* lớn hơn nhiều
* chậm hơn L2
* trên nhiều CPU, đây là vùng cache dùng chung cho nhiều core

Mỗi lần CPU truy cập dữ liệu:

1. tìm trong register nếu có
2. không có thì tìm L1
3. miss thì tìm L2
4. tiếp tục miss thì tìm L3
5. cuối cùng mới ra RAM

Đây là lý do **cache miss** ảnh hưởng rất mạnh tới hiệu năng thực tế.

---

## 4.5. Instruction cache và data cache liên quan gì đến bài này?

Bài này đang phân biệt giữa:

* **instruction length**: chuyện của lệnh
* **word size**: chuyện của dữ liệu

Cache cũng tách ra khá đẹp theo đúng hai hướng đó:

### Instruction cache (L1I)

* lưu các lệnh máy vừa hoặc sắp được fetch
* liên quan mạnh tới **text segment**
* ảnh hưởng mạnh tới **fetch** và **decode**

### Data cache (L1D)

* lưu dữ liệu vừa hoặc sắp được load/store
* liên quan mạnh tới **stack**, **heap**, **data**, **BSS**
* ảnh hưởng mạnh tới **execute** và **memory stage**

Có thể nói ngắn gọn:

* **instruction length** gần gũi với **instruction cache**
* **word size** gần gũi với **data cache**

Dĩ nhiên đây là cách nhìn để học cho dễ hiểu; vi kiến trúc thực tế có thể phức tạp hơn nhiều.

---

## 4.6. Cache hit và cache miss

### Cache hit

Xảy ra khi dữ liệu hoặc lệnh cần truy cập đã có sẵn trong cache.

Khi đó:

* CPU lấy dữ liệu rất nhanh
* pipeline ít bị stall hơn
* hiệu năng tốt hơn

### Cache miss

Xảy ra khi cache không có dữ liệu hoặc lệnh cần dùng.

Khi đó CPU phải lấy tiếp từ mức thấp hơn:

* từ L1 xuống L2
* từ L2 xuống L3
* từ L3 xuống RAM

Càng xuống thấp, độ trễ càng lớn.

Đây là lý do hai đoạn code cùng độ phức tạp thuật toán nhưng truy cập bộ nhớ khác kiểu nhau có thể chạy nhanh chậm rất khác nhau.

---

## 4.7. Virtual memory là gì?

`Virtual memory` là cơ chế cho phép mỗi process nhìn thấy một **không gian địa chỉ ảo riêng**.

Điều này mang lại rất nhiều lợi ích:

* cách ly process với nhau
* bảo vệ bộ nhớ tốt hơn
* cho phép mỗi process nghĩ rằng nó có không gian địa chỉ riêng liên tục
* hỗ trợ paging, mapping file, shared library, copy-on-write, v.v.

Nói đơn giản:

* chương trình dùng **địa chỉ ảo**
* phần cứng + hệ điều hành sẽ ánh xạ nó sang **địa chỉ vật lý**

Vì vậy khi bạn thấy con trỏ trong C, giá trị con trỏ mà process đang dùng thường là địa chỉ trong **không gian ảo**, không phải địa chỉ vật lý RAM theo nghĩa trực tiếp.

---

## 4.8. Page là gì?

Virtual memory thường chia bộ nhớ thành các khối gọi là **page**.

Tương ứng phía vật lý cũng có các **page frame**.

Khi CPU truy cập một địa chỉ ảo:

1. tách địa chỉ thành:

   * **virtual page number**
   * **offset trong page**
2. tìm xem virtual page này ánh xạ tới physical frame nào
3. ghép lại thành địa chỉ vật lý
4. mới truy cập cache/RAM theo địa chỉ vật lý tương ứng

Kích thước page phổ biến thường là 4 KB trên nhiều hệ thống, nhưng thực tế còn có huge page, large page, v.v.

---

## 4.9. TLB là gì?

Nếu mỗi lần truy cập bộ nhớ mà CPU đều phải đi dò page table trong RAM, mọi thứ sẽ rất chậm.

Vì vậy CPU có một bộ nhớ đệm đặc biệt tên là **TLB** (**Translation Lookaside Buffer**).

TLB lưu cache cho các kết quả dịch địa chỉ gần đây, tức là lưu kiểu thông tin như:

* virtual page number này
* tương ứng với physical frame nào
* quyền truy cập ra sao

Nói dễ hiểu:

> **TLB là cache của việc dịch địa chỉ.**

Nếu cache là bộ đệm cho **dữ liệu/lệnh**, thì TLB là bộ đệm cho **ánh xạ địa chỉ**.

---

## 4.10. TLB hit và TLB miss

### TLB hit

CPU nhanh chóng tìm được ánh xạ từ địa chỉ ảo sang địa chỉ vật lý.

Khi đó việc truy cập bộ nhớ tiếp tục rất nhanh.

### TLB miss

CPU không tìm thấy ánh xạ trong TLB.

Khi đó CPU phải đi tra page table theo cơ chế của kiến trúc và hệ điều hành.

Việc này đắt hơn nhiều so với TLB hit.

Nếu page tương ứng còn không có trong RAM, có thể xảy ra **page fault**, lúc đó hệ điều hành phải can thiệp.

---

## 4.11. Page table và page fault

### Page table

Là cấu trúc dữ liệu do hệ điều hành quản lý, mô tả ánh xạ giữa:

* virtual page
* physical page frame

Ngoài ánh xạ, page table còn chứa thông tin như:

* trang có hợp lệ không
* quyền đọc/ghi/thực thi
* trang đã được truy cập chưa
* trang có bị dirty hay không

### Page fault

Xảy ra khi CPU truy cập một địa chỉ ảo mà hiện tại:

* chưa được mapping hợp lệ
* hoặc không có quyền truy cập phù hợp
* hoặc trang chưa nằm trong RAM

Khi đó CPU tạo exception để hệ điều hành xử lý.

Page fault có thể là:

* **hợp lệ**: ví dụ demand paging, copy-on-write
* **không hợp lệ**: ví dụ truy cập địa chỉ sai → có thể dẫn tới `segmentation fault`

---

## 4.12. Virtual memory liên quan thế nào đến memory layout của process?

Phần trên ta đã nói về:

* text
* rodata
* data
* BSS
* heap
* mmap
* stack

Thực chất các vùng này chính là các **vùng địa chỉ ảo** trong không gian của process.

Ví dụ:

* **text** thường được map là executable, read-only
* **rodata** thường là read-only
* **data/BSS** thường read-write
* **stack** thường read-write và có guard page
* **mmap** có thể dùng để map shared library, file, anonymous memory

Điều đó có nghĩa là memory layout mà ta nhìn thấy ở process level thực ra được xây trên nền của virtual memory.

---

## 4.13. Thứ tự một lần truy cập bộ nhớ diễn ra ra sao?

Ở mức đơn giản, có thể hình dung như sau:

1. CPU thực thi lệnh load/store
2. dùng địa chỉ ảo do chương trình tạo ra
3. tra **TLB** để xem dịch địa chỉ ra physical address thế nào
4. nếu TLB hit thì tiếp tục
5. kiểm tra **cache** xem dữ liệu đã có ở L1/L2/L3 chưa
6. nếu cache miss thì mới đi xuống RAM
7. dữ liệu quay ngược lên cache rồi vào register

Tức là:

* **TLB** giúp tìm đường tới đúng nơi
* **cache** giúp lấy dữ liệu nhanh hơn khi đã biết nơi cần tới

Đây là điểm rất quan trọng vì nhiều người mới học thường trộn lẫn TLB và cache thành một thứ.

---

## 4.14. Cache, TLB và word size có liên quan gì?

Chúng không phải là cùng một khái niệm, nhưng liên hệ rất chặt.

### Word size

Nói về:

* độ rộng dữ liệu CPU xử lý tự nhiên nhất
* thanh ghi, ALU, data path

### Cache

Nói về:

* tăng tốc truy cập lệnh và dữ liệu
* tận dụng locality
* giảm độ trễ so với RAM

### TLB

Nói về:

* tăng tốc dịch địa chỉ ảo → vật lý
* giảm chi phí page table walk

### Virtual memory

Nói về:

* tổ chức và bảo vệ không gian địa chỉ của process
* cách ly giữa các process
* nền tảng cho paging, mmap, shared library

Nhìn ngắn gọn:

* **word size** liên quan tới “CPU xử lý dữ liệu rộng bao nhiêu”
* **cache** liên quan tới “dữ liệu/lệnh có đang ở gần CPU không”
* **TLB** liên quan tới “CPU dịch địa chỉ nhanh hay chậm”
* **virtual memory** liên quan tới “process nhìn bộ nhớ như thế nào”

---

## 4.15. Vì sao phần này quan trọng với lập trình C và tối ưu hiệu năng?

Khi lập trình C/C++ hoặc debug hệ thống, các hiện tượng sau gần như đều dính đến cache, TLB hoặc virtual memory:

* quét mảng tuần tự nhanh hơn truy cập ngẫu nhiên
* cấu trúc dữ liệu phân mảnh làm cache locality kém
* quá nhiều page làm TLB miss tăng
* false sharing giữa các thread làm hiệu năng tụt mạnh
* page fault bất thường làm chương trình khựng hoặc crash
* truy cập `NULL` hay địa chỉ rác dẫn tới fault

Đây là lý do tại sao khi đi sâu vào:

* embedded
* operating system
* network packet processing
* high performance computing
* database engine
* AI inference runtime

thì cache, TLB và virtual memory là các chủ đề gần như bắt buộc phải hiểu.

---

## 4.16. Tóm tắt ngắn phần này

Nếu cần nhớ thật ngắn:

* **register**: nơi CPU làm việc nhanh nhất
* **cache**: bộ đệm cho dữ liệu/lệnh
* **TLB**: bộ đệm cho ánh xạ địa chỉ
* **virtual memory**: không gian địa chỉ ảo riêng của mỗi process
* **RAM**: lớn nhưng chậm hơn nhiều

Một lần truy cập bộ nhớ thường không chỉ là “đọc RAM”, mà là cả một chuỗi:

**virtual address → TLB → cache → RAM → register**

---

## 4.17. Sơ đồ ASCII: virtual address → TLB → cache → RAM → register

Để dễ hình dung, có thể tưởng tượng một lệnh load dữ liệu đi qua các bước như sau:

```text
                    +-------------------------+
                    |   CPU thực thi lệnh     |
                    |   mov / load / store    |
                    +-----------+-------------+
                                |
                                v
                    +-------------------------+
                    |   Virtual Address (VA)  |
                    |  địa chỉ ảo của process |
                    +-----------+-------------+
                                |
                                v
                    +-------------------------+
                    |           TLB           |
                    | cache ánh xạ VA -> PA  |
                    +-----------+-------------+
                                |
                 +--------------+--------------+
                 |                             |
                 | TLB hit                     | TLB miss
                 v                             v
      +----------------------+      +---------------------------+
      | có sẵn ánh xạ        |      | page table walk          |
      | VA page -> PA frame  |      | tra bảng trang trong RAM |
      +----------+-----------+      +-------------+-------------+
                 |                                |
                 +---------------+----------------+
                                 |
                                 v
                    +-------------------------+
                    | Physical Address (PA)   |
                    | địa chỉ vật lý tương ứng|
                    +-----------+-------------+
                                |
                                v
                    +-------------------------+
                    |      Cache hierarchy    |
                    |    L1 -> L2 -> L3       |
                    +-----------+-------------+
                                |
              +-----------------+------------------+
              |                                    |
              | Cache hit                          | Cache miss
              v                                    v
    +-----------------------+         +--------------------------+
    | lấy dữ liệu rất nhanh |         | xuống RAM lấy cache line |
    +-----------+-----------+         +-------------+------------+
                |                                   |
                +----------------+------------------+
                                 |
                                 v
                    +-------------------------+
                    |        Register         |
                    |  dữ liệu vào thanh ghi  |
                    +-----------+-------------+
                                |
                                v
                    +-------------------------+
                    |     ALU / Execute       |
                    | dùng dữ liệu để tính toán|
                    +-------------------------+
```

Nếu rút gọn thật ngắn, ta có chuỗi tư duy:

```text
Virtual Address
    -> TLB
    -> Physical Address
    -> Cache (L1/L2/L3)
    -> RAM nếu miss
    -> Register
    -> ALU
```

### Điểm cần nhớ trong sơ đồ này

* **TLB** không chứa dữ liệu thực tế của biến, mà chứa **ánh xạ địa chỉ**
* **cache** chứa **dữ liệu/lệnh** đã được nạp gần đây
* **register** là nơi CPU dùng trực tiếp để tính toán
* nếu **TLB miss** thì phải tra page table
* nếu **cache miss** thì phải xuống mức nhớ thấp hơn hoặc xuống RAM

Nói ngắn gọn:

* **TLB trả lời**: “địa chỉ ảo này map tới đâu?”
* **cache trả lời**: “dữ liệu ở chỗ đó đã nằm gần CPU chưa?”

---

## 4.18. Ví dụ C: vì sao quét mảng tuần tự nhanh hơn truy cập ngẫu nhiên?

Một ví dụ rất điển hình để thấy tác động của cache locality là so sánh:

* **quét tuần tự** qua mảng
* **truy cập ngẫu nhiên** qua mảng

### Ý tưởng

Nếu truy cập tuần tự:

* CPU tận dụng được **spatial locality**
* một cache line vừa được nạp lên thường chứa luôn nhiều phần tử kế bên
* các lần đọc tiếp theo có khả năng **cache hit** cao hơn

Nếu truy cập ngẫu nhiên:

* locality kém hơn nhiều
* dễ phát sinh nhiều cache miss hơn
* CPU phải chờ dữ liệu từ mức nhớ thấp hơn thường xuyên hơn

### Ví dụ C minh họa

```c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

#define N (16 * 1024 * 1024)

double now_seconds(void)
{
    return (double)clock() / CLOCKS_PER_SEC;
}

void shuffle(int *idx, int n)
{
    for (int i = n - 1; i > 0; --i)
    {
        int j = rand() % (i + 1);
        int tmp = idx[i];
        idx[i] = idx[j];
        idx[j] = tmp;
    }
}

int main(void)
{
    int *a = (int *)malloc(N * sizeof(int));
    int *idx = (int *)malloc(N * sizeof(int));

    if (a == NULL || idx == NULL)
    {
        printf("malloc failed");
        free(a);
        free(idx);
        return 1;
    }

    for (int i = 0; i < N; ++i)
    {
        a[i] = i & 1023;
        idx[i] = i;
    }

    srand(12345);
    shuffle(idx, N);

    volatile long long sum = 0;

    double t1 = now_seconds();
    for (int i = 0; i < N; ++i)
    {
        sum += a[i];
    }
    double t2 = now_seconds();

    for (int i = 0; i < N; ++i)
    {
        sum += a[idx[i]];
    }
    double t3 = now_seconds();

    printf("sum = %lld", sum);
    printf("sequential access : %.6f s", t2 - t1);
    printf("random access     : %.6f s", t3 - t2);

    free(a);
    free(idx);
    return 0;
}
```

### Cách hiểu kết quả

Thông thường bạn sẽ thấy:

* phần **sequential access** nhanh hơn rõ rệt
* phần **random access** chậm hơn đáng kể

Lý do không phải vì phép cộng khác nhau, mà vì **kiểu truy cập bộ nhớ khác nhau**.

Ở vòng lặp tuần tự:

```c
sum += a[i];
```

khi CPU nạp một cache line chứa `a[i]`, rất có thể cache line đó cũng đã chứa luôn:

* `a[i + 1]`
* `a[i + 2]`
* `a[i + 3]`
* ...

nên các lần truy cập sau tận dụng được dữ liệu đã nằm sẵn trong cache.

Ngược lại, ở vòng lặp ngẫu nhiên:

```c
sum += a[idx[i]];
```

mỗi lần truy cập có thể nhảy sang một vị trí rất xa trong mảng, dẫn tới:

* locality kém
* cache line vừa nạp lên ít có cơ hội tái sử dụng ngay
* số lần cache miss tăng cao hơn
* pipeline bị stall thường xuyên hơn

---

## 4.19. Nhìn ví dụ C dưới góc cache line

Giả sử:

* `int` là 4 byte
* cache line là 64 byte

Khi đó một cache line có thể chứa khoảng:

```text
64 / 4 = 16 phần tử int
```

Nếu bạn đọc tuần tự `a[i]`, `a[i+1]`, `a[i+2]`, ... thì chỉ một lần nạp cache line có thể phục vụ nhiều phép đọc liên tiếp.

Nhưng nếu bạn đọc kiểu ngẫu nhiên như:

```text
a[100], a[900000], a[17], a[7000000], ...
```

thì gần như mỗi lần lại đụng sang một cache line khác.

Đó là lý do dù cùng là đọc `int`, tốc độ có thể khác nhau rất xa.

---

## 4.20. Ví dụ này còn liên quan tới TLB như thế nào?

Không chỉ cache bị ảnh hưởng, truy cập ngẫu nhiên trên vùng dữ liệu rất lớn còn có thể làm:

* số page bị chạm tới tăng lên
* khả năng **TLB miss** tăng lên
* CPU phải page-table walk thường xuyên hơn

Nói cách khác:

* truy cập tuần tự thường tốt cho **cache**
* truy cập quá phân tán còn làm xấu cả **TLB locality**

Đây là lý do trong các hệ thống hiệu năng cao, cách tổ chức dữ liệu trong bộ nhớ quan trọng không kém bản thân thuật toán.

---

## 5. Alignment liên quan gì đến word size?

`Alignment` là việc đặt dữ liệu ở địa chỉ phù hợp với kích thước của nó để CPU truy cập hiệu quả hơn.

Ví dụ:

* dữ liệu 4 byte thường nên đặt ở địa chỉ chia hết cho 4
* dữ liệu 8 byte thường nên đặt ở địa chỉ chia hết cho 8

### Vì sao alignment quan trọng?

Nếu dữ liệu được căn chỉnh đúng:

* CPU đọc/ghi nhanh hơn
* ít phải ghép dữ liệu từ nhiều lần truy cập
* tránh lỗi trên một số kiến trúc không cho phép unaligned access

Nếu dữ liệu bị lệch hàng:

* một số CPU vẫn chạy được nhưng chậm hơn
* một số CPU có thể phát sinh exception

Đây là lý do khi học `struct`, padding, ABI hay memory access, word size và alignment luôn đi chung với nhau.

---

## 6. “Code word” là gì và có nên dùng thuật ngữ này không?

Trong nhiều phần giải thích nhập môn, người ta hay gọi nôm na rằng mỗi lệnh máy là một **code word**. Ý tưởng đó không sai hoàn toàn, nhưng nếu viết chặt chẽ thì nên dùng thuật ngữ chuẩn hơn:

* **instruction length**
* **instruction width**

Vì vậy trong bài này, mình sẽ ưu tiên dùng **instruction length**.

### Instruction length là gì?

Đó là độ dài của một lệnh máy khi nó được lưu trong bộ nhớ chương trình và được CPU fetch vào pipeline.

Nó trả lời câu hỏi:

* một lệnh dài bao nhiêu bit?
* CPU fetch theo đơn vị nào?
* decode có đơn giản hay phức tạp?

---

## 7. Kiến trúc lệnh cố định và lệnh biến đổi

## 7.1. Lệnh độ dài cố định

Nhiều kiến trúc RISC dùng lệnh có độ dài cố định.

Ví dụ:

* **MIPS32**: mỗi lệnh 32 bit
* **RISC-V cơ bản**: mỗi lệnh chuẩn 32 bit
* **ARM mode cổ điển**: mỗi lệnh 32 bit

### Lợi ích

* fetch đơn giản
* decode đơn giản
* pipeline dễ thiết kế
* dễ mở rộng cho xử lý song song ở front-end

Ví dụ, nếu mỗi lệnh luôn dài 4 byte thì CPU chỉ cần lấy đều đặn từng khối 4 byte.

---

## 7.2. Lệnh độ dài biến đổi

Kiến trúc **x86/x64** là ví dụ điển hình cho instruction length biến đổi.

Một lệnh có thể gồm nhiều thành phần như:

* prefix
* opcode
* ModR/M
* SIB
* displacement
* immediate

Do đó độ dài lệnh có thể thay đổi tùy trường hợp.

### Hệ quả

* fetch phức tạp hơn
* decode phức tạp hơn
* CPU phải tách một luồng byte thành từng lệnh hoàn chỉnh
* front-end của CPU khó thiết kế hơn so với RISC fixed-length

Đó là một trong các lý do CPU x86 hiện đại có khối decode rất nặng.

---

## 8. Word size và instruction length khác nhau ở đâu?

Đây là phần quan trọng nhất của cả bài.

### Word size

Word size nói về **dữ liệu**:

* CPU xử lý số nguyên rộng bao nhiêu bit là tự nhiên nhất
* thanh ghi rộng bao nhiêu
* ALU tối ưu cho bao nhiêu bit
* load/store kiểu dữ liệu nào là thuận nhất

### Instruction length

Instruction length nói về **lệnh**:

* một lệnh dài bao nhiêu bit/byte
* CPU fetch và decode lệnh ra sao
* front-end của CPU đơn giản hay phức tạp

### Kết luận ngắn gọn

> **Word size = chuyện của dữ liệu**
> **Instruction length = chuyện của lệnh**

Hai khái niệm này **có thể trùng nhau**, nhưng **không phải lúc nào cũng trùng nhau**.

---

## 9. Ví dụ cụ thể để đỡ nhầm

## 9.1. MIPS32

* Word size: **32 bit**
* Instruction length: **32 bit**

Ở đây hai giá trị **trùng nhau**.

Đây là kiểu kiến trúc rất dễ học vì dữ liệu tự nhiên và lệnh đều cùng một độ rộng cơ bản.

---

## 9.2. x86-64

* Word size dữ liệu: **64 bit**
* Instruction length: **biến đổi**

Ở đây hai khái niệm **khác nhau rõ ràng**.

CPU xử lý dữ liệu 64-bit rất tự nhiên, nhưng lệnh lại không có độ dài cố định.

---

## 9.3. ARM Thumb

* tầng dữ liệu có thể là 32-bit hoặc gắn với CPU 64-bit tùy bối cảnh
* nhưng lệnh Thumb có thể dài **16 bit** hoặc **32 bit**

Ví dụ này cho thấy instruction length không nhất thiết phải giống word size.

---

## 9.4. RISC-V có compressed instruction

* RV32I: word size dữ liệu tự nhiên là 32 bit
* lệnh chuẩn: 32 bit
* compressed extension: có lệnh 16 bit

Tức là ngay cả trên một kiến trúc vốn nổi tiếng “gọn và đẹp”, instruction length vẫn có thể linh hoạt.

---

## 10. CPU thực sự dùng hai khái niệm này trong pipeline như thế nào?

![Image 1](/blog/assets/img/post/Code_size_and_code_word/69271fa6-b3c0-4964-87f3-fa5f5a69976e.png)

Để dễ hình dung, hãy nhìn pipeline đơn giản gồm 5 giai đoạn:

1. **Fetch**
2. **Decode**
3. **Execute**
4. **Memory**
5. **Write-back**

---

## 10.1. Fetch

CPU dùng **Program Counter (PC)** để lấy lệnh từ bộ nhớ.

Nếu instruction length cố định:

* PC thường tăng đều theo bước cố định
* ví dụ mỗi lần +4 byte

Nếu instruction length biến đổi:

* PC không thể luôn tăng cố định
* CPU phải biết lệnh hiện tại dài bao nhiêu sau khi decode xong mới xác định được lệnh kế tiếp

### Ở giai đoạn này, cái gì quan trọng hơn?

=> **Instruction length quan trọng hơn word size**

---

## 10.2. Decode

CPU phân tích lệnh để biết:

* opcode là gì
* dùng thanh ghi nào
* có immediate hay không
* có truy cập bộ nhớ hay không

Nếu lệnh cố định độ dài:

* decode đơn giản hơn
* logic dễ thiết kế hơn

Nếu lệnh biến đổi độ dài:

* decode khó hơn
* cần nhiều phần cứng hơn

### Ở giai đoạn này, cái gì quan trọng hơn?

=> Vẫn là **instruction length**

---

## 10.3. Execute

Sau khi decode xong, CPU bắt đầu thực hiện phép toán.

Lúc này **word size** mới thực sự nổi bật, vì nó liên quan đến:

* độ rộng toán hạng
* độ rộng thanh ghi
* độ rộng ALU

Ví dụ:

* cộng hai số 64 bit trên CPU 64 bit là trường hợp tự nhiên
* còn trên CPU 32 bit có thể phải tách thành nhiều bước 32-bit

### Ở giai đoạn này, cái gì quan trọng hơn?

=> **Word size**

---

## 10.4. Memory

Nếu lệnh cần truy cập dữ liệu trong RAM/cache, CPU phải load/store dữ liệu.

Lúc này các yếu tố quan trọng là:

* kích thước dữ liệu
* alignment
* data path
* cache line
* microarchitecture

### Ở giai đoạn này, cái gì quan trọng hơn?

=> **Word size** và **đường dữ liệu** quan trọng hơn instruction length

---

## 10.5. Write-back

Kết quả được ghi lại vào thanh ghi hoặc bộ nhớ.

Ở đây độ rộng thanh ghi và kích thước dữ liệu tiếp tục liên quan chặt tới word size.

---

```
┌──────────────────────────────────────┬─────────────────────────────────────────────┬──────────────────────────────────────────────────────────────┐
│ 1) C CODE                            │ 2) ASSEMBLY (mức khái niệm)                │ 3) PIPELINE + REGISTER / MEMORY MOVEMENT                   │
├──────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Ví dụ A:                             │ ; giả sử a, b đã ở register hoặc stack     │ Mục tiêu: cộng 2 biến số nguyên                            │
│                                      │                                             │                                                              │
│ int add(int a, int b)                │ LOAD   r1, [a]      ; nếu a ở memory        │ [1] Fetch                                                   │
│ {                                    │ LOAD   r2, [b]      ; nếu b ở memory        │     lấy bytes của LOAD / LOAD / ADD / RET                  │
│     return a + b;                    │ ADD    r0, r1, r2   ; r0 = r1 + r2          │                                                              │
│ }                                    │ RET                                          │ [2] Decode                                                  │
│                                      │                                             │     LOAD  -> cần đọc data memory                           │
│                                      │                                             │     ADD   -> cần ALU                                        │
│                                      │                                             │     RET   -> cập nhật PC                                    │
│                                      │                                             │                                                              │
│                                      │                                             │ [3] Register / Memory flow                                  │
│                                      │                                             │     Mem[a] -> r1                                            │
│                                      │                                             │     Mem[b] -> r2                                            │
│                                      │                                             │     r1 ---\                                                 │
│                                      │                                             │             +--> ALU(+) --> r0                              │
│                                      │                                             │     r2 ---/                                                 │
│                                      │                                             │                                                              │
│                                      │                                             │ [4] Write-back                                              │
│                                      │                                             │     kết quả nằm trong r0, dùng làm giá trị trả về          │
├──────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Ví dụ B:                             │ ; p là con trỏ, x là biến                  │ Mục tiêu: đọc 1 giá trị từ RAM rồi cộng với x              │
│                                      │                                             │                                                              │
│ int f(int *p, int x)                 │ LOAD   r1, [p]        ; r1 = p              │ [1] Fetch                                                   │
│ {                                    │ LOAD   r2, [r1]       ; r2 = *p             │     lấy bytes của LOAD p / LOAD [r1] / LOAD x / ADD / RET  │
│     return *p + x;                   │ LOAD   r3, [x]        ; r3 = x              │                                                              │
│ }                                    │ ADD    r0, r2, r3                           │ [2] Decode                                                  │
│                                      │ RET                                          │     LOAD [r1] là memory access thật sự                     │
│                                      │                                             │     ADD là phép toán thuần register                        │
│                                      │                                             │                                                              │
│                                      │                                             │ [3] Register / Memory flow                                  │
│                                      │                                             │     Mem[p]  -> r1                                           │
│                                      │                                             │     r1     -> Address Gen                                   │
│                                      │                                             │     Mem[r1] -> r2        ; đọc *p                           │
│                                      │                                             │     Mem[x]  -> r3        ; nếu x chưa ở register           │
│                                      │                                             │                                                              │
│                                      │                                             │     r2 ---\                                                 │
│                                      │                                             │             +--> ALU(+) --> r0                              │
│                                      │                                             │     r3 ---/                                                 │
│                                      │                                             │                                                              │
│                                      │                                             │ [4] Điểm kỹ thuật cần nhớ                                   │
│                                      │                                             │     *p làm phát sinh truy cập data memory                  │
│                                      │                                             │     x nếu compiler giữ sẵn trong register thì có thể       │
│                                      │                                             │     không cần LOAD riêng                                   │
├──────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Ví dụ C:                             │ ; ghi dữ liệu trở lại RAM                  │ Mục tiêu: đọc 2 số, cộng, rồi ghi kết quả ra bộ nhớ        │
│                                      │                                             │                                                              │
│ void g(int *dst, int *a, int *b)     │ LOAD   r1, [dst]      ; r1 = dst            │ [1] Fetch                                                   │
│ {                                    │ LOAD   r2, [a]        ; r2 = a              │     LOAD / LOAD / LOAD / LOAD / LOAD / ADD / STORE / RET   │
│     *dst = *a + *b;                  │ LOAD   r3, [b]        ; r3 = b              │                                                              │
│ }                                    │ LOAD   r4, [r2]       ; r4 = *a             │ [2] Decode                                                  │
│                                      │ LOAD   r5, [r3]       ; r5 = *b             │     có 2 lần dereference: *a, *b                           │
│                                      │ ADD    r6, r4, r5                           │     có 1 lần ghi memory: *dst = ...                        │
│                                      │ STORE  [r1], r6                             │                                                              │
│                                      │ RET                                          │ [3] Register / Memory flow                                  │
│                                      │                                             │     Mem[dst] -> r1                                          │
│                                      │                                             │     Mem[a]   -> r2                                          │
│                                      │                                             │     Mem[b]   -> r3                                          │
│                                      │                                             │     Mem[r2]  -> r4      ; *a                                │
│                                      │                                             │     Mem[r3]  -> r5      ; *b                                │
│                                      │                                             │                                                              │
│                                      │                                             │     r4 ---\                                                 │
│                                      │                                             │             +--> ALU(+) --> r6                              │
│                                      │                                             │     r5 ---/                                                 │
│                                      │                                             │                                                              │
│                                      │                                             │     r6 -> Store Unit -> Mem[r1]                             │
│                                      │                                             │                                                              │
│                                      │                                             │ [4] Đây là mẫu kinh điển của embedded C                     │
│                                      │                                             │     đọc thanh ghi / RAM -> xử lý -> ghi lại                │
├──────────────────────────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Ví dụ D:                             │ ; có biến cục bộ tạm                        │ Mục tiêu: thấy local variable thường ở stack hoặc register │
│                                      │                                             │                                                              │
│ int h(int a, int b)                  │ LOAD   r1, [a]                              │ [1] Nếu compiler không tối ưu                               │
│ {                                    │ LOAD   r2, [b]                              │     a,b có thể được load từ stack frame                    │
│     int y = a + b;                   │ ADD    r3, r1, r2      ; y                  │                                                              │
│     return y + 5;                    │ ADDI   r0, r3, #5                           │ [2] Nếu compiler tối ưu tốt                                 │
│ }                                    │ RET                                          │     có thể gộp thành:                                       │
│                                      │                                             │         r0 = a + b + 5                                     │
│                                      │                                             │                                                              │
│                                      │                                             │ [3] Register / Memory flow                                  │
│                                      │                                             │     r1 ---\                                                 │
│                                      │                                             │             +--> ALU(+) --> r3 (= y)                        │
│                                      │                                             │     r2 ---/                                                 │
│                                      │                                             │                                                              │
│                                      │                                             │     r3 ---\                                                 │
│                                      │                                             │             +--> ALU(+) --> r0                              │
│                                      │                                             │      5 ---/                                                 │
│                                      │                                             │                                                              │
│                                      │                                             │ [4] Ý chính                                                 │
│                                      │                                             │     local variable không nhất thiết phải nằm RAM           │
│                                      │                                             │     compiler rất thích giữ nó trong register               │
└──────────────────────────────────────┴─────────────────────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

## 11. Một chỗ rất dễ nhầm: chữ “word” trong x86

Trong họ x86, do lịch sử để lại, các từ sau có nghĩa rất cụ thể:

* **byte** = 8 bit
* **word** = 16 bit
* **doubleword (dword)** = 32 bit
* **quadword (qword)** = 64 bit

Cho nên khi đọc assembly x86, chữ **word** nhiều khi chỉ đơn giản có nghĩa là **16 bit**, chứ không phải “độ rộng tự nhiên của CPU”.

Đây là nguồn gốc của rất nhiều hiểu nhầm ở người mới học assembly.

---

## 12. “CPU 64-bit” có nghĩa chính xác là gì?

Khi nói một CPU là 64-bit, trong phần lớn bối cảnh nhập môn, điều đó thường ngụ ý rằng:

* thanh ghi tổng quát rộng 64 bit
* ALU xử lý dữ liệu 64-bit một cách tự nhiên
* môi trường phần mềm thường dùng con trỏ 64 bit

Nhưng không nên hiểu cứng rằng mọi thành phần đều tuyệt đối là 64 bit theo cùng một nghĩa.

Ví dụ:

* địa chỉ ảo thực tế có thể không dùng đủ 64 bit
* địa chỉ vật lý có thể nhỏ hơn 64 bit
* bus dữ liệu và cache line phụ thuộc vào vi kiến trúc cụ thể

Nói cách khác:

> **“64-bit CPU” là mô tả ở mức kiến trúc tổng quát, không phải một nhãn khiến mọi thông số bên trong đều giống nhau hoàn toàn.**

---

## 13. Tóm tắt cực ngắn

### Word size

* là độ rộng dữ liệu CPU xử lý tự nhiên nhất
* gắn với thanh ghi, ALU, load/store, alignment
* thường liên quan mạnh đến kiểu dữ liệu và con trỏ

### Instruction length

* là độ dài lệnh máy
* gắn với fetch và decode
* có thể cố định hoặc biến đổi

### Quan hệ giữa hai khái niệm

* đôi khi trùng nhau
* nhưng không bắt buộc
* phải tách rõ **dữ liệu** và **lệnh**

---

## 14. Kết luận

Nếu nhìn CPU theo hướng pipeline, có thể nhớ rất nhanh như sau:

* **instruction length** ảnh hưởng mạnh tới **fetch** và **decode**
* **word size** ảnh hưởng mạnh tới **execute**, **register**, **load/store** và **alignment**

Nếu nhìn theo góc độ kiến trúc:

* **RISC** thường chuộng lệnh cố định, decode đơn giản hơn
* **CISC** như x86 dùng lệnh biến đổi, decode phức tạp hơn nhưng linh hoạt hơn

Nếu nhìn theo góc độ lập trình hệ thống:

* word size giúp hiểu kiểu dữ liệu, thanh ghi, ABI, pointer
* instruction length giúp hiểu assembler, pipeline và front-end CPU

Tóm lại, chỉ cần nhớ đúng một câu là đủ:

> **Word size nói về dữ liệu. Instruction length nói về lệnh.**

Và đó là nền tảng rất quan trọng để đi tiếp sang:

* assembly
* compiler backend
* operating system
* embedded systems
* performance optimization
* computer architecture

---


