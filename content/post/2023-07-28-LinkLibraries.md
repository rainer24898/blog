---
title: Link Libraries 
author: rainer
date: 2023-07-28 1:26:00 +0300
categories: [Linux, Linux Programming, Link Libraries]
tags: [Linux, Linux Programming, Link Libraries]
math: true
mermaid: true
render_with_liquid: false
image:
    path: /assets/img/post/Makefile_Lib/title.png
---

# Make file

## Make file là gì?

Make file là một script bên trong có chứa các thông tin:
- Cấu trúc của một project(file, dependency).
- Các command line dùng để tạo-hủy file.

Chương trình make sẽ đọc nội dung trong Makefile và thực thi nó.

## Cấu trúc của Make file

```
target: dependencies
    commands
```

## Ví dụ về Make file

```
# Biến CC định nghĩa trình biên dịch
CC = gcc

# Biến CFLAGS định nghĩa các tùy chọn cho trình biên dịch
CFLAGS = -I.

# Quy tắc cho chương trình 'program'
program: main.o functions.o
    $(CC) -o program main.o functions.o

# Quy tắc cho 'main.o'
main.o: main.c functions.h
    $(CC) -c main.c $(CFLAGS)

# Quy tắc cho 'functions.o'
functions.o: functions.c functions.h
    $(CC) -c functions.c $(CFLAGS)

# Quy tắc 'clean' để xóa các file tạm
clean:
    rm *.o program
```

Makefile giúp tự động hóa và đơn giản hóa quá trình biên dịch, đặc biệt trong các dự án lớn với nhiều file nguồn. Bằng cách sử dụng Makefile, bạn có thể tiết kiệm thời gian và công sức, cũng như giảm thiểu lỗi trong quá trình xây dựng chương trình.

# Compiling a C program

Việc biên dịch một chương trình C gồm có một số bước quan trọng và có thể được tự động hóa bằng Makefile, như đã mô tả ở trên. Dưới đây, tôi sẽ phân tích quá trình biên dịch một chương trình C và cung cấp ví dụ.

Quá trình biên dịch một chương trình C:

1. Preprocessing (Tiền xử lý): Bao gồm việc xử lý các chỉ thị tiền xử lý như #include, #define và các macro.

1. Compilation (Biên dịch): Biên dịch các file mã nguồn C thành mã ngôn ngữ máy (assembly code).

1. Assembly (Lắp ráp): Biên dịch mã ngôn ngữ máy thành mã máy (object code).

1. Linking (Liên kết): Liên kết tất cả các mã máy thành một file thực thi

## Giai đoạn tiền xử lý (Pre-processing)

- Loại bỏ comments
- Mở rộng các macros
- Mở rộng các include file
- Biên dịch các câu lệnh điều kiện
- Kết quả thu được sau bước này là một file ".i"

## Giai đoạn dịch ngôn ngữ bậc cao sang Assembly  (Compilation)

- Ở giai đoạn này, mã nguồn sẽ tiếp tục thực hiện biên dịch từ file “.i” thu được ở bước trước thành một file “.s” (assembly).

- Ở giai đoạn này, mã nguồn sẽ tiếp tục thực hiện biên dịch từ file “.i” thu được ở bước trước thành một file “.s” (assembly).

## Biên dịch mã ngôn ngữ máy thành mã máy (object code)

- File “.s” ở giai đoạn trước tiếp tục được sử dụng cho giai đoạn này.
- Thông qua assembler, output mà chúng ta thu được là một file “.o”. Đây là file chứa các chỉ lệnh cấp độ ngôn ngữ máy (machine language).

## Giai đoạn Linking

- Mỗi một file “.o” thu được ở gian đoạn Assembly là một phần của chương trình. 
- Ở giai đoạn linking sẽ liên kết chúng để thu được một file thực thi hoàn chỉnh.

# Static Lib and Share Lib

Thư viện là một tập hợp các đoạn mã được biên dịch sẵn để có thể được sử dụng lại trong một chương trình.

Được chia ra làm 2 loại:
- Static lib
- Shared lib

![](/assets/img/post/Makefile_Lib/1.jpg)

Trong lập trình trên Linux, hai loại thư viện phổ biến là thư viện tĩnh (Static Library) và thư viện động (Shared Library). Cả hai loại này đều được sử dụng để tạo ra các chức năng mà có thể được tái sử dụng trong nhiều chương trình khác nhau, nhưng chúng khác nhau về cách liên kết và chia sẻ. Dưới đây là phân tích chi tiết và cách tạo ra chúng.

![](/assets/img/post/Makefile_Lib/2.jpg)

## Static Lib

Thư viện tĩnh (Static Library)

Tất cả các modules trong thư viện sẽ được copy vào trong file thực thi tại thời điểm biên dịch (compile time). Khi chương trình được load vào bộ nhớ, OS chỉ đặt một file thực thi duy nhất bao gồm source code và thư viện được link (Static linking)

1. Liên Kết Tĩnh (Static Linking):
Khi bạn sử dụng thư viện tĩnh, toàn bộ mã của thư viện được copy và liên kết trực tiếp vào file thực thi. Điều này đồng nghĩa với việc mọi thay đổi trong thư viện đều yêu cầu việc biên dịch lại chương trình.

2. Kích Thước File:
Do toàn bộ mã của thư viện được chèn vào file thực thi, kích thước của file thực thi thường lớn hơn so với việc sử dụng thư viện động.

3. Hiệu Năng:
Thư viện tĩnh thường có hiệu năng tốt hơn do không cần phải tải thư viện động tại thời gian chạy. Tất cả các phần đã được liên kết trước, giảm thiểu overhead.

4. Tính Di Động:
File thực thi chứa toàn bộ mã cần thiết để chạy, vì vậy nó thường dễ dàng chia sẻ và chạy trên các máy khác nhau mà không cần lo lắng về việc cài đặt thư viện động tương ứng.

5. Bảo Mật và Tính Ổn Định:
Vì mã được liên kết trực tiếp, không có sự phụ thuộc vào các file thư viện động bên ngoài, điều này giúp chương trình trở nên ổn định và ít bị ảnh hưởng bởi các thay đổi hoặc tương thích với các phiên bản thư viện khác nhau.

6. Sử Dụng:
Để sử dụng thư viện tĩnh trong dự án của bạn, bạn sẽ liên kết nó khi biên dịch chương trình. Trong GCC, bạn có thể sử dụng cờ -l cùng với tên thư viện, và cờ -L để chỉ định đường dẫn.

Cách tạo:

1. Biên dịch các file mã nguồn C thành object files:

```
gcc -c file1.c file2.c
```

2. Tạo thư viện tĩnh từ các object files:

```
ar rcs libmystatic.a file1.o file2.o
```

Cách sử dụng:

Liên kết thư viện tĩnh vào chương trình trong quá trình biên dịch

```
gcc main.c -L. -lmystatic -o myprogram
```

Ưu, nhược điểm:
- Ưu điểm: Thư viện tĩnh cung cấp một cách hiệu quả và ổn định để tái sử dụng mã nguồn trong các dự án khác nhau. Nó thích hợp cho việc phân phối mã nguồn mà không cần phải đi kèm các file thư viện động, và thường được sử dụng trong các ứng dụng mà hiệu năng và tính ổn định là yếu tố quan trọng.
- Nhược điểm: 
  - Tăng kích thước file thực thi, cập nhật được thư viện cần phải biên dịch lại chương trình.
  - Sử dụng static lib tốn nhiều bộ nhớ hơn shared lib.
  - Mất nhiều thời gian hơn để thực thi.

## Shared Library 

Thư viện động (Shared Library)

Trong khi đó, shared lib được sử dụng trong quá trình link khi mà cả file thực thi và file thư viện đều được load vào bộ nhớ (runtime). Một shared lib có thể được nhiều chương trình sử dụng. (Dynamic linking).

1. Liên Kết Động (Dynamic Linking):
Khác với thư viện tĩnh, thư viện động không được liên kết trực tiếp vào file thực thi. Thay vào đó, nó được tải và liên kết vào chương trình tại thời điểm chạy.

2. Chia Sẻ Trong Bộ Nhớ:
Một trong những ưu điểm lớn của thư viện động là khả năng chia sẻ giữa các chương trình. Nhiều chương trình khác nhau có thể sử dụng cùng một thư viện động, tiết kiệm bộ nhớ.

3. Cập Nhật và Bảo Trì:
Việc sử dụng thư viện động cho phép cập nhật thư viện mà không cần phải biên dịch lại chương trình sử dụng thư viện đó. Điều này giúp việc bảo trì và cập nhật trở nên dễ dàng hơn.

4. Kích Thước File:
File thực thi khi sử dụng thư viện động thường nhỏ hơn so với việc sử dụng thư viện tĩnh, vì chỉ có tham chiếu đến thư viện động chứ không chèn mã thư viện vào file thực thi.

5. Tính Linh Hoạt:
Thư viện động giúp tăng tính linh hoạt khi phát triển, cho phép thêm, xóa, hoặc cập nhật chức năng mà không cần phải thay đổi chương trình.

6. Biên Dịch và Link:
Để liên kết với thư viện động trong GCC, bạn cũng sử dụng các cờ -l và -L giống như thư viện tĩnh.

Cách tạo:

1. Biên dịch các file mã nguồn C thành object files với tùy chọn -fPIC:

```
gcc -c -fPIC file1.c file2.c
```

2. Tạo thư viện động từ các object files:

```
gcc -shared -o libmyshared.so file1.o file2.o
```

Cách sử dụng:

Liên kết thư viện động vào chương trình trong quá trình biên dịch:

```
gcc main.c -L. -lmyshared -o myprogram
```

Ưu, nhược điểm:
- Ưu điểm: Thư viện động là một công cụ mạnh mẽ trong phát triển phần mềm, giúp tiết kiệm bộ nhớ, tăng tính linh hoạt và dễ dàng cập nhật. Tuy nhiên, nó cũng đòi hỏi sự quản lý cẩn thận hơn về phiên bản và tương thích, và có thể gây ra vấn đề nếu một phiên bản cụ thể của thư viện không tồn tại trên hệ thống mục tiêu.
- Nhược điểm: Phải đảm bảo thư viện động tồn tại trên hệ thống khi chạy chương trình, có thể gây ra vấn đề về tương thích phiên bản.

# Tại sao nên build ra file .o trước mà không  build trực tiếp file thực thi

1. Tăng Tốc Quá Trình Phát Triển:

Trong dự án lớn với nhiều file mã nguồn, việc biên dịch lại toàn bộ mã mỗi khi chỉ có một vài thay đổi là không hiệu quả. Việc biên dịch ra file object cho phép bạn chỉ cần biên dịch lại những phần mã đã thay đổi. Các file object không bị thay đổi có thể tái sử dụng, tiết kiệm thời gian biên dịch.

Ví Dụ:

Giả sử dự án của bạn gồm 3 file: main.c, util.c, data.c. Bạn thực hiện chỉnh sửa nhỏ trên util.c. Nếu không sử dụng file object, bạn cần biên dịch lại cả 3 file. Nhưng nếu đã biên dịch ra file object, bạn chỉ cần biên dịch lại util.c, sau đó liên kết lại 3 file object (main.o, util.o, data.o) để tạo ra chương trình thực thi mới, tiết kiệm được thời gian.

2. Tính Linh Hoạt Trong Phát Triển:

Việc biên dịch thành các file object riêng biệt cho phép bạn quản lý các phần mã khác nhau của dự án, và biên dịch chúng với các tùy chọn riêng biệt. Điều này tạo điều kiện cho việc thử nghiệm và tối ưu hóa dễ dàng hơn.

3. Khả Năng Tương Thích Với Các Dự Án Khác:

Các file object có thể được liên kết với các chương trình khác nhau. Nếu bạn có một thư viện hàm mà bạn muốn sử dụng trong nhiều dự án, việc biên dịch thành file object cho phép bạn tái sử dụng mã nguồn mà không cần phải biên dịch lại trong mỗi dự án.

4. Phát Hiện Lỗi Dễ Dàng Hơn:

Việc chia nhỏ dự án thành các phần riêng biệt giúp trong việc phát hiện và sửa lỗi. Bạn có thể dễ dàng xác định được phần mã gây ra lỗi và chỉ cần biên dịch lại phần đó mà không ảnh hưởng đến phần còn lại của dự án.

