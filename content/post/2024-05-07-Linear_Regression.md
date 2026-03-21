---
title: Linear Regression
author: rainer
date: 2023-07-28 1:26:00 +0300
categories: [AI, Machine learning]
tags: [Machine learning, AI]
math: true
mermaid: true
render_with_liquid: false
image:
    path: 
---



# Dạng của Linear Regression
- Phương trình này cho thấy cách mô hình dự đoán giá trị $\hat{y}$ sử dụng hồi quy tuyến tính. Các hệ số $w = [w_0, w_1, w_2, w_3]^T$ là trọng số của mô hình, và $X = [1, x_1, x_2, x_3]$ là vector đặc trưng đã được mở rộng bằng cách thêm vào số 1 để tính toán tiện lợi hơn, bao gồm cả hệ số tự do $w_0$. Phép nhân vector $Xw$ cho ra giá trị dự đoán $\hat{y}$, thay thế cho giá trị thực tế $y$.

# Sai số dự đoán
- Sai số dự đoán được tính bằng cách lấy trung bình bình phương của sai số giữa giá trị thực tế $y$ và giá trị dự đoán $\hat{y}$, biểu diễn bởi công thức:

$$
  \frac{1}{2} e^2 = \frac{1}{2} (y - \hat{y})^2 = \frac{1}{2} (y - Xw)^2
$$

Hệ số $\frac{1}{2}$ được thêm vào để thuận tiện cho việc tính toán, đặc biệt là khi lấy đạo hàm (vì đạo hàm của $x^2$ là $2x$, nên $\frac{1}{2}$ sẽ hủy bỏ số 2 này).

Câu hỏi được đặt ra là tại sao không sử dụng trị tuyệt đối|[e]|mà lại sử dụng bình phương $e^2$ ? 

Lý do chính là khi sử dụng trị tuyệt đối, hàm mất mát trở nên không khả vi (không thể lấy đạo hàm tại tất cả các điểm) do tính không liên tục tại điểm 0, điều này làm khó khăn cho việc tối ưu hóa bằng các thuật toán dựa trên đạo hàm như gradient descent. Ngược lại, bình phương sai số là hàm khả vi và có đạo hàm liên tục, giúp việc tối ưu hóa hiệu quả hơn trong hầu hết các trường hợp.

Hy vọng rằng phần giải thích này giúp bạn hiểu rõ hơn về cách thức hoạt động và lựa chọn trong mô hình hồi quy tuyến tính.

# Giải quyết Bài Toán Hồi Quy Tuyến Tính
Hình ảnh thứ hai bạn cung cấp mô tả cách giải quyết bài toán hồi quy tuyến tính (Linear Regression) bằng cách tìm nghiệm của hàm mất mát bình phương sai số nhỏ nhất (Least Squares), và các kỹ thuật liên quan để giải quyết vấn đề này.



# Hàm Mất Mát
- **Hàm mất mát $L(w)$**: Được định nghĩa là tổng bình phương sai số giữa giá trị dự đoán và giá trị thực tế trên tập dữ liệu, và mục tiêu là tối thiểu hóa hàm mất mát này. Công thức của hàm mất mát là:
- 
$$
  L(w) = \frac{1}{2} \sum_{i=1}^N (y_i - x_i^T w)^2
$$

ở đây $y$ là vector chứa tất cả các giá trị đầu ra thực tế, $X$ là ma trận dữ liệu đầu vào, mỗi hàng là một điểm dữ liệu, và $w$ là vector trọng số cần tìm.

- **Biểu diễn vector và ma trận**: $L(w)$ có thể được biểu diễn dưới dạng norm của Euclid như sau:
- 
$$
  L(w) = \frac{1}{2} \|y - Xw\|^2
$$


# Nghiệm cho bài toán Linear Regression

**Đạo hàm hàm mất mát:**
- Đạo hàm của hàm mất mát $L(w)$ theo trọng số $w$ được tính như sau:
$$
  \frac{\partial L}{\partial w} = X^T(Xw - y)
$$

Công thức này dựa trên việc tính gradient của hàm mất mát, mà ở đây là tổng bình phương sai số giữa giá trị dự đoán và giá trị thực tế.

**Phương trình đạo hàm bằng 0:**
- Để tìm điểm tối thiểu của hàm mất mát, ta cần đặt đạo hàm này bằng 0:
$$
  X^TXw = X^Ty
$$

Phương trình này còn được gọi là phương trình chuẩn (normal equation) của hồi quy tuyến tính.

**Giải pháp cho phương trình:**
- Nếu ma trận $X^TX$ khả nghịch (non-singular hay invertible), thì nghiệm duy nhất của phương trình là:
  $$
  w = (X^TX)^{-1}X^Ty
  $$
  Đây là phương trình giải cho trọng số $w$ khi ma trận $X$ có đủ rank (các cột độc lập tuyến tính).

- Trong trường hợp ma trận $X^TX$ không khả nghịch (ví dụ, do đa cộng tuyến giữa các biến), ta sử dụng nghiệm giả nghịch (pseudo-inverse), ký hiệu là $A^+$, để tìm nghiệm:
  $$
  w = (X^TX)^+X^Ty
  $$
  Trong đó, $(X^TX)^+$ là ma trận pseudo-inverse của $X^TX$, thường được tính bằng các phương pháp như SVD (Phân tích giá trị suy biến).

### Tóm Lược
- Phương trình $X^TXw = X^Ty$ là cốt lõi trong giải pháp tìm nghiệm cho bài toán hồi quy tuyến tính.
- Nghiệm $w = (X^TX)^{-1}X^Ty$ chỉ tồn tại khi $X^TX$ khả nghịch. Nếu không, sử dụng pseudo-inverse để giải quyết vấn đề đa cộng tuyến.

Thông qua những giải thích này, bạn có thể hiểu sâu hơn về cách thức xây dựng và giải quyết mô hình hồi quy tuyến tính bằng cách tìm nghiệm tối ưu cho hàm mất mát, đồng thời giải quyết các vấn đề phức tạp liên quan đến đa cộng tuyến.